"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useExpert } from "@/lib/context/expert-auth-context";

interface DashboardStats {
  activeClients: number;
  jurisdictions: number;
  rating: number | null;
  earnedThisQuarter: number;
}

export function useDashboardStats() {
  const { expert } = useExpert();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!expert) return;

    const supabase = createClient();

    async function fetchStats() {
      // Active clients count
      const { count: activeClients } = await supabase
        .from("client_experts")
        .select("*", { count: "exact", head: true })
        .eq("expert_id", expert!.id)
        .eq("status", "active");

      // Distinct jurisdictions
      const { data: jurisdictionRows } = await supabase
        .from("client_experts")
        .select("jurisdiction")
        .eq("expert_id", expert!.id);

      const jurisdictions = new Set(
        jurisdictionRows?.map((r) => r.jurisdiction) ?? []
      ).size;

      // Earnings this quarter
      const now = new Date();
      const quarterStart = new Date(
        now.getFullYear(),
        Math.floor(now.getMonth() / 3) * 3,
        1
      );
      const { data: payments } = await supabase
        .from("payments")
        .select("amount")
        .eq("expert_id", expert!.id)
        .gte("paid_at", quarterStart.toISOString());

      const earnedThisQuarter =
        payments?.reduce((sum, p) => sum + p.amount, 0) ?? 0;

      setStats({
        activeClients: activeClients ?? 0,
        jurisdictions,
        rating: expert!.rating,
        earnedThisQuarter,
      });
      setLoading(false);
    }

    fetchStats();
  }, [expert]);

  return { stats, loading };
}

interface UrgentTask {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
  client_name: string;
  is_overdue: boolean;
}

export function useUrgentTasks() {
  const { expert } = useExpert();
  const [tasks, setTasks] = useState<UrgentTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!expert) return;

    const supabase = createClient();

    async function fetchTasks() {
      const now = new Date();
      const weekFromNow = new Date(
        now.getTime() + 7 * 24 * 60 * 60 * 1000
      );

      const { data } = await supabase
        .from("tasks")
        .select("id, title, status, due_date, client:clients(full_name)")
        .eq("expert_id", expert!.id)
        .in("status", ["pending", "in_progress"])
        .not("due_date", "is", null)
        .lte("due_date", weekFromNow.toISOString())
        .order("due_date", { ascending: true });

      const mapped: UrgentTask[] = (data ?? []).map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        due_date: t.due_date,
        client_name: (t.client as unknown as { full_name: string })?.full_name ?? "Unknown",
        is_overdue: t.due_date ? new Date(t.due_date) < now : false,
      }));

      setTasks(mapped);
      setLoading(false);
    }

    fetchTasks();
  }, [expert]);

  return { tasks, loading };
}

interface MonthlyEarning {
  month: string;
  amount: number;
}

export function useMonthlyEarnings() {
  const { expert } = useExpert();
  const [earnings, setEarnings] = useState<MonthlyEarning[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!expert) return;

    const supabase = createClient();

    async function fetchEarnings() {
      const now = new Date();
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      sixMonthsAgo.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from("payments")
        .select("amount, paid_at")
        .eq("expert_id", expert!.id)
        .gte("paid_at", sixMonthsAgo.toISOString())
        .order("paid_at", { ascending: true });

      // Group by month
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      const grouped: Record<string, number> = {};

      // Initialize last 6 months
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now);
        d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        grouped[key] = 0;
      }

      (data ?? []).forEach((p) => {
        const d = new Date(p.paid_at);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (key in grouped) {
          grouped[key] += p.amount;
        }
      });

      const result: MonthlyEarning[] = Object.entries(grouped).map(
        ([key, amount]) => {
          const [, monthIndex] = key.split("-");
          return { month: monthNames[parseInt(monthIndex)], amount };
        }
      );

      setEarnings(result);
      setLoading(false);
    }

    fetchEarnings();
  }, [expert]);

  return { earnings, loading };
}
