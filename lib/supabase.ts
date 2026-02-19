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

// Browser client with auth cookie handling (for client components).
// Singleton — ensures one shared instance so the auth session is never lost
// when navigating between /expert and /platform-admin.
let _browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (!_browserClient) {
    _browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            const pairs = document.cookie.split(';');
            const cookies: { name: string; value: string }[] = [];
            for (const pair of pairs) {
              const trimmed = pair.trim();
              if (!trimmed) continue;
              const eqIndex = trimmed.indexOf('=');
              if (eqIndex === -1) continue;
              const name = trimmed.substring(0, eqIndex);
              const value = trimmed.substring(eqIndex + 1);
              cookies.push({ name, value: decodeURIComponent(value) });
            }
            return cookies;
          },
          setAll(cookiesToSet) {
            for (const { name, value, options } of cookiesToSet) {
              let cookie = `${name}=${encodeURIComponent(value)}`;
              cookie += `; path=${options?.path ?? '/'}`;
              if (options?.maxAge) cookie += `; max-age=${options.maxAge}`;
              if (options?.sameSite) cookie += `; samesite=${options.sameSite}`;
              if (options?.secure) cookie += '; secure';
              if (options?.domain) cookie += `; domain=${options.domain}`;
              document.cookie = cookie;
            }
          },
        },
      }
    );
  }
  return _browserClient;
}
