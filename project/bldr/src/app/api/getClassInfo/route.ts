/**
 * API Route: /api/getClassInfo
 *
 * Retrieves detailed information about a specific course and all its sections.
 * Course metadata (dept/code/title) is read from `searchclasses`, and section
 * details are read from `allclasses` via `searchclass_id`.
 *
 * @method POST
 * @body {
 *   subject: string, // Format: "DEPT CODE" (e.g., "EECS 581")
 *   term?: string    // Optional term code (currently unused)
 * }
 *
 * @throws 400 - Missing subject or invalid format
 * @throws 500 - Database error
 */
import { supabase } from "../../lib/supabaseClient";

type SearchClassRow = {
  id: number;
  dept: string;
  code: string;
  title: string | null;
};

type SectionRow = {
  uuid: string;
  classid: number;
  component: string | null;
  starttime: string | null;
  endtime: string | null;
  days: string | null;
  instructor: string | null;
  availseats: number | null;
  room: string | null;
  location: string | null;
  minhours: number | null;
  maxhours: number | null;
  searchclass_id: number;
};

function parseTimeToFloat(start: string, end: string): number {
  const to24 = (timeStr: string): number => {
    if (!/AM|PM/i.test(timeStr)) {
      const [hours, minutes] = timeStr.split(":").map(Number);
      return hours + (minutes || 0) / 60;
    }

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

function deriveCreditHours(minhours: number | null, maxhours: number | null) {
  if (typeof maxhours === "number") return maxhours;
  if (typeof minhours === "number") return minhours;
  return undefined;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { subject } = body;

    if (!subject) {
      return Response.json({ error: "Missing subject" }, { status: 400 });
    }

    const parts = subject.trim().split(/\s+/);
    if (parts.length < 2) {
      return Response.json(
        { error: 'Invalid subject format. Expected "DEPT CODE"' },
        { status: 400 },
      );
    }

    const dept = parts[0];
    const code = parts[1];

    const { data: courses, error: courseErr } = await supabase
      .from("searchclasses")
      .select("id, dept, code, title")
      .eq("dept", dept)
      .eq("code", code);

    if (courseErr) {
      console.error("Database fetch error (searchclasses):", courseErr);
      return Response.json(
        { error: "Database query failed", details: courseErr.message },
        { status: 500 },
      );
    }

    if (!courses || courses.length === 0) {
      return Response.json({ success: true, data: [] }, { status: 200 });
    }

    const courseIds = (courses as SearchClassRow[]).map((course) => course.id);
    const { data: sections, error: fetchErr } = await supabase
      .from("allclasses")
      .select(
        "uuid, classid, component, starttime, endtime, days, instructor, availseats, room, location, minhours, maxhours, searchclass_id",
      )
      .in("searchclass_id", courseIds)
      .order("component", { ascending: true })
      .order("classid", { ascending: true });

    if (fetchErr) {
      console.error("Database fetch error (allclasses):", fetchErr);
      return Response.json(
        { error: "Database query failed", details: fetchErr.message },
        { status: 500 },
      );
    }

    if (!sections || sections.length === 0) {
      return Response.json({ success: true, data: [] }, { status: 200 });
    }

    const primaryCourse = courses[0] as SearchClassRow;
    const courseSections = (sections as SectionRow[]).map((section) => {
      const duration = parseTimeToFloat(
        section.starttime ?? "",
        section.endtime ?? "",
      );

      return {
        classID: section.classid.toString(),
        uuid: section.uuid,
        component: section.component ?? "",
        starttime: section.starttime ?? "",
        endtime: section.endtime ?? "",
        days: section.days ?? "",
        instructor: section.instructor ?? undefined,
        seats_available: section.availseats ?? 0,
        room: section.room ?? undefined,
        location: section.location ?? undefined,
        minhours: section.minhours ?? undefined,
        maxhours: section.maxhours ?? undefined,
        credithours: deriveCreditHours(section.minhours, section.maxhours),
        duration,
      };
    });

    const responseToFrontend = [
      {
        dept: primaryCourse.dept,
        code: primaryCourse.code,
        title:
          primaryCourse.title ?? `${primaryCourse.dept} ${primaryCourse.code}`,
        description: null,
        sections: courseSections,
      },
    ];

    return Response.json(
      { success: true, data: responseToFrontend },
      { status: 200 },
    );
  } catch (err) {
    console.error("getClassInfo server error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return Response.json(
      { error: "Server error", details: errorMessage },
      { status: 500 },
    );
  }
}
