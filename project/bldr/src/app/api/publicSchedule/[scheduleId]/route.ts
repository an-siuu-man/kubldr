/**
 * API Route: /api/publicSchedule/[scheduleId]
 *
 * Fetches a public read-only schedule using the anonymous Supabase key.
 * Existing RLS policies are preserved and remain the source of truth.
 *
 * @method GET
 * @returns { schedule: Schedule }
 */
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { type ClassDetailRow, formatClassSection } from "@/lib/scheduleFormat";
import type { ClassSection } from "@/types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ScheduleRow = {
  scheduleid: string;
  schedulename: string;
  semester: string;
  year: number;
  createdat: Date | string | null;
  lastedited: Date | string | null;
};

type ScheduleClassRow = {
  class_uuid: string;
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ scheduleId: string }> },
) {
  try {
    const { scheduleId } = await context.params;
    if (!UUID_PATTERN.test(scheduleId)) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 },
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Supabase environment variables are not configured" },
        { status: 500 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: schedule, error: scheduleError } = await supabase
      .from("allschedules")
      .select("scheduleid, schedulename, semester, year, createdat, lastedited")
      .eq("scheduleid", scheduleId)
      .eq("is_public", true)
      .maybeSingle();

    if (scheduleError) {
      console.error("[publicSchedule] Error fetching schedule:", scheduleError);
      return NextResponse.json(
        { error: "Failed to fetch schedule" },
        { status: 500 },
      );
    }

    if (!schedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 },
      );
    }

    const { data: scheduleClasses, error: scheduleClassesError } =
      await supabase
        .from("schedule_classes")
        .select("class_uuid")
        .eq("scheduleid", scheduleId)
        .order("added_at", { ascending: true });

    if (scheduleClassesError) {
      console.error(
        "[publicSchedule] Error fetching schedule classes:",
        scheduleClassesError,
      );
      return NextResponse.json(
        { error: "Failed to fetch schedule classes" },
        { status: 500 },
      );
    }

    const classUuids = (scheduleClasses as ScheduleClassRow[] | null)?.map(
      (row) => row.class_uuid,
    );

    let formattedClasses: ClassSection[] = [];
    if (classUuids && classUuids.length > 0) {
      const { data: classRows, error: classDetailsError } = await supabase
        .from("allclasses")
        .select(
          "uuid,classid,days,starttime,endtime,component,instructor,location,room,availseats,minhours,maxhours,searchclass:searchclasses!allclasses_searchclass_fkey(dept,code,title)",
        )
        .in("uuid", classUuids);

      if (classDetailsError) {
        console.error(
          "[publicSchedule] Error fetching class details:",
          classDetailsError,
        );
        return NextResponse.json(
          { error: "Failed to fetch class details" },
          { status: 500 },
        );
      }

      const classByUuid = new Map<string, ClassDetailRow>();
      for (const row of (classRows ?? []) as ClassDetailRow[]) {
        classByUuid.set(row.uuid, row);
      }

      formattedClasses = classUuids
        .map((uuid) => classByUuid.get(uuid))
        .filter(Boolean)
        .map((row) => formatClassSection(row as ClassDetailRow));
    }

    const row = schedule as ScheduleRow;
    return NextResponse.json({
      schedule: {
        id: row.scheduleid,
        name: row.schedulename,
        semester: row.semester,
        year: row.year,
        classes: formattedClasses,
        isPublic: true,
        createdAt: row.createdat,
        updatedAt: row.lastedited,
      },
    });
  } catch (error) {
    console.error("[publicSchedule] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
