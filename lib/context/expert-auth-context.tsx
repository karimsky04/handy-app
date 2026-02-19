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

export function ExpertAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [expert, setExpert] = useState<Expert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const pathnameRef = useRef(usePathname());
  const pathname = usePathname();
  pathnameRef.current = pathname;

  const supabase = createClient();

  useEffect(() => {
    let mounted = true;
    let initialResolved = false;

    async function fetchExpert(userId: string) {
      try {
        const { data, error: fetchErr } = await supabase
          .from("experts")
          .select("*")
          .eq("auth_user_id", userId)
          .single();

        if (!mounted) return;
        if (fetchErr) {
          setError("Expert profile not found");
          setExpert(null);
        } else {
          setExpert(data as Expert);
          setError(null);
        }
      } catch {
        if (mounted) {
          setError("Failed to load profile");
          setExpert(null);
        }
      }
    }

    // Safety net: if auth hasn't resolved after 3 seconds, stop loading
    // and redirect to login
    const timeoutId = setTimeout(() => {
      if (mounted && !initialResolved) {
        initialResolved = true;
        setLoading(false);
        if (pathnameRef.current !== "/expert/login") {
          router.replace(
            `/expert/login?redirectTo=${encodeURIComponent(pathnameRef.current)}`
          );
        }
      }
    }, 3000);

    // Primary auth mechanism: onAuthStateChange fires INITIAL_SESSION
    // immediately with the session read from cookies. No extra API call needed
    // because the middleware already validated and refreshed the token.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT") {
        setSession(null);
        setExpert(null);
        setLoading(false);
        clearTimeout(timeoutId);
        router.replace("/expert/login");
        return;
      }

      setSession(newSession);

      if (event === "INITIAL_SESSION") {
        initialResolved = true;
        clearTimeout(timeoutId);

        if (newSession?.user) {
          await fetchExpert(newSession.user.id);
        } else {
          setExpert(null);
          // No session found in cookies — redirect to login
          if (pathnameRef.current !== "/expert/login") {
            router.replace(
              `/expert/login?redirectTo=${encodeURIComponent(pathnameRef.current)}`
            );
          }
        }

        if (mounted) setLoading(false);
        return;
      }

      // SIGNED_IN / TOKEN_REFRESHED — update expert in background
      if (newSession?.user) {
        await fetchExpert(newSession.user.id);
      } else {
        setExpert(null);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
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
