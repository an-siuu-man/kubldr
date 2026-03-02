/**
 * API Route: /api/searchclass
 *
 * Searches for classes by department, code, or title.
 * Uses intelligent matching with relevance scoring to provide
 * the best results first. Supports both exact matches and fuzzy searching.
 *
 * @method POST
 * @body { query: string } - The search term (e.g., "EECS", "calculus", "MATH 101")
 * @returns Array of unique classes sorted by relevance
 *
 * Search Behavior:
 * - Department-code searches (e.g., "EECS 5") use precise prefix matching
 * - Regular searches use broader fuzzy matching on title, dept, and code
 * - Results are deduplicated by dept+code combination
 * - Sorted by relevance score, then alphabetically
 *
 * @throws 400 - Invalid or missing query
 * @throws 500 - Database error
 */
import { supabase } from "../../lib/supabaseClient";

/**
 * Normalizes and analyzes the search query to determine search strategy.
 * Detects department-code patterns for more precise matching.
 *
 * @param {string} query - Raw search query from user
 * @returns {object} Parsed search terms and strategy flags
 */
function prepareSearchTerms(query: string) {
  const fullPhrase = query.trim().toLowerCase();

  // Check if search looks like "DEPT CODE" pattern (e.g., "eecs 2", "math 101")
  const deptCodeMatch = fullPhrase.match(/^(\w+)\s+(\d+)/i);

  // Split into individual words for multi-term matching
  const words = fullPhrase
    .split(/\s+/)
    .filter((term: string) => term.length > 0);

  return {
    fullPhrase,
    words,
    isDeptCodeSearch: !!deptCodeMatch,
    deptPrefix: deptCodeMatch ? deptCodeMatch[1] : null,
    codePrefix: deptCodeMatch ? deptCodeMatch[2] : null,
  };
}

/**
 * POST handler for searching classes.
 * Performs database query with relevance scoring and deduplication.
 *
 * @param {Request} req - The incoming request with search query
 * @returns {Response} JSON array of matching classes
 */
export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    // Validate query parameter
    if (!query || typeof query !== "string") {
      return Response.json({ error: "Invalid search query" }, { status: 400 });
    }

    // Parse and analyze the search query
    const { fullPhrase, words, isDeptCodeSearch, deptPrefix, codePrefix } =
      prepareSearchTerms(query);

    // Return empty results for empty queries
    if (words.length === 0) {
      return Response.json([]);
    }

    // Build the database query
    let queryBuilder = supabase
      .from("allclasses")
      .select("uuid, dept, code, title, days, credithours, instructor");

    if (isDeptCodeSearch) {
      // For department-code searches (e.g., "eecs 2"), use precise prefix matching
      queryBuilder = queryBuilder
        .ilike("dept", `${deptPrefix}%`)
        .ilike("code", `${codePrefix}%`);
    } else {
      // For regular searches, use broader fuzzy matching
      queryBuilder = queryBuilder.or(
        words.length > 1
          ? `title.ilike.%${fullPhrase}%,dept.ilike.%${fullPhrase}%,code.ilike.%${fullPhrase}%,` +
              words
                .map(
                  (word: string) =>
                    `title.ilike.%${word}%,dept.ilike.%${word}%,code.ilike.%${word}%`,
                )
                .join(",")
          : `title.ilike.%${fullPhrase}%,dept.ilike.%${fullPhrase}%,code.ilike.%${fullPhrase}%`,
      );
    }

    const { data, error } = await queryBuilder;

    if (error) {
      console.error("❌ Supabase fetch error:", error.message);
      return Response.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return Response.json([]);
    }

    // Deduplicate by dept+code and calculate relevance scores
    const seen = new Map();
    const results = [];

    for (const cls of data) {
      const key = `${cls.dept}-${cls.code}`;
      if (!seen.has(key)) {
        seen.set(key, true);

        // Calculate match score (higher = more relevant)
        let score = 0;
        const deptLower = cls.dept.toLowerCase();
        const codeLower = cls.code.toLowerCase();
        const titleLower = cls.title.toLowerCase();

        if (isDeptCodeSearch) {
          // For dept-code searches, prioritize exact matches
          if (
            deptPrefix &&
            codePrefix &&
            deptLower === deptPrefix.toLowerCase() &&
            codeLower.startsWith(codePrefix)
          ) {
            score += 10;
          }
        } else {
          // Full phrase matches get highest priority
          if (titleLower.includes(fullPhrase)) {
            score += 10;
            if (titleLower.startsWith(fullPhrase)) {
              score += 5;
            }
          }

          // Score individual word matches
          words.forEach((word: string) => {
            if (deptLower === word || codeLower === word) {
              score += 4; // Exact match in dept/code
            } else if (
              deptLower.startsWith(word) ||
              codeLower.startsWith(word)
            ) {
              score += 3; // Starts with word
            } else if (deptLower.includes(word) || codeLower.includes(word)) {
              score += 2; // Contains word
            }
            if (titleLower.includes(word)) {
              score += 1; // Contains in title
            }
          });
        }

        results.push({ ...cls, score });
      }
    }

    // Sort by score (descending), then by dept and code
    return Response.json(
      results
        .sort((a, b) => {
          if (b.score !== a.score) {
            return b.score - a.score;
          }
          if (a.dept !== b.dept) {
            return a.dept.localeCompare(b.dept);
          }
          // Sort by code numerically
          const aNum = parseInt(a.code) || 0;
          const bNum = parseInt(b.code) || 0;
          return aNum - bNum;
        })
        .map(({ score, ...cls }) => cls), // Remove score from final output
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ Server crash:", errorMessage);
    return Response.json(
      { error: "Server error", details: errorMessage },
      { status: 500 },
    );
  }
}
