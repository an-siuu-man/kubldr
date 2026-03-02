/**
 * API Route: /api/getUserSchedules
 *
 * Fetches all schedules belonging to the authenticated user.
 * Course metadata (dept/code/title) is joined from `searchclasses`.
 *
 * @method GET
 * @requires Authorization header with Bearer token
 * @returns { schedules: Array<ScheduleWithClasses> }
 */

import type { NextRequest } from "next/server";
import { supabase } from "../../lib/supabaseClient";

type SearchClassMeta = {
  dept: string;
  code: string;
  title: string | null;
};

type ClassDetailRow = {
  uuid: string;
  classid: number;
  days: string | null;
  starttime: string | null;
  endtime: string | null;
  component: string | null;
  instructor: string | null;
  location: string | null;
  room: string | null;
  availseats: number | null;
  minhours: number | null;
  maxhours: number | null;
  searchclass: SearchClassMeta | SearchClassMeta[] | null;
};

type ScheduleRow = {
  scheduleid: string;
  schedulename: string;
  semester: string;
  year: number;
  createdat: Date | string | null;
  lastedited: Date | string | null;
};

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

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return Response.json(
        { error: "No authorization header" },
        { status: 401 },
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userScheduleRows, error: userScheduleError } = await supabase
      .from("userschedule")
      .select("scheduleid, isactive")
      .eq("auth_user_id", user.id);

    if (userScheduleError) {
      console.error(
        "[getUserSchedules] Error fetching user schedules:",
        userScheduleError,
      );
      return Response.json(
        { error: "Failed to fetch user schedules" },
        { status: 500 },
      );
    }

    if (!userScheduleRows || userScheduleRows.length === 0) {
      return Response.json({ schedules: [] });
    }

    const scheduleIds = userScheduleRows.map((row) => row.scheduleid);
    const activeByScheduleId = new Map<string, boolean>(
      userScheduleRows.map((row) => [row.scheduleid, Boolean(row.isactive)]),
    );

    const { data: schedules, error: schedulesError } = await supabase
      .from("allschedules")
      .select("scheduleid, schedulename, semester, year, createdat, lastedited")
      .in("scheduleid", scheduleIds)
      .order("createdat", { ascending: false });

    if (schedulesError) {
      return Response.json(
        { error: "Failed to fetch schedule details" },
        { status: 500 },
      );
    }

    if (!schedules || schedules.length === 0) {
      return Response.json({ schedules: [] });
    }

    const { data: scheduleClasses, error: scheduleClassesError } =
      await supabase
        .from("schedule_classes")
        .select("scheduleid, class_uuid, added_at")
        .in("scheduleid", scheduleIds)
        .order("added_at", { ascending: true });

    if (scheduleClassesError) {
      console.error(
        "[getUserSchedules] Error fetching schedule classes:",
        scheduleClassesError,
      );
      return Response.json(
        { error: "Failed to fetch schedule classes" },
        { status: 500 },
      );
    }

    const classUuids = Array.from(
      new Set((scheduleClasses ?? []).map((row) => row.class_uuid)),
    );

    let classDetails: ClassDetailRow[] = [];
    if (classUuids.length > 0) {
      const { data: classRows, error: classDetailsError } = await supabase
        .from("allclasses")
        .select(
          "uuid,classid,days,starttime,endtime,component,instructor,location,room,availseats,minhours,maxhours,searchclass:searchclasses!allclasses_searchclass_fkey(dept,code,title)",
        )
        .in("uuid", classUuids);

      if (classDetailsError) {
        console.error(
          "[getUserSchedules] Error fetching class details:",
          classDetailsError,
        );
        return Response.json(
          { error: "Failed to fetch class details" },
          { status: 500 },
        );
      }

      classDetails = (classRows ?? []) as ClassDetailRow[];
    }

    const classByUuid = new Map<string, ClassDetailRow>();
    for (const cls of classDetails) {
      classByUuid.set(cls.uuid, cls);
    }

    const classesByScheduleId = new Map<string, string[]>();
    for (const row of scheduleClasses ?? []) {
      const existing = classesByScheduleId.get(row.scheduleid) ?? [];
      existing.push(row.class_uuid);
      classesByScheduleId.set(row.scheduleid, existing);
    }

    const schedulesWithClasses = (schedules as ScheduleRow[]).map(
      (schedule) => {
        const classIds = classesByScheduleId.get(schedule.scheduleid) ?? [];
        const formattedClasses = classIds
          .map((uuid) => classByUuid.get(uuid))
          .filter(Boolean)
          .map((cls) => {
            const section = cls as ClassDetailRow;
            const course = pickSearchClassMeta(section.searchclass);
            return {
              uuid: section.uuid,
              classID: section.classid?.toString() || "",
              dept: course.dept,
              code: course.code,
              title: course.title ?? `${course.dept} ${course.code}`,
              days: section.days || "",
              starttime: section.starttime || "",
              endtime: section.endtime || "",
              component: section.component || "",
              instructor: section.instructor || undefined,
              seats_available: section.availseats ?? 0,
              minhours: section.minhours ?? undefined,
              maxhours: section.maxhours ?? undefined,
              credithours: deriveCreditHours(
                section.minhours,
                section.maxhours,
              ),
              location: section.location || undefined,
              room: section.room || undefined,
            };
          });

        return {
          id: schedule.scheduleid,
          name: schedule.schedulename,
          semester: schedule.semester,
          year: schedule.year,
          classes: formattedClasses,
          isActive: activeByScheduleId.get(schedule.scheduleid) ?? false,
          createdAt: schedule.createdat,
          updatedAt: schedule.lastedited,
        };
      },
    );

    return Response.json({ schedules: schedulesWithClasses });
  } catch (error) {
    console.error("[getUserSchedules] Unexpected error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
