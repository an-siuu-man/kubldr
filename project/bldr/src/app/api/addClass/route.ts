/**
 * API Route: /api/addClass
 * 
 * Adds a class section to a user's schedule with conflict detection.
 * Performs validation for seat availability and time conflicts before adding.
 * 
 * @method POST
 * @body {
 *   scheduleid: string,     // UUID of the target schedule
 *   classId?: number,       // Integer class ID from allclasses table
 *   classUuid?: string,     // UUID of the class (alternative to classId)
 *   allowConflict?: boolean // If true, adds class even with time conflicts
 * }
 * 
 * @returns On success: { success: true, added: object, warnings?: object }
 * @returns On conflict: { error: string, conflicts: array, target: object }
 * 
 * @throws 400 - Missing required fields
 * @throws 404 - Class not found
 * @throws 409 - Class already in schedule, no seats, or time conflict
 * @throws 500 - Database error
 */
// api/addClass/route.ts
import { supabase } from "../../lib/supabaseClient";

/**
 * Request body type for adding a class to a schedule
 */
type AddBody = {
  scheduleid: string;      // Schedule UUID
  classId?: number;        // Integer classid in allclasses
  classUuid?: string;      // UUID in allclasses
  allowConflict?: boolean; // Allow adding even if conflict exists
};

/** Valid day characters for parsing schedule days */
const DAY_CHARS = new Set(["M", "T", "W", "R", "F", "S", "U"]); // R = Thursday, U = Sunday

/**
 * Parses a days string (e.g., "MWF") into a Set of individual day characters.
 * 
 * @param {string | null} days - The days string to parse
 * @returns {Set<string>} Set of day characters found
 */
function parseDays(days: string | null): Set<string> {
  const set = new Set<string>();
  if (!days) return set;
  for (const ch of days.trim().toUpperCase()) {
    if (DAY_CHARS.has(ch)) set.add(ch);
  }
  return set;
}

/**
 * Converts a time string ("HH:MM") to minutes since midnight.
 * 
 * @param {string | null} hhmm - Time string in "HH:MM" format
 * @returns {number | null} Minutes since midnight, or null if invalid
 */
function toMinutes(hhmm: string | null): number | null {
  if (!hhmm) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (Number.isNaN(h) || Number.isNaN(mi)) return null;
  return h * 60 + mi;
}

/**
 * Checks if two time intervals overlap.
 * 
 * @param {number} aStart - Start time of interval A (in minutes)
 * @param {number} aEnd - End time of interval A
 * @param {number} bStart - Start time of interval B
 * @param {number} bEnd - End time of interval B
 * @returns {boolean} True if intervals overlap
 */
function timesOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * POST handler for adding a class to a schedule.
 * Performs multiple validation steps:
 * 1. Resolves class by ID or UUID
 * 2. Checks if already in schedule
 * 3. Validates seat availability
 * 4. Detects time conflicts with existing classes
 * 5. Inserts the class-schedule mapping
 * 
 * @param {Request} req - The incoming request
 * @returns {Response} JSON response with result or error
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AddBody;
    const { scheduleid, classId, classUuid, allowConflict } = body;

    if (!scheduleid) {
      return Response.json({ error: "Missing scheduleid" }, { status: 400 });
    }
    if (classId == null && !classUuid) {
      return Response.json(
        { error: "Provide classId or classUuid" },
        { status: 400 }
      );
    }

    // 1) Resolve target class by id or uuid
    const { data: target, error: targetErr } = await supabase
      .from("allclasses")
      .select(
        "uuid, classid, dept, code, title, starttime, endtime, days, availseats, credithours, component, location, room, instructor"
      )
      .match(classId != null ? { classid: classId } : { uuid: classUuid! })
      .maybeSingle();

    if (targetErr) {
      console.error("[addClass] fetch target error:", targetErr);
      return Response.json({ error: "Failed to fetch class" }, { status: 500 });
    }
    if (!target) {
      return Response.json({ error: "Class not found" }, { status: 404 });
    }

    // 2) Check if already in schedule (fast path)
    {
      const { data: exists, error: existsErr } = await supabase
        .from("schedule_classes")
        .select("scheduleid, class_uuid")
        .eq("scheduleid", scheduleid)
        .eq("class_uuid", target.uuid)
        .limit(1);

      if (existsErr) {
        console.error("[addClass] exists check error:", existsErr);
        return Response.json(
          { error: "Failed to check schedule" },
          { status: 500 }
        );
      }
      if (exists && exists.length > 0) {
        return Response.json(
          { error: "Class already in schedule" },
          { status: 409 }
        );
      }
    }

    // 3) Optional: seat availability check
    if (typeof target.availseats === "number" && target.availseats <= 0) {
      return Response.json(
        { error: "No available seats for this class" },
        { status: 409 }
      );
    }

    // 4) Time conflict check against existing classes in the schedule
    const { data: existingRows, error: existingErr } = await supabase
      .from("schedule_classes")
      .select("class_uuid")
      .eq("scheduleid", scheduleid);

    if (existingErr) {
      console.error("[addClass] fetch existing error:", existingErr);
      return Response.json(
        { error: "Failed to fetch schedule contents" },
        { status: 500 }
      );
    }

    let conflicts: Array<{
      withClassId: number;
      withTitle?: string;
      withDept?: string;
      withCode?: string;
      withDays?: string | null;
      withStart?: string | null;
      withEnd?: string | null;
    }> = [];

    if (existingRows && existingRows.length > 0) {
      const existingUuids = existingRows.map((r) => r.class_uuid);

      const { data: existingClasses, error: ecErr } = await supabase
        .from("allclasses")
        .select("uuid, classid, dept, code, title, starttime, endtime, days")
        .in("uuid", existingUuids);

      if (ecErr) {
        console.error("[addClass] fetch existing class meta error:", ecErr);
        return Response.json(
          { error: "Failed to fetch existing class details" },
          { status: 500 }
        );
      }

      const tgtDays = parseDays(target.days);
      const tgtStart = toMinutes(target.starttime);
      const tgtEnd = toMinutes(target.endtime);

      if (
        tgtStart != null &&
        tgtEnd != null &&
        tgtEnd > tgtStart &&
        tgtDays.size > 0
      ) {
        for (const ec of existingClasses ?? []) {
          const ecDays = parseDays(ec.days);
          const dayOverlap = [...tgtDays].some((d) => ecDays.has(d));
          if (!dayOverlap) continue;

          const ecStart = toMinutes(ec.starttime);
          const ecEnd = toMinutes(ec.endtime);
          if (ecStart == null || ecEnd == null || ecEnd <= ecStart) continue;

          if (timesOverlap(tgtStart, tgtEnd, ecStart, ecEnd)) {
            conflicts.push({
              withClassId: ec.classid,
              withTitle: ec.title ?? undefined,
              withDept: ec.dept ?? undefined,
              withCode: ec.code ?? undefined,
              withDays: ec.days ?? null,
              withStart: ec.starttime ?? null,
              withEnd: ec.endtime ?? null,
            });
          }
        }
      }
    }

    if (conflicts.length > 0 && !allowConflict) {
      return Response.json(
        {
          error: "Time conflict detected",
          conflicts,
          target: {
            classid: target.classid,
            title: target.title,
            dept: target.dept,
            code: target.code,
            days: target.days,
            starttime: target.starttime,
            endtime: target.endtime,
          },
        },
        { status: 409 }
      );
    }

    // 5) Insert mapping (upsert ensures idempotency if raced)
    const { error: insErr } = await supabase
      .from("schedule_classes")
      .upsert([{ scheduleid, class_uuid: target.uuid }], {
        onConflict: "scheduleid,class_uuid",
        ignoreDuplicates: false,
      });

    if (insErr) {
      console.error("[addClass] insert error:", insErr);
      return Response.json(
        { error: "Failed to add class to schedule" },
        { status: 500 }
      );
    }

    return Response.json(
      {
        success: true,
        added: {
          scheduleid,
          classid: target.classid,
          title: target.title,
          dept: target.dept,
          code: target.code,
          days: target.days,
          starttime: target.starttime,
          endtime: target.endtime,
        },
        warnings:
          conflicts.length > 0 ? { timeConflicts: conflicts } : undefined,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[addClass] server error:", err);
    return Response.json(
      { error: "Internal server error", details: err?.message },
      { status: 500 }
    );
  }
}
