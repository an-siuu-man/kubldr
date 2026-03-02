/**
 * API Route: /api/auth/signup
 * 
 * Creates a new user account with email and password.
 * Sends a confirmation email to verify the user's email address.
 * User will need to click the verification link before full access.
 * 
 * @method POST
 * @body {
 *   email: string,    // User's email address
 *   password: string  // Desired password (min 6 chars by Supabase default)
 * }
 * @returns {
 *   message: string,
 *   user: User,       // Supabase User object (may not have email confirmed)
 *   session: Session | null // Session if email confirm disabled, null otherwise
 * }
 * 
 * Note: If email confirmation is enabled (default), user won't have a session
 * until they verify their email via the confirmation link.
 * 
 * @throws 400 - Missing fields or Supabase signup error (e.g., email already exists)
 * @throws 500 - Server error
 */
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * POST handler for new user registration.
 * Creates account and triggers verification email.
 * 
 * @param {Request} request - The incoming request with credentials
 * @returns {NextResponse} JSON with user data (session may be null)
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

    // Create user with Supabase Auth
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Redirect URL for email verification link
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    // Handle signup errors (duplicate email, weak password, etc.)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Return user data (session may be null until email confirmed)
    return NextResponse.json(
      { 
        message: 'User created successfully', 
        user: data.user,
        session: data.session 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An error occurred during signup' },
      { status: 500 }
    );
  }
}
