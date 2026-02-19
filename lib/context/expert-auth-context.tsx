"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import type { Expert } from "@/lib/types/expert";

interface ExpertAuthContextValue {
  session: Session | null;
  expert: Expert | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
}

const ExpertAuthContext = createContext<ExpertAuthContextValue>({
  session: null,
  expert: null,
  loading: true,
  error: null,
  signOut: async () => {},
});

// Timeout wrapper — ensures loading always resolves
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Auth timeout")), ms)
    ),
  ]);
}

export function ExpertAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [expert, setExpert] = useState<Expert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const pathnameRef = useRef(usePathname());
  const supabase = createClient();

  // Keep pathnameRef current without re-running the effect
  const pathname = usePathname();
  pathnameRef.current = pathname;

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        // Use getUser() — validates the token server-side and refreshes if needed.
        // getSession() only reads from storage and can return stale/expired sessions.
        const {
          data: { user },
          error: userError,
        } = await withTimeout(supabase.auth.getUser(), 10000);

        if (!mounted) return;

        if (userError || !user) {
          // No valid session — redirect to login (unless already there)
          if (pathnameRef.current !== "/expert/login") {
            router.replace(
              `/expert/login?redirectTo=${encodeURIComponent(pathnameRef.current)}`
            );
          }
          return;
        }

        // Get the session object for context consumers
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (!mounted) return;
        setSession(currentSession);

        // Fetch expert profile
        const { data: expertRow, error: expertError } = await withTimeout(
          Promise.resolve(
            supabase
              .from("experts")
              .select("*")
              .eq("auth_user_id", user.id)
              .single()
          ),
          10000
        );

        if (!mounted) return;

        if (expertError) {
          setError("Expert profile not found");
        } else {
          setExpert(expertRow as Expert);
        }
      } catch {
        if (mounted) {
          setError("Failed to initialize auth");
          // On error, redirect to login as a safety fallback
          if (pathnameRef.current !== "/expert/login") {
            router.replace("/expert/login");
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      setSession(newSession);

      if (event === "SIGNED_OUT") {
        setExpert(null);
        router.replace("/expert/login");
        return;
      }

      if (newSession?.user) {
        const { data: expertRow } = await supabase
          .from("experts")
          .select("*")
          .eq("auth_user_id", newSession.user.id)
          .single();

        if (mounted) setExpert((expertRow as Expert) ?? null);
      } else {
        setExpert(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setExpert(null);
  }

  return (
    <ExpertAuthContext.Provider
      value={{ session, expert, loading, error, signOut }}
    >
      {children}
    </ExpertAuthContext.Provider>
  );
}

export function useExpert() {
  return useContext(ExpertAuthContext);
}
