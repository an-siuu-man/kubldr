/**
 * API Route: /api/addBusyBlock
 *
 * Adds a user-defined "Busy" time block to a schedule.
 * Times must be 24-hour "HH:MM" strings on 15-minute increments.
 *
 * @method POST
 * @body {
 *   scheduleid: string,
 *   day: string,        // 'M' | 'Tu' | 'W' | 'Th' | 'F'
 *   starttime: string,  // e.g. "09:00"
 *   endtime: string,    // e.g. "10:15"
 *   label?: string      // defaults to "Busy"
 * }
 *
 * @returns On success: { success: true, added: BusyBlockRecord }
 *
 * @throws 400 - Missing or invalid fields
 * @throws 500 - Database error
 */
import type { BusyBlockRecord } from "@/types";
import { supabase } from "../../lib/supabaseClient";

type AddBusyBlockBody = {
  scheduleid?: string;
  day?: string;
  starttime?: string;
  endtime?: string;
  label?: string;
};

const VALID_DAYS = new Set(["M", "Tu", "W", "Th", "F"]);

/**
 * Parses a 24-hour "HH:MM" time string into minutes since midnight.
 * Returns null if the string is malformed.
 */
function toMinutes(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (h > 23 || mi > 59) return null;
  return h * 60 + mi;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AddBusyBlockBody;
    const { scheduleid, day, starttime, endtime } = body;
    const label = body.label?.trim() || "Busy";

    if (!scheduleid || !day || !starttime || !endtime) {
      return Response.json(
        { error: "Missing scheduleid, day, starttime, or endtime" },
        { status: 400 },
      );
    }

    if (!VALID_DAYS.has(day)) {
      return Response.json(
        { error: "Invalid day (expected M, Tu, W, Th, or F)" },
        { status: 400 },
      );
    }

    const startMin = toMinutes(starttime);
    const endMin = toMinutes(endtime);

    if (startMin == null || endMin == null) {
      return Response.json(
        { error: "Invalid time format (expected 24-hour HH:MM)" },
        { status: 400 },
      );
    }

    if (startMin % 15 !== 0 || endMin % 15 !== 0) {
      return Response.json(
        { error: "Times must be on 15-minute increments" },
        { status: 400 },
      );
    }

    if (endMin <= startMin) {
      return Response.json(
        { error: "endtime must be after starttime" },
        { status: 400 },
      );
    }

    const { data: inserted, error: insertError } = await supabase
      .from("schedule_busyblocks")
      .insert({ scheduleid, day, starttime, endtime, label })
      .select("uuid, scheduleid, day, starttime, endtime, label, created_at")
      .single();

    if (insertError || !inserted) {
      console.error("[addBusyBlock] insert error:", insertError);
      return Response.json(
        { error: "Failed to add busy block" },
        { status: 500 },
      );
    }

    return Response.json(
      { success: true, added: inserted as BusyBlockRecord },
      { status: 200 },
    );
  } catch (err: unknown) {
    console.error("[addBusyBlock] server error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return Response.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 },
    );
  }
}
