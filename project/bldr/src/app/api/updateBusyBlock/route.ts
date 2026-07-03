/**
 * API Route: /api/updateBusyBlock
 *
 * Updates a "Busy" time block's start and end times on a schedule.
 * Times must be 24-hour "HH:MM" strings on 15-minute increments.
 *
 * @method POST
 * @body {
 *   scheduleid: string,
 *   uuid: string,
 *   starttime: string,
 *   endtime: string
 * }
 *
 * @returns On success: { success: true, updated: BusyBlockRecord }
 *
 * @throws 400 - Missing or invalid fields
 * @throws 404 - Busy block not found for given uuid and schedule
 * @throws 500 - Database error
 */
import { validateBusyBlockTimes } from "@/lib/busyBlockValidation";
import type { BusyBlockRecord } from "@/types";
import { supabase } from "../../lib/supabaseClient";

type UpdateBusyBlockBody = {
  scheduleid?: string;
  uuid?: string;
  starttime?: string;
  endtime?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as UpdateBusyBlockBody;
    const { scheduleid, uuid, starttime, endtime } = body;

    if (!scheduleid || !uuid || !starttime || !endtime) {
      return Response.json(
        { error: "Missing scheduleid, uuid, starttime, or endtime" },
        { status: 400 },
      );
    }

    const timeError = validateBusyBlockTimes(starttime, endtime);
    if (timeError) {
      return Response.json({ error: timeError }, { status: 400 });
    }

    const { data: updated, error: updateError } = await supabase
      .from("schedule_busyblocks")
      .update({ starttime, endtime })
      .eq("scheduleid", scheduleid)
      .eq("uuid", uuid)
      .select("uuid, scheduleid, day, starttime, endtime, label, created_at")
      .maybeSingle();

    if (updateError) {
      console.error("[updateBusyBlock] update error:", updateError);
      return Response.json(
        { error: "Failed to update busy block" },
        { status: 500 },
      );
    }

    if (!updated) {
      return Response.json(
        { error: "Busy block not found for given uuid" },
        { status: 404 },
      );
    }

    return Response.json(
      { success: true, updated: updated as BusyBlockRecord },
      { status: 200 },
    );
  } catch (err: unknown) {
    console.error("[updateBusyBlock] server error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return Response.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 },
    );
  }
}
