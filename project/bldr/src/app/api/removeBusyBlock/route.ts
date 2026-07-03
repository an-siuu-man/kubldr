/**
 * API Route: /api/removeBusyBlock
 *
 * Removes a "Busy" time block from a schedule.
 * Deletes the row from the schedule_busyblocks table, scoped to the
 * owning schedule so a uuid can't delete a block on another schedule.
 *
 * @method POST
 * @body {
 *   scheduleid: string, // UUID of the schedule
 *   uuid: string        // UUID of the busy block to remove
 * }
 * @returns { success: true, message: string }
 *
 * @throws 400 - Missing scheduleid or uuid
 * @throws 404 - Busy block not found for given uuid and schedule
 * @throws 500 - Database error during deletion
 */
import { supabase } from "../../lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { scheduleid, uuid } = body;

    if (!scheduleid || !uuid) {
      return Response.json(
        { error: "Missing scheduleid or uuid" },
        { status: 400 },
      );
    }

    const { data: deleted, error: deleteError } = await supabase
      .from("schedule_busyblocks")
      .delete()
      .eq("scheduleid", scheduleid)
      .eq("uuid", uuid)
      .select("uuid");

    if (deleteError) {
      console.error("[removeBusyBlock] delete error:", deleteError);
      return Response.json(
        { error: "Failed to remove busy block" },
        { status: 500 },
      );
    }

    if (!deleted || deleted.length === 0) {
      return Response.json(
        { error: "Busy block not found for given uuid" },
        { status: 404 },
      );
    }

    return Response.json(
      { success: true, message: "Busy block successfully removed" },
      { status: 200 },
    );
  } catch (err: unknown) {
    console.error("[removeBusyBlock] server error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return Response.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 },
    );
  }
}
