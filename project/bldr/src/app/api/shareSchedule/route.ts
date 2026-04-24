/**
 * API Route: /api/shareSchedule
 *
 * Toggles public sharing for a schedule owned by the authenticated user.
 *
 * @method PATCH
 * @requires Authorization header with Bearer token
 * @body { scheduleId: string, isPublic: boolean }
 * @returns { isPublic: boolean }
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { supabase } from "../../lib/supabaseClient";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "No authorization header" },
        { status: 401 },
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { scheduleId, isPublic } = body;

    if (
      typeof scheduleId !== "string" ||
      !UUID_PATTERN.test(scheduleId) ||
      typeof isPublic !== "boolean"
    ) {
      return NextResponse.json(
        { error: "Invalid scheduleId or isPublic" },
        { status: 400 },
      );
    }

    const { data: ownership, error: ownershipError } = await supabase
      .from("userschedule")
      .select("scheduleid")
      .eq("auth_user_id", user.id)
      .eq("scheduleid", scheduleId)
      .single();

    if (ownershipError || !ownership) {
      return NextResponse.json(
        { error: "Schedule not found or unauthorized" },
        { status: 404 },
      );
    }

    const { error: updateError } = await supabase
      .from("allschedules")
      .update({ is_public: isPublic })
      .eq("scheduleid", scheduleId);

    if (updateError) {
      console.error("[shareSchedule] Error updating share state:", updateError);
      return NextResponse.json(
        { error: "Failed to update sharing" },
        { status: 500 },
      );
    }

    return NextResponse.json({ isPublic });
  } catch (error) {
    console.error("[shareSchedule] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
