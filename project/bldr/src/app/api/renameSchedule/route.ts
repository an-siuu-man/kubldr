/**
 * API Route: /api/renameSchedule
 *
 * Renames an existing schedule by updating its schedulename field.
 * Verifies user ownership before allowing the rename operation.
 *
 * @method POST
 * @requires Authorization header with Bearer token
 * @body {
 *   scheduleId: string, // UUID of the schedule to rename
 *   newName: string     // The new name for the schedule
 * }
 * @returns { message: string, schedule: object }
 *
 * @throws 401 - Unauthorized (missing/invalid auth header)
 * @throws 400 - Missing scheduleId or newName
 * @throws 404 - Schedule not found or user doesn't own it
 * @throws 500 - Database error during update
 */

import { type NextRequest, NextResponse } from "next/server";
import { supabase } from "../../lib/supabaseClient";

/**
 * POST handler for renaming a schedule.
 * Authenticates user, verifies ownership, and updates the schedule name.
 *
 * @param {NextRequest} req - The incoming request with scheduleId and newName
 * @returns {NextResponse} JSON response with updated schedule or error
 */
export async function POST(req: NextRequest) {
  try {
    // Extract and validate authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "No authorization header" },
        { status: 401 },
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

    // Parse request body
    const body = await req.json();
    const { scheduleId, newName } = body;

    // Validate required fields
    if (!scheduleId || !newName) {
      return NextResponse.json(
        { error: "Missing scheduleId or newName" },
        { status: 400 },
      );
    }

    // Verify user owns this schedule before renaming
    const { data: ownership, error: ownershipError } = await supabase
      .from("userschedule")
      .select("scheduleid")
      .eq("auth_user_id", user.id)
      .eq("scheduleid", scheduleId)
      .single();

    if (ownershipError || !ownership) {
      console.error(
        "[renameSchedule] ownership lookup failed:",
        ownershipError,
      );
      return NextResponse.json(
        { error: "Schedule not found or unauthorized" },
        { status: 404 },
      );
    }

    // Update the schedule name in allschedules table
    const { data, error } = await supabase
      .from("allschedules")
      .update({ schedulename: newName })
      .eq("scheduleid", scheduleId)
      .select()
      .single();

    if (error) {
      console.error("Error renaming schedule:", error);
      return NextResponse.json(
        { error: "Failed to rename schedule" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "Schedule renamed successfully",
      schedule: data,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
