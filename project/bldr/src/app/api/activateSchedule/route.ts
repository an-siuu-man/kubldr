/**
 * API Route: /api/activateSchedule
 * 
 * Activates a user's schedule by setting its isactive flag to true.
 * This marks the schedule as the user's currently active schedule.
 * 
 * @method POST
 * @requires Authorization header with Bearer token
 * @body { scheduleId: string } - The UUID of the schedule to activate
 * @returns { message: string, schedule: object } - Success message with updated schedule data
 * 
 * @throws 401 - Unauthorized (missing/invalid auth header)
 * @throws 400 - Missing scheduleId in request body
 * @throws 404 - Schedule not found or user doesn't own it
 * @throws 500 - Database error or unexpected server error
 */
import { supabase } from "../../lib/supabaseClient";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST handler for activating a schedule.
 * Verifies user ownership before updating the schedule status.
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

    // Verify user owns this schedule before activating
    const { data: ownership, error: ownershipError } = await supabase
      .from("userschedule")
      .select("scheduleid")
      .eq("auth_user_id", user.id)
      .eq("scheduleid", scheduleId)
      .single();

    if (ownershipError || !ownership) {
      console.error(
        "[activateSchedule] ownership lookup failed:",
        ownershipError
      );
      return NextResponse.json(
        { error: "Schedule not found or unauthorized" },
        { status: 404 }
      );
    }

    // Update isactive flag to true
    const { data, error } = await supabase
      .from("userschedule")
      .update({ isactive: true })
      .eq("scheduleid", scheduleId)
      .eq("auth_user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error activating schedule:", error);
      return NextResponse.json(
        { error: "Failed to activate schedule" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Schedule activated successfully",
      schedule: data,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
