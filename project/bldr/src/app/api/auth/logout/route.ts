/**
 * API Route: /api/auth/logout
 * 
 * Signs out the current user by invalidating their session.
 * Clears the Supabase session both server-side and in cookies.
 * 
 * @method POST
 * @body None required
 * @returns { message: "Logout successful" }
 * 
 * @throws 400 - Supabase signout error
 * @throws 500 - Server error
 */
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * POST handler for user logout.
 * Invalidates the current session with Supabase.
 * 
 * @returns {NextResponse} JSON with success message
 */
export async function POST() {
  try {
    const supabase = await createClient();

    // Sign out from Supabase (clears session)
    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { message: 'Logout successful' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'An error occurred during logout' },
      { status: 500 }
    );
  }
}
