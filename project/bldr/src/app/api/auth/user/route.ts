/**
 * API Route: /api/auth/user
 * 
 * Retrieves the currently authenticated user's information.
 * Uses the session cookie to identify the user.
 * Useful for checking auth status and getting user metadata.
 * 
 * @method GET
 * @returns { user: User | null }
 * 
 * User object includes:
 * - id: UUID
 * - email: string
 * - is_anonymous: boolean (true for guest users)
 * - created_at: timestamp
 * - user_metadata: object
 * 
 * @throws 401 - Not authenticated or invalid session
 * @throws 500 - Server error
 */
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET handler for fetching current user.
 * Reads session from cookies and returns user data.
 * 
 * @returns {NextResponse} JSON with user object
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Get user from current session
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    // No valid session or expired token
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    // Return user data (null if not authenticated)
    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching user' },
      { status: 500 }
    );
  }
}
