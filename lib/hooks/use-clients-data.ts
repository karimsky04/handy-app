"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useExpert } from "@/lib/context/expert-auth-context";
import type { Client } from "@/lib/types/expert";

interface ExpertRef {
  name: string;
  jurisdiction: string;
  isYou: boolean;
}

export interface ClientWithDetails {
  id: string;
  full_name: string;
  email: string;
  overall_status: string;
  complexity: string;
  asset_types: string[];
  countries: string[];
  tax_years: string[];
  experts: ExpertRef[];
  progress: number;
  earnings: number;
  category: "active" | "pending_review" | "completed";
  completed_at: string | null;
}

function statusToCategory(
  status: string
): "active" | "pending_review" | "completed" {
  const s = status.toLowerCase();
  if (s === "completed") return "completed";
  if (s.includes("review") || s.includes("pending")) return "pending_review";
  return "active";
}

export function useClientsData() {
  const { expert } = useExpert();
  const [clients, setClients] = useState<ClientWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    if (!expert) return;

    const supabase = createClient();
    setLoading(true);

    // Get all client_experts for this expert, joined with client
    const { data: ceRows, error: ceError } = await supabase
      .from("client_experts")
      .select("*, client:clients(*)")
      .eq("expert_id", expert.id);

    if (ceError) {
      setError(ceError.message);
      setLoading(false);
      return;
    }

    if (!ceRows || ceRows.length === 0) {
      setClients([]);
      setLoading(false);
      return;
    }

    const clientIds = ceRows.map((ce) => (ce.client as unknown as Client).id);

    // Fetch all experts for these clients
    const { data: allCeRows } = await supabase
      .from("client_experts")
      .select("*, expert:experts(full_name)")
      .in("client_id", clientIds);

    // Fetch task counts per client for progress
    const { data: tasks } = await supabase
      .from("tasks")
      .select("client_id, status")
      .in("client_id", clientIds);

    const tasksByClient: Record<
      string,
      { total: number; completed: number }
    > = {};
    (tasks ?? []).forEach((t) => {
      if (!tasksByClient[t.client_id]) {
        tasksByClient[t.client_id] = { total: 0, completed: 0 };
      }
      tasksByClient[t.client_id].total++;
      if (t.status === "completed") tasksByClient[t.client_id].completed++;
    });

    const result: ClientWithDetails[] = ceRows.map((ce) => {
      const client = ce.client as unknown as Client;
      const clientId = client.id;

      // Build experts list for this client
      const otherExperts = (allCeRows ?? [])
        .filter((r) => r.client_id === clientId)
        .map((r) => ({
          name:
            r.expert_id === expert.id
              ? "You"
              : (r.expert as unknown as { full_name: string })?.full_name ??
                "Unknown",
          jurisdiction: r.jurisdiction,
          isYou: r.expert_id === expert.id,
        }));

      const taskInfo = tasksByClient[clientId] ?? { total: 0, completed: 0 };
      const progress =
        taskInfo.total > 0
          ? Math.round((taskInfo.completed / taskInfo.total) * 100)
          : 0;

      return {
        id: clientId,
        full_name: client.full_name,
        email: client.email,
        overall_status: client.overall_status,
        complexity: client.complexity,
        asset_types: client.asset_types ?? [],
        countries: client.countries ?? [],
        tax_years: client.tax_years ?? [],
        experts: otherExperts,
        progress,
        earnings: ce.earnings ?? 0,
        category: statusToCategory(client.overall_status),
        completed_at: client.updated_at,
      };
    });

    setClients(result);
    setLoading(false);
  }, [expert]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return { clients, loading, error, refetch: fetchClients };
}
