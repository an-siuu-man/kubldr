/**
 * API Route: /api/getClasses
 *
 * Retrieves all classes in a schedule, grouped by department and course code.
 * Returns class UUIDs and IDs organized by their dept+code combination.
 *
 * @method POST
 * @body { scheduleid: string } - The UUID of the schedule to get classes from
 * @returns Array of { deptcode: string, selClass: Array<{classid, uuid}> }
 *
 * @throws 400 - Missing scheduleid
 * @throws 404 - No classes found for the schedule
 * @throws 500 - Database error
 */
import { supabase } from "../../lib/supabaseClient";

/**
 * POST handler for getting all classes in a schedule.
 * Fetches class UUIDs from schedule_classes, then looks up
 * class details and groups them by department and code.
 *
 * @param {Request} req - The incoming request with scheduleid
 * @returns {Response} JSON array of grouped classes
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { scheduleid } = body;

    if (!scheduleid) {
      return Response.json({ error: "Missing scheduleid" }, { status: 400 });
    }

    // Step 1: Get all class UUIDs for this schedule
    const { data: userSchedule, error: userScheduleErr } = await supabase
      .from("schedule_classes")
      .select("class_uuid")
      .eq("scheduleid", scheduleid);

    if (userScheduleErr || !userSchedule || userSchedule.length === 0) {
      return Response.json(
        { error: "No classes found for this scheduleid" },
        { status: 404 },
      );
    }

    // Step 2: Look up class details (dept, code, classid) from allclasses
    const classUuids = userSchedule.map((item) => item.class_uuid);
    const { data: classInfo, error: classInfoErr } = await supabase
      .from("allclasses")
      .select("uuid, classid, dept, code")
      .in("uuid", classUuids);

    if (classInfoErr || !classInfo) {
      return Response.json(
        { error: "Class info fetch failed" },
        { status: 500 },
      );
    }

    // Step 3: Group classes by dept+code
    const deptCodeMap: { [key: string]: { classid: string; uuid: string }[] } =
      {};

    for (const { class_uuid } of userSchedule) {
      const classRow = classInfo.find((ci) => ci.uuid === class_uuid);
      if (!classRow) continue;
      const deptcode = `${classRow.dept} ${classRow.code}`;

      if (!deptCodeMap[deptcode]) deptCodeMap[deptcode] = [];
      deptCodeMap[deptcode].push({
        classid: classRow.classid?.toString() || "",
        uuid: classRow.uuid,
      });
    }

    // Step 4: Format output as array of objects
    const output = Object.entries(deptCodeMap).map(([deptcode, selClass]) => ({
      deptcode,
      selClass,
    }));
    return Response.json(output, { status: 200 });
  } catch (err: any) {
    console.error("Server error:", err);
    return Response.json(
      { error: "Server error", details: err.message },
      { status: 500 },
    );
  }
}
