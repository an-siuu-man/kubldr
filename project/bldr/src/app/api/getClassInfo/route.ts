/**
 * API Route: /api/getClassInfo
 * 
 * Retrieves detailed information about a specific course and all its sections.
 * Returns course metadata (dept, code, title) along with all section details
 * including times, instructor, room, and seat availability.
 * 
 * @method POST
 * @body {
 *   subject: string, // Format: "DEPT CODE" (e.g., "EECS 581")
 *   term?: string    // Optional term code (not currently used)
 * }
 * @returns { success: true, data: Array<CourseInfo> }
 * 
 * @throws 400 - Missing subject or invalid format
 * @throws 500 - Database error
 */
import { supabase } from "../../lib/supabaseClient";

/**
 * Parses start and end times and calculates duration in hours.
 * Handles both 12-hour (with AM/PM) and 24-hour time formats.
 * 
 * @param {string} start - Start time string
 * @param {string} end - End time string
 * @returns {number} Duration in hours (decimal)
 */
function parseTimeToFloat(start: string, end: string): number {
  /**
   * Converts a time string to 24-hour decimal format.
   * Handles "HH:MM" (24-hour) and "HH:MM AM/PM" (12-hour) formats.
   */
  const to24 = (timeStr: string): number => {
    // If already in 24-hour format or missing AM/PM, parse directly
    if (!/AM|PM/i.test(timeStr)) {
      const [hours, minutes] = timeStr.split(":").map(Number);
      return hours + (minutes || 0) / 60;
    }
    // Convert from 12-hour format with AM/PM
    const [time, meridian] = timeStr.trim().split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (meridian.toUpperCase() === "PM" && hours !== 12) hours += 12;
    if (meridian.toUpperCase() === "AM" && hours === 12) hours = 0;
    return hours + (minutes || 0) / 60;
  };

  try {
    return parseFloat((to24(end) - to24(start)).toFixed(2));
  } catch {
    return 0;
  }
}

/**
 * POST handler for getting detailed class/course information.
 * Fetches all sections for a given course from the database.
 * 
 * @param {Request} req - The incoming request with subject
 * @returns {Response} JSON response with course and sections data
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { subject, term } = body;

    if (!subject) {
      return Response.json({ error: "Missing subject" }, { status: 400 });
    }

    // Parse subject into department and code (e.g., "EECS 581")
    const parts = subject.trim().split(/\s+/);
    if (parts.length < 2) {
      return Response.json(
        { error: 'Invalid subject format. Expected "DEPT CODE"' },
        { status: 400 }
      );
    }

    const dept = parts[0];
    const code = parts[1];

    // Fetch all sections for this course, ordered by component and ID
    const { data: sections, error: fetchErr } = await supabase
      .from("allclasses")
      .select("*")
      .eq("dept", dept)
      .eq("code", code)
      .order("component", { ascending: true })
      .order("classid", { ascending: true });

    if (fetchErr) {
      console.error("❌ Database fetch error:", fetchErr);
      return Response.json(
        { error: "Database query failed", details: fetchErr.message },
        { status: 500 }
      );
    }

    // Return empty array if no sections found
    if (!sections || sections.length === 0) {
      return Response.json({ success: true, data: [] }, { status: 200 });
    }

    // Transform each section into the expected format
    const courseSections = sections.map((section) => {
      const duration = parseTimeToFloat(
        section.starttime || "",
        section.endtime || ""
      );

      return {
        classID: section.classid.toString(),
        uuid: section.uuid,
        component: section.component,
        starttime: section.starttime,
        endtime: section.endtime,
        days: section.days,
        instructor: section.instructor,
        seats_available: section.availseats ?? 0,
        room: section.room,
        location: section.location,
        credithours: section.credithours,
        duration,
      };
    });

    // Build response with course info and all its sections
    const responseToFrontend = [
      {
        dept: sections[0].dept,
        code: sections[0].code,
        title: sections[0].title,
        description: null, // Description not stored in DB
        
        sections: courseSections,
      },
    ];

    return Response.json(
      { success: true, data: responseToFrontend },
      { status: 200 }
    );
  } catch (err) {
    console.error("getClassInfo server error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return Response.json(
      { error: "Server error", details: errorMessage },
      { status: 500 }
    );
  }
}
