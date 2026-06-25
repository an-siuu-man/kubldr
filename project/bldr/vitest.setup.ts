import "@testing-library/jest-dom";

// Stub required env vars so module-level Supabase client construction
// (in app/lib/supabaseClient.ts) does not throw at import time.
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key-1234567890abcdef";
process.env.NEXT_PUBLIC_URL = "http://localhost:3000";
