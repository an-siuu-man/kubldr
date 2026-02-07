/**
 * API Route: /api/removeClass
 *
 * Removes a class section from a user's schedule.
 * Deletes the schedule-class mapping from the schedule_classes table.
 *
 * @method POST
 * @body {
 *   scheduleid: string, // UUID of the schedule
 *   uuid: string        // UUID of the class to remove
 * }
 * @returns { success: true, message: string }
 *
 * @throws 400 - Missing scheduleid or uuid
 * @throws 404 - Class not found for given uuid
 * @throws 500 - Database error during deletion
 */
import { supabase } from "../../lib/supabaseClient";

/**
 * POST handler for removing a class from a schedule.
 * Looks up the class by UUID, then deletes the schedule-class mapping.
 *
 * @param {Request} req - The incoming request with scheduleid and uuid
 * @returns {Response} JSON response with success or error
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { scheduleid, uuid } = body;

    // Validate required fields
    if (!scheduleid || !uuid) {
      return Response.json(
        { error: "Missing scheduleid or uuid" },
        { status: 400 },
      );
    }

    // Look up the class to verify it exists
    const { data: classData, error: fetchError } = await supabase
      .from("allclasses")
      .select("classid")
      .eq("uuid", uuid)
      .maybeSingle();

    if (fetchError || !classData) {
      return Response.json(
        { error: "Class not found for given uuid" },
        { status: 404 },
      );
    }

    const classid = classData.classid;

    // Delete the schedule-class mapping
    const { error: deleteError } = await supabase
      .from("schedule_classes")
      .delete()
      .eq("scheduleid", scheduleid)
      .eq("class_uuid", uuid);

    if (deleteError) {
      return Response.json(
        { error: "Failed to remove class" },
        { status: 500 },
      );
    }

    return Response.json(
      { success: true, message: "Class successfully removed from schedule" },
      { status: 200 },
    );
  } catch (err: any) {
    console.error("Server error:", err);
    return Response.json(
      { error: "Internal server error", details: err.message },
      { status: 500 },
    );
  }
}
