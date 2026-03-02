/**
 * API Route: /api/searchclass
 *
 * Searches for courses by department, code, or title.
 * Uses relevance scoring to return the best matches first.
 *
 * Data source:
 * - `searchclasses` for course-level metadata (dept, code, title)
 *
 * @method POST
 * @body { query: string } - The search term (e.g., "EECS", "calculus", "MATH 101")
 * @returns Array of unique courses sorted by relevance
 *
 * @throws 400 - Invalid or missing query
 * @throws 500 - Database error
 */
import { supabase } from "../../lib/supabaseClient";

type SearchClassRow = {
  id: number;
  dept: string;
  code: string;
  title: string | null;
};

/**
 * Normalizes and analyzes the search query to determine search strategy.
 * Detects department-code patterns for more precise matching.
 */
function prepareSearchTerms(query: string) {
  const fullPhrase = query.trim().toLowerCase();
  const deptCodeMatch = fullPhrase.match(/^(\w+)\s+(\d+)/i);
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

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query || typeof query !== "string") {
      return Response.json({ error: "Invalid search query" }, { status: 400 });
    }

    const { fullPhrase, words, isDeptCodeSearch, deptPrefix, codePrefix } =
      prepareSearchTerms(query);

    if (words.length === 0) {
      return Response.json([]);
    }

    let queryBuilder = supabase
      .from("searchclasses")
      .select("id, dept, code, title");

    if (isDeptCodeSearch) {
      queryBuilder = queryBuilder
        .ilike("dept", `${deptPrefix}%`)
        .ilike("code", `${codePrefix}%`);
    } else {
      const fuzzyFilters: string[] = [
        `title.ilike.%${fullPhrase}%`,
        `dept.ilike.%${fullPhrase}%`,
        `code.ilike.%${fullPhrase}%`,
      ];

      if (words.length > 1) {
        for (const word of words) {
          fuzzyFilters.push(
            `title.ilike.%${word}%`,
            `dept.ilike.%${word}%`,
            `code.ilike.%${word}%`,
          );
        }
      }

      queryBuilder = queryBuilder.or(fuzzyFilters.join(","));
    }

    const { data, error } = await queryBuilder.limit(200);

    if (error) {
      console.error("Supabase fetch error:", error.message);
      return Response.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return Response.json([]);
    }

    const scoredByCourse = new Map<
      string,
      {
        uuid: string;
        dept: string;
        code: string;
        title: string;
        score: number;
      }
    >();

    for (const row of data as SearchClassRow[]) {
      let score = 0;
      const deptLower = row.dept.toLowerCase();
      const codeLower = row.code.toLowerCase();
      const title = row.title ?? "";
      const titleLower = title.toLowerCase();

      if (isDeptCodeSearch) {
        if (
          deptPrefix &&
          codePrefix &&
          deptLower === deptPrefix.toLowerCase() &&
          codeLower.startsWith(codePrefix.toLowerCase())
        ) {
          score += 10;
        }
      } else {
        if (titleLower.includes(fullPhrase)) {
          score += 10;
          if (titleLower.startsWith(fullPhrase)) {
            score += 5;
          }
        }

        for (const word of words) {
          if (deptLower === word || codeLower === word) {
            score += 4;
          } else if (deptLower.startsWith(word) || codeLower.startsWith(word)) {
            score += 3;
          } else if (deptLower.includes(word) || codeLower.includes(word)) {
            score += 2;
          }
          if (titleLower.includes(word)) {
            score += 1;
          }
        }
      }

      const key = `${row.dept}-${row.code}`;
      const candidate = {
        uuid: row.id.toString(),
        dept: row.dept,
        code: row.code,
        title,
        score,
      };

      const existing = scoredByCourse.get(key);
      if (!existing || candidate.score > existing.score) {
        scoredByCourse.set(key, candidate);
      }
    }

    return Response.json(
      Array.from(scoredByCourse.values())
        .sort((a, b) => {
          if (b.score !== a.score) {
            return b.score - a.score;
          }
          if (a.dept !== b.dept) {
            return a.dept.localeCompare(b.dept);
          }

          const aNum = Number.parseInt(a.code, 10);
          const bNum = Number.parseInt(b.code, 10);
          if (Number.isNaN(aNum) || Number.isNaN(bNum)) {
            return a.code.localeCompare(b.code);
          }
          return aNum - bNum;
        })
        .map(({ score, ...course }) => course),
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Server crash:", errorMessage);
    return Response.json(
      { error: "Server error", details: errorMessage },
      { status: 500 },
    );
  }
}
