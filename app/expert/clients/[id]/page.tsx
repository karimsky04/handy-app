"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useExpert } from "@/lib/context/expert-auth-context";
import type { Client, Task } from "@/lib/types/expert";

interface ExpertRef {
  name: string;
  jurisdiction: string;
  isYou: boolean;
}

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-gray-700/50 rounded animate-pulse ${className}`} />
  );
}

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;
  const { expert } = useExpert();

  const [client, setClient] = useState<Client | null>(null);
  const [experts, setExperts] = useState<ExpertRef[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!expert || !clientId) return;

    const supabase = createClient();

    async function fetchData() {
      // Fetch client
      const { data: clientRow } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();

      if (clientRow) setClient(clientRow as Client);

      // Fetch assigned experts
      const { data: ceRows } = await supabase
        .from("client_experts")
        .select("*, expert:experts(full_name)")
        .eq("client_id", clientId);

      const expertRefs: ExpertRef[] = (ceRows ?? []).map((r) => ({
        name:
          r.expert_id === expert!.id
            ? "You"
            : (r.expert as unknown as { full_name: string })?.full_name ??
              "Unknown",
        jurisdiction: r.jurisdiction,
        isYou: r.expert_id === expert!.id,
      }));
      setExperts(expertRefs);

      // Fetch tasks
      const { data: taskRows } = await supabase
        .from("tasks")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      setTasks((taskRows ?? []) as Task[]);
      setLoading(false);
    }

    fetchData();
  }, [expert, clientId]);

  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const progress =
    tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-gray-400">Client not found</p>
        <Link
          href="/expert/clients"
          className="text-gold hover:text-gold/80 text-sm mt-2 inline-block"
        >
          &larr; Back to clients
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href="/expert/clients"
          className="text-sm text-gray-400 hover:text-gold transition-colors"
        >
          &larr; Back to clients
        </Link>
      </div>

      {/* Client Header */}
      <div className="bg-navy-light border border-gray-700 rounded-xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold">{client.full_name}</h1>
            <p className="text-sm text-gray-400 mt-1">{client.email}</p>
            {client.phone && (
              <p className="text-sm text-gray-500">{client.phone}</p>
            )}
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gold/10 border border-gold/30 text-gold">
              {client.overall_status}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-navy border border-gray-700 text-gray-400">
              {client.complexity}
            </span>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Countries</p>
            <p className="text-sm text-gray-300">
              {client.countries?.join(", ") || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Asset Types</p>
            <p className="text-sm text-gray-300">
              {client.asset_types?.join(", ") || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Tax Years</p>
            <p className="text-sm text-gray-300">
              {client.tax_years?.join(", ") || "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Assigned Experts */}
      <div className="bg-navy-light border border-gray-700 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-3">Assigned Experts</h2>
        <div className="flex flex-wrap gap-2">
          {experts.length === 0 ? (
            <p className="text-gray-500 text-sm">No experts assigned</p>
          ) : (
            experts.map((exp, i) => (
              <span
                key={`${exp.jurisdiction}-${i}`}
                className={`text-sm px-3 py-1.5 rounded-lg border ${
                  exp.isYou
                    ? "bg-gold/10 border-gold/30 text-gold"
                    : "bg-navy border-gray-700 text-gray-400"
                }`}
              >
                {exp.jurisdiction} — {exp.isYou ? "You" : exp.name}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Progress & Tasks */}
      <div className="bg-navy-light border border-gray-700 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Tasks</h2>
          <span className="text-sm text-gray-400">
            {completedTasks}/{tasks.length} completed ({progress}%)
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-5">
          <div
            className={`h-full rounded-full transition-all ${progress === 100 ? "bg-teal" : "bg-gold"}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {tasks.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">
            No tasks yet
          </p>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between px-4 py-3 rounded-lg border border-gray-700/50 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      task.status === "completed"
                        ? "bg-teal"
                        : task.status === "in_progress"
                          ? "bg-amber-400"
                          : "bg-gray-500"
                    }`}
                  />
                  <span
                    className={`text-sm ${task.status === "completed" ? "text-gray-400 line-through" : "text-white"}`}
                  >
                    {task.title}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {task.due_date && (
                    <span className="text-xs text-gray-500">
                      {new Date(task.due_date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  )}
                  <span
                    className={`text-xs px-2 py-0.5 rounded border ${
                      task.status === "completed"
                        ? "bg-teal/10 text-teal border-teal/30"
                        : task.status === "in_progress"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          : "bg-gray-700/50 text-gray-400 border-gray-700"
                    }`}
                  >
                    {task.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action */}
      <div className="flex justify-end">
        <Link
          href="/expert/workspace"
          className="px-5 py-2.5 rounded-lg bg-gold/10 border border-gold/30 text-sm font-medium text-gold hover:bg-gold/20 transition-colors"
        >
          Open in Workspace &rarr;
        </Link>
      </div>
    </div>
  );
}
