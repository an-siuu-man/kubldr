// User related types
// Updated for Supabase authentication integration

/**
 * Represents a user record - now using Supabase auth
 * The onlineid field should now store auth.uid() from Supabase
 */
export interface UserDataRecord {
  onlineid: string; // UUID from Supabase auth.uid() (changed from text to uuid in DB)
  passhash?: string; // Deprecated - Supabase handles authentication
  signindate?: Date | string; // timestamp (default now())
  isactive: boolean; // boolean (default true)
}

/**
 * User authentication/session data (from Supabase)
 */
export interface User {
  id: string; // Supabase auth UUID
  email?: string;
  isactive?: boolean;
  signindate?: Date | string;
}

/**
 * Deprecated - keeping for backward compatibility only
 */
export interface AuthRequest {
  onlineid: string;
  password: string;
}

/**
 * Deprecated - keeping for backward compatibility only
 */
export interface AuthResponse {
  success: boolean;
  user?: User;
  message?: string;
  error?: string;
}
