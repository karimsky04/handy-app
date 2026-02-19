"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
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

/** Return the correct login path based on which section the user is in. */
function getLoginPath(pathname: string): string {
  if (pathname.startsWith("/platform-admin")) return "/platform-admin/login";
  return "/expert/login";
}

/** Check if the given pathname is already a login page. */
function isLoginPage(pathname: string): boolean {
  return pathname === "/expert/login" || pathname === "/platform-admin/login";
}

export function ExpertAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [expert, setExpert] = useState<Expert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

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

    const timeoutId = setTimeout(() => {
      if (mounted && !initialResolved) {
        initialResolved = true;
        setLoading(false);
        const cur = pathnameRef.current;
        // Platform-admin is protected by middleware — don't redirect on timeout,
        // just let the page render. For expert routes, redirect to login.
        if (
          !isLoginPage(cur) &&
          !cur.startsWith("/platform-admin")
        ) {
          const login = getLoginPath(cur);
          window.location.href = `${login}?redirectTo=${encodeURIComponent(cur)}`;
        }
      }
    }, 5000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, newSession: Session | null) => {
      console.log('[AUTH DEBUG]', event, !!newSession, newSession?.user?.id?.slice(0, 8));
      if (!mounted) return;

      if (event === "SIGNED_OUT") {
        setSession(null);
        setExpert(null);
        setLoading(false);
        clearTimeout(timeoutId);
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
          const cur = pathnameRef.current;
          if (!isLoginPage(cur)) {
            const login = getLoginPath(cur);
            window.location.href = `${login}?redirectTo=${encodeURIComponent(cur)}`;
          }
        }

        if (mounted) setLoading(false);
        return;
      }

      // TOKEN_REFRESHED / SIGNED_IN — only fetch expert if we don't have one
      if (newSession?.user && !expertRef.current) {
        await fetchExpert(newSession.user.id, false);
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
    const login = getLoginPath(pathnameRef.current);
    try {
      await supabase.auth.signOut();
    } catch {
      // Even if the API call fails, we still redirect below.
    }
    window.location.href = login;
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
