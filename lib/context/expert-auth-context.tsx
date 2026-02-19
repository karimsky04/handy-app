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
  signingOut: boolean;
  error: string | null;
  signOut: () => Promise<void>;
}

const ExpertAuthContext = createContext<ExpertAuthContextValue>({
  session: null,
  expert: null,
  loading: true,
  signingOut: false,
  error: null,
  signOut: async () => {},
});

export function ExpertAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [expert, setExpert] = useState<Expert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const signingOutRef = useRef(false);

  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  // Ref to access expert in async callbacks without stale closures
  const expertRef = useRef<Expert | null>(null);
  expertRef.current = expert;

  const supabase = createClient();

  useEffect(() => {
    let mounted = true;
    let initialResolved = false;

    async function fetchExpert(userId: string, isInitial: boolean) {
      try {
        const { data, error: fetchErr } = await supabase
          .from("experts")
          .select("*")
          .eq("auth_user_id", userId)
          .single();

        if (!mounted) return;
        if (fetchErr) {
          // On initial load, set error. On background refresh, keep existing data.
          if (isInitial || !expertRef.current) {
            setError("Expert profile not found");
            setExpert(null);
          }
        } else {
          setExpert(data as Expert);
          setError(null);
        }
      } catch {
        if (mounted && (isInitial || !expertRef.current)) {
          setError("Failed to load profile");
          setExpert(null);
        }
      }
    }

    // Safety net: if auth hasn't resolved after 5 seconds, stop loading
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
    }, 5000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted || signingOutRef.current) return;

      if (event === "SIGNED_OUT") {
        setSession(null);
        setExpert(null);
        setLoading(false);
        clearTimeout(timeoutId);
        if (pathnameRef.current !== "/expert/login") {
          router.replace("/expert/login");
        }
        return;
      }

      setSession(newSession);

      if (event === "INITIAL_SESSION") {
        initialResolved = true;
        clearTimeout(timeoutId);

        if (newSession?.user) {
          await fetchExpert(newSession.user.id, true);
        } else {
          setExpert(null);
          if (pathnameRef.current !== "/expert/login") {
            router.replace(
              `/expert/login?redirectTo=${encodeURIComponent(pathnameRef.current)}`
            );
          }
        }

        if (mounted) setLoading(false);
        return;
      }

      // TOKEN_REFRESHED / SIGNED_IN — session was refreshed in the background.
      // The expert profile doesn't change on token refresh, so only fetch it
      // if we don't have one yet (e.g., after a SIGNED_IN from another tab).
      if (newSession?.user && !expertRef.current) {
        await fetchExpert(newSession.user.id, false);
      }
      // If we already have expert data, just keep it — don't risk clearing it
      // with a potentially-failing DB query during a token refresh.
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signOut() {
    // Set signing out flag FIRST to prevent any re-fetching
    signingOutRef.current = true;
    setSigningOut(true);
    setSession(null);
    setExpert(null);
    // Redirect immediately — don't wait for signOut() API call
    router.replace("/expert/login");
    try {
      await supabase.auth.signOut();
    } catch {
      // Even if the API call fails, we've already cleared state and redirected.
    }
  }

  return (
    <ExpertAuthContext.Provider
      value={{ session, expert, loading, signingOut, error, signOut }}
    >
      {children}
    </ExpertAuthContext.Provider>
  );
}

export function useExpert() {
  return useContext(ExpertAuthContext);
}
