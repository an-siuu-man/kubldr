/**
 * API Route: /api/auth/login
 * 
 * Authenticates a user with email and password credentials.
 * Uses Supabase's signInWithPassword for secure authentication.
 * Returns user data and session token on success.
 * 
 * @method POST
 * @body {
 *   email: string,    // User's email address
 *   password: string  // User's password
 * }
 * @returns {
 *   message: string,
 *   user: User,      // Supabase User object
 *   session: Session // Supabase Session with access token
 * }
 * 
 * @throws 400 - Missing email or password
 * @throws 401 - Invalid credentials
 * @throws 500 - Server error
 */
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * POST handler for email/password login.
 * Validates credentials and returns session on success.
 * 
 * @param {Request} request - The incoming request with credentials
 * @returns {NextResponse} JSON with user and session data
 */
export async function POST(request: Request) {
  try {
    // Extract credentials from request body
    const { email, password } = await request.json();

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Authenticate with Supabase
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Handle authentication failure
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    // Return user and session for client-side storage
    return NextResponse.json(
      { 
        message: 'Login successful', 
        user: data.user,
        session: data.session 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
