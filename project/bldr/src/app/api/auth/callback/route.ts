/**
 * API Route: /api/auth/callback
 * 
 * OAuth callback handler for Supabase authentication.
 * This route is called by Supabase after a user completes email verification
 * or OAuth provider authentication (Google, GitHub, etc.).
 * 
 * @method GET
 * @query code - The authorization code from Supabase to exchange for a session
 * @query next - Optional redirect path after successful auth (defaults to '/builder')
 * 
 * Flow:
 * 1. Extract authorization code from URL params
 * 2. Exchange code for session with Supabase
 * 3. Redirect user to 'next' path or error page
 * 
 * Handles both local development and production environments with proper
 * redirect URL construction (respects load balancer forwarded host).
 */
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET handler for OAuth callback.
 * Exchanges auth code for session and redirects user.
 * 
 * @param {Request} request - The incoming callback request with auth code
 * @returns {NextResponse} Redirect to builder page or error page
 */
export async function GET(request: Request) {
  // Extract code and redirect destination from URL query params
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/builder'; // Default to builder page

  if (code) {
    // Exchange the authorization code for a user session
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Determine correct redirect URL based on environment
      const forwardedHost = request.headers.get('x-forwarded-host'); // Behind load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development';
      
      if (isLocalEnv) {
        // Local dev: use origin directly (no load balancer)
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        // Production behind load balancer: use forwarded host
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        // Production direct access: use origin
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Auth failed - redirect to error page
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
