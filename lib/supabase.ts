import {
  createClient as createSupabaseClient,
  SupabaseClient,
} from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

// Backward-compatible client for existing API routes (no auth cookie handling)
let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    _supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
}

// Browser client with auth cookie handling (for client components)
// Fallback values are used during Next.js static generation — the client is
// never actually called at build time (hooks only run in the browser).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder"
  );
}
