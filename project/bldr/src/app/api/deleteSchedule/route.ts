/**
 * API Route: /api/deleteSchedule
 * 
 * Permanently deletes a user's schedule from the database.
 * Uses cascading foreign keys to automatically remove related
 * schedule_classes and userschedule entries.
 * 
 * @method POST
 * @requires Authorization header with Bearer token
 * @body { scheduleId: string } - The UUID of the schedule to delete
 * @returns { success: true, scheduleId: string } - Confirmation of deletion
 * 
 * @throws 401 - Unauthorized (missing/invalid auth header)
 * @throws 400 - Missing scheduleId in request body
 * @throws 404 - Schedule not found or user doesn't own it
 * @throws 500 - Database error during deletion
 */
import { supabase } from "../../lib/supabaseClient";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST handler for deleting a schedule.
 * Verifies user ownership before performing the deletion.
 * The delete operation cascades to remove all related records.
 * 
 * @param {NextRequest} req - The incoming request with scheduleId in body
 * @returns {NextResponse} JSON response with result or error
 */
export async function POST(req: NextRequest) {
  try {
    // Extract and validate authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "No authorization header" },
        { status: 401 }
      );
    }

    // Verify user authentication with Supabase
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body for scheduleId
    const body = await req.json();
    const { scheduleId } = body;

    if (!scheduleId) {
      return NextResponse.json(
        { error: "Missing scheduleId" },
        { status: 400 }
      );
    }

    // Verify user owns this schedule before deleting
    const { data: ownership, error: ownershipError } = await supabase
      .from("userschedule")
      .select("scheduleid")
      .eq("auth_user_id", user.id)
      .eq("scheduleid", scheduleId)
      .single();

    if (ownershipError || !ownership) {
      console.error(
        "[deleteSchedule] ownership lookup failed:",
        ownershipError
      );
      return NextResponse.json(
        { error: "Schedule not found or unauthorized" },
        { status: 404 }
      );
    }

    // Delete the schedule (cascading FKs handle related records)
    const { error: deleteError } = await supabase
      .from("allschedules")
      .delete()
      .eq("scheduleid", scheduleId);

    if (deleteError) {
      console.error("[deleteSchedule] delete error:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete schedule" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, scheduleId });
  } catch (error: any) {
    console.error("[deleteSchedule] Unexpected error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
