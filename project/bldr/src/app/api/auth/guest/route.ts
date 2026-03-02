/**
 * API Route: /api/auth/guest
 * 
 * Creates an anonymous guest session using Supabase anonymous authentication.
 * Allows users to try the app without creating a full account.
 * Guest users can later upgrade to a full account while preserving their data.
 * 
 * @method POST
 * @body None required
 * @returns {
 *   message: string,
 *   user: User,      // Supabase User object
 *   session: Session // Supabase Session with access token
 * }
 * 
 * @throws 400 - Supabase auth error
 * @throws 500 - Server error
 */
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST handler for guest login.
 * Creates anonymous session that can later be upgraded to full account.
 * 
 * @returns {NextResponse} JSON with user and session data
 */
export async function POST() {
  try {
    const supabase = await createClient();

    // Supabase anonymous sign-in creates a temporary user with session
    const { data, error } = await supabase.auth.signInAnonymously();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Return session data for client-side storage
    return NextResponse.json(
      {
        message: "Guest login successful",
        user: data.user,
        session: data.session,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Guest login error:", error);
    return NextResponse.json(
      { error: "An error occurred during guest login" },
      { status: 500 }
    );
  }
}
