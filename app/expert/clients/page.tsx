"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useClientsData, type ClientWithDetails } from "@/lib/hooks/use-clients-data";
import AddClientModal from "@/components/add-client-modal";

/* ═══════════════════════ HELPERS ═══════════════════════ */

function complexityColor(complexity: string): string {
  const c = complexity.toLowerCase();
  if (c.includes("multi")) return "text-red-400";
  if (c.includes("complex")) return "text-orange-400";
  if (c.includes("moderate")) return "text-yellow-400";
  return "text-teal";
}

function complexityBadgeClasses(complexity: string): string {
  const c = complexity.toLowerCase();
  if (c.includes("multi"))
    return "bg-red-500/10 text-red-400 border-red-500/30";
  if (c.includes("complex"))
    return "bg-orange-500/10 text-orange-400 border-orange-500/30";
  if (c.includes("moderate"))
    return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
  return "bg-teal/10 text-teal border-teal/30";
}

function statusColor(status: string): string {
  const s = status.toLowerCase();
  if (s === "completed") return "text-teal";
  if (s.includes("review") || s.includes("pending")) return "text-blue-400";
  return "text-amber-400";
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-gray-700/50 rounded animate-pulse ${className}`} />
  );
}

/* ═══════════════════════ PAGE ═══════════════════════ */

export default function ExpertClientsPage() {
  const { clients, loading, refetch } = useClientsData();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const counts = useMemo(() => {
    return {
      all: clients.length,
      active: clients.filter((c) => c.category === "active").length,
      pending_review: clients.filter((c) => c.category === "pending_review")
        .length,
      completed: clients.filter((c) => c.category === "completed").length,
    };
  }, [clients]);

  const filtered = useMemo(() => {
    let list = [...clients];
    if (filter !== "all") {
      list = list.filter((c) => c.category === filter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.full_name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.asset_types.some((a) => a.toLowerCase().includes(q))
      );
    }
    return list;
  }, [clients, filter, search]);

  const pills = [
    { id: "all", label: "All", count: counts.all },
    { id: "active", label: "Active", count: counts.active },
    {
      id: "pending_review",
      label: "Pending Review",
      count: counts.pending_review,
    },
    { id: "completed", label: "Completed", count: counts.completed },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">My Clients</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-lg bg-gold text-navy font-semibold text-sm hover:bg-gold/90 transition-colors"
        >
          + Add Client
        </button>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-1.5 overflow-x-auto">
          {pills.map((p) => (
            <button
              key={p.id}
              onClick={() => setFilter(p.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors border ${
                filter === p.id
                  ? "bg-gold/10 border-gold/30 text-gold"
                  : "border-gray-700 text-gray-400 hover:border-gray-600"
              }`}
            >
              {p.label}
              <span
                className={`text-xs ${filter === p.id ? "text-gold/60" : "text-gray-600"}`}
              >
                ({p.count})
              </span>
            </button>
          ))}
        </div>
        <div className="relative flex-1 sm:max-w-xs">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients..."
            className="w-full bg-navy-light border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold/50 transition-colors"
          />
        </div>
      </div>

      {/* Client Cards */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-navy-light border border-gray-700 rounded-xl p-5"
            >
              <Skeleton className="h-5 w-48 mb-3" />
              <Skeleton className="h-3 w-32 mb-2" />
              <Skeleton className="h-3 w-64" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((client) => (
            <ClientCardComponent key={client.id} client={client} />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {clients.length === 0
              ? "No clients yet. Add your first client to get started."
              : "No clients match your search"}
          </p>
        </div>
      )}

      <AddClientModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}

function ClientCardComponent({ client }: { client: ClientWithDetails }) {
  return (
    <div className="bg-navy-light border border-gray-700 rounded-xl p-5 hover:border-gray-600 transition-colors">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <Link
              href={`/expert/clients/${client.id}`}
              className="font-semibold text-base hover:text-gold transition-colors"
            >
              {client.full_name}
            </Link>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full border ${complexityBadgeClasses(client.complexity)}`}
            >
              {client.complexity}
            </span>
          </div>

          {/* Experts row */}
          <div className="flex flex-wrap gap-2 mb-2">
            {client.experts.map((exp, i) => (
              <span
                key={`${exp.jurisdiction}-${i}`}
                className={`text-xs px-2 py-1 rounded-md border ${
                  exp.isYou
                    ? "bg-gold/10 border-gold/30 text-gold"
                    : "bg-navy border-gray-700 text-gray-400"
                }`}
              >
                {exp.jurisdiction}{" "}
                {exp.isYou ? "(you)" : `(${exp.name})`}
              </span>
            ))}
          </div>

          <p className={`text-sm font-medium ${statusColor(client.overall_status)} mb-1`}>
            {client.overall_status}
            {client.category === "completed" && " ✅"}
          </p>
          <p className="text-xs text-gray-500">
            {client.asset_types.join(", ") || "No asset types"}
          </p>
        </div>

        {/* Right — progress, earnings, button */}
        <div className="flex items-center gap-5 flex-shrink-0">
          {/* Progress */}
          <div className="hidden sm:block w-24">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{client.progress}%</span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${client.progress === 100 ? "bg-teal" : "bg-gold"}`}
                style={{ width: `${client.progress}%` }}
              />
            </div>
          </div>

          {/* Earnings */}
          <div className="text-right">
            <p className="text-xs text-gray-500">Your earnings</p>
            <p className="text-sm font-semibold text-gold">
              {formatCurrency(client.earnings)}
            </p>
          </div>

          {/* Button */}
          <Link
            href={`/expert/clients/${client.id}`}
            className="px-4 py-2.5 rounded-lg border border-gray-700 text-sm font-medium text-gray-300 hover:border-gold/40 hover:text-gold transition-colors whitespace-nowrap"
          >
            {client.category === "completed"
              ? "View Summary"
              : "Open Workspace"}
          </Link>
        </div>
      </div>
    </div>
  );
}
