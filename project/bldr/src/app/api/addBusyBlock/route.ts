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
import {
  isValidBusyBlockDay,
  validateBusyBlockTimes,
} from "@/lib/busyBlockValidation";
import { supabase } from "../../lib/supabaseClient";

type AddBusyBlockBody = {
  scheduleid?: string;
  day?: string;
  starttime?: string;
  endtime?: string;
  label?: string;
};

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

    if (!isValidBusyBlockDay(day)) {
      return Response.json(
        { error: "Invalid day (expected M, Tu, W, Th, or F)" },
        { status: 400 },
      );
    }

    const timeError = validateBusyBlockTimes(starttime, endtime);
    if (timeError) {
      return Response.json({ error: timeError }, { status: 400 });
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
