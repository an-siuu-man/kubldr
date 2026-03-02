/**
 * API Route: /api/addClass
 *
 * Adds a class section to a user's schedule with conflict detection.
 * Course metadata (dept/code/title) is joined from `searchclasses`.
 *
 * @method POST
 * @body {
 *   scheduleid: string,
 *   classId?: number,
 *   classUuid?: string,
 *   allowConflict?: boolean
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
import { supabase } from "../../lib/supabaseClient";

type AddBody = {
  scheduleid: string;
  classId?: number;
  classUuid?: string;
  allowConflict?: boolean;
};

type SearchClassMeta = {
  dept: string;
  code: string;
  title: string | null;
};

type SectionWithCourse = {
  uuid: string;
  classid: number;
  starttime: string | null;
  endtime: string | null;
  days: string | null;
  availseats: number | null;
  minhours: number | null;
  maxhours: number | null;
  component: string | null;
  location: string | null;
  room: string | null;
  instructor: string | null;
  searchclass: SearchClassMeta | SearchClassMeta[] | null;
};

const DAY_CHARS = new Set(["M", "T", "W", "R", "F", "S", "U"]);

function parseDays(days: string | null): Set<string> {
  const set = new Set<string>();
  if (!days) return set;
  for (const ch of days.trim().toUpperCase()) {
    if (DAY_CHARS.has(ch)) set.add(ch);
  }
  return set;
}

function toMinutes(hhmm: string | null): number | null {
  if (!hhmm) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (Number.isNaN(h) || Number.isNaN(mi)) return null;
  return h * 60 + mi;
}

function timesOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function pickSearchClassMeta(
  value: SearchClassMeta | SearchClassMeta[] | null,
): SearchClassMeta {
  if (Array.isArray(value)) {
    return value[0] ?? { dept: "", code: "", title: "" };
  }
  return value ?? { dept: "", code: "", title: "" };
}

function deriveCreditHours(minhours: number | null, maxhours: number | null) {
  if (typeof maxhours === "number") return maxhours;
  if (typeof minhours === "number") return minhours;
  return undefined;
}

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
        { status: 400 },
      );
    }

    const targetMatch =
      classId != null ? { classid: classId } : { uuid: classUuid ?? "" };
    const { data: target, error: targetErr } = await supabase
      .from("allclasses")
      .select(
        "uuid,classid,starttime,endtime,days,availseats,minhours,maxhours,component,location,room,instructor,searchclass:searchclasses!allclasses_searchclass_fkey(dept,code,title)",
      )
      .match(targetMatch)
      .maybeSingle();

    if (targetErr) {
      console.error("[addClass] fetch target error:", targetErr);
      return Response.json({ error: "Failed to fetch class" }, { status: 500 });
    }
    if (!target) {
      return Response.json({ error: "Class not found" }, { status: 404 });
    }

    const typedTarget = target as SectionWithCourse;
    const targetCourse = pickSearchClassMeta(typedTarget.searchclass);

    {
      const { data: exists, error: existsErr } = await supabase
        .from("schedule_classes")
        .select("scheduleid, class_uuid")
        .eq("scheduleid", scheduleid)
        .eq("class_uuid", typedTarget.uuid)
        .limit(1);

      if (existsErr) {
        console.error("[addClass] exists check error:", existsErr);
        return Response.json(
          { error: "Failed to check schedule" },
          { status: 500 },
        );
      }
      if (exists && exists.length > 0) {
        return Response.json(
          { error: "Class already in schedule" },
          { status: 409 },
        );
      }
    }

    if (
      typeof typedTarget.availseats === "number" &&
      typedTarget.availseats <= 0
    ) {
      return Response.json(
        { error: "No available seats for this class" },
        { status: 409 },
      );
    }

    const { data: existingRows, error: existingErr } = await supabase
      .from("schedule_classes")
      .select("class_uuid")
      .eq("scheduleid", scheduleid);

    if (existingErr) {
      console.error("[addClass] fetch existing error:", existingErr);
      return Response.json(
        { error: "Failed to fetch schedule contents" },
        { status: 500 },
      );
    }

    const conflicts: Array<{
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
        .select(
          "uuid,classid,starttime,endtime,days,searchclass:searchclasses!allclasses_searchclass_fkey(dept,code,title)",
        )
        .in("uuid", existingUuids);

      if (ecErr) {
        console.error("[addClass] fetch existing class meta error:", ecErr);
        return Response.json(
          { error: "Failed to fetch existing class details" },
          { status: 500 },
        );
      }

      const tgtDays = parseDays(typedTarget.days);
      const tgtStart = toMinutes(typedTarget.starttime);
      const tgtEnd = toMinutes(typedTarget.endtime);

      if (
        tgtStart != null &&
        tgtEnd != null &&
        tgtEnd > tgtStart &&
        tgtDays.size > 0
      ) {
        for (const row of existingClasses ?? []) {
          const existingClass = row as SectionWithCourse;
          const ecDays = parseDays(existingClass.days);
          const dayOverlap = [...tgtDays].some((d) => ecDays.has(d));
          if (!dayOverlap) continue;

          const ecStart = toMinutes(existingClass.starttime);
          const ecEnd = toMinutes(existingClass.endtime);
          if (ecStart == null || ecEnd == null || ecEnd <= ecStart) continue;

          if (timesOverlap(tgtStart, tgtEnd, ecStart, ecEnd)) {
            const existingCourse = pickSearchClassMeta(
              existingClass.searchclass,
            );
            conflicts.push({
              withClassId: existingClass.classid,
              withTitle: existingCourse.title ?? undefined,
              withDept: existingCourse.dept || undefined,
              withCode: existingCourse.code || undefined,
              withDays: existingClass.days ?? null,
              withStart: existingClass.starttime ?? null,
              withEnd: existingClass.endtime ?? null,
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
            classid: typedTarget.classid,
            title: targetCourse.title,
            dept: targetCourse.dept,
            code: targetCourse.code,
            days: typedTarget.days,
            starttime: typedTarget.starttime,
            endtime: typedTarget.endtime,
          },
        },
        { status: 409 },
      );
    }

    const { error: insErr } = await supabase
      .from("schedule_classes")
      .upsert([{ scheduleid, class_uuid: typedTarget.uuid }], {
        onConflict: "scheduleid,class_uuid",
        ignoreDuplicates: false,
      });

    if (insErr) {
      console.error("[addClass] insert error:", insErr);
      return Response.json(
        { error: "Failed to add class to schedule" },
        { status: 500 },
      );
    }

    return Response.json(
      {
        success: true,
        added: {
          scheduleid,
          classid: typedTarget.classid,
          title: targetCourse.title,
          dept: targetCourse.dept,
          code: targetCourse.code,
          days: typedTarget.days,
          starttime: typedTarget.starttime,
          endtime: typedTarget.endtime,
          credithours: deriveCreditHours(
            typedTarget.minhours,
            typedTarget.maxhours,
          ),
        },
        warnings:
          conflicts.length > 0 ? { timeConflicts: conflicts } : undefined,
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    console.error("[addClass] server error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return Response.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 },
    );
  }
}
