/**
 * API Route: /api/getClasses
 *
 * Retrieves all classes in a schedule, grouped by department and course code.
 * Course metadata is joined from `searchclasses`.
 *
 * @method POST
 * @body { scheduleid: string }
 * @returns Array of { deptcode: string, selClass: Array<{classid, uuid}> }
 */
import { supabase } from "../../lib/supabaseClient";

type SearchClassMeta = {
  dept: string;
  code: string;
};

type ClassRow = {
  uuid: string;
  classid: number;
  searchclass: SearchClassMeta | SearchClassMeta[] | null;
};

function pickSearchClassMeta(
  value: SearchClassMeta | SearchClassMeta[] | null,
): SearchClassMeta {
  if (Array.isArray(value)) {
    return value[0] ?? { dept: "", code: "" };
  }
  return value ?? { dept: "", code: "" };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { scheduleid } = body;

    if (!scheduleid) {
      return Response.json({ error: "Missing scheduleid" }, { status: 400 });
    }

    const { data: scheduleRows, error: scheduleErr } = await supabase
      .from("schedule_classes")
      .select("class_uuid")
      .eq("scheduleid", scheduleid);

    if (scheduleErr) {
      return Response.json(
        { error: "Failed to fetch schedule classes" },
        { status: 500 },
      );
    }

    if (!scheduleRows || scheduleRows.length === 0) {
      return Response.json(
        { error: "No classes found for this scheduleid" },
        { status: 404 },
      );
    }

    const classUuids = scheduleRows.map((item) => item.class_uuid);
    const { data: classRows, error: classErr } = await supabase
      .from("allclasses")
      .select(
        "uuid,classid,searchclass:searchclasses!allclasses_searchclass_fkey(dept,code)",
      )
      .in("uuid", classUuids);

    if (classErr || !classRows) {
      return Response.json(
        { error: "Class info fetch failed" },
        { status: 500 },
      );
    }

    const classRowMap = new Map<string, ClassRow>();
    for (const classRow of classRows as ClassRow[]) {
      classRowMap.set(classRow.uuid, classRow);
    }

    const deptCodeMap: { [key: string]: { classid: string; uuid: string }[] } =
      {};

    for (const { class_uuid } of scheduleRows) {
      const classRow = classRowMap.get(class_uuid);
      if (!classRow) continue;

      const course = pickSearchClassMeta(classRow.searchclass);
      const deptcode = `${course.dept} ${course.code}`.trim();

      if (!deptCodeMap[deptcode]) deptCodeMap[deptcode] = [];
      deptCodeMap[deptcode].push({
        classid: classRow.classid?.toString() || "",
        uuid: classRow.uuid,
      });
    }

    const output = Object.entries(deptCodeMap).map(([deptcode, selClass]) => ({
      deptcode,
      selClass,
    }));

    return Response.json(output, { status: 200 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Server error:", err);
    return Response.json(
      { error: "Server error", details: errorMessage },
      { status: 500 },
    );
  }
}
