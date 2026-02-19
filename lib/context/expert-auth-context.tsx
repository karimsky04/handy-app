"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
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

  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        setSession(currentSession);

        if (currentSession?.user) {
          const { data: expertRow, error: expertError } = await supabase
            .from("experts")
            .select("*")
            .eq("auth_user_id", currentSession.user.id)
            .single();

          if (!mounted) return;

          if (expertError) {
            setError("Expert profile not found");
          } else {
            setExpert(expertRow as Expert);
          }
        }
      } catch {
        if (mounted) setError("Failed to initialize auth");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);

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
