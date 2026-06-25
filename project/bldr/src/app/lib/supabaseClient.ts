// This file is deprecated. Please use @/lib/supabase/client or @/lib/supabase/server instead
// Keeping for backwards compatibility

import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables",
  );
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
