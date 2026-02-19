"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import { getFlag } from "@/lib/country-flags";
import type { Client, ClientExpert } from "@/lib/types/expert";

/* ═══════════════════════ TYPES ═══════════════════════ */

type ClientWithExperts = Client & {
  client_experts?: Array<{
    expert: { full_name: string } | null;
  }>;
};

/* ═══════════════════════ CONSTANTS ═══════════════════════ */

const STATUS_OPTIONS = ["All", "Active", "In Progress", "Completed", "New"];
const COMPLEXITY_OPTIONS = ["All", "Simple", "Moderate", "Complex"];

const PIPELINE_BADGE_CLASSES: Record<string, string> = {
  "Quote Request": "bg-blue-500/10 text-blue-400 border-blue-500/30",
  "Data Collection": "bg-amber-500/10 text-amber-400 border-amber-500/30",
  Assessment: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  Processing: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
  Delivery: "bg-teal/10 text-teal border-teal/30",
  Complete: "bg-green-500/10 text-green-400 border-green-500/30",
};

/* ═══════════════════════ HELPERS ═══════════════════════ */

function getPipelineBadgeClasses(stage: string): string {
  return PIPELINE_BADGE_CLASSES[stage] || "bg-gray-500/10 text-gray-400 border-gray-500/30";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function exportCSV(rows: ClientWithExperts[]) {
  const header = [
    "Name",
    "Email",
    "Phone",
    "Countries",
    "Assigned Experts",
    "Pipeline Stage",
    "Complexity",
    "Status",
    "Created",
  ];

  const csvRows = rows.map((c) => {
    const countries = (c.countries || []).join("; ");
    const experts = (c.client_experts || [])
      .map((ce) => ce.expert?.full_name || "")
      .filter(Boolean)
      .join("; ");
    return [
      `"${c.full_name}"`,
      `"${c.email}"`,
      `"${c.phone || ""}"`,
      `"${countries}"`,
      `"${experts}"`,
      `"${c.pipeline_stage || ""}"`,
      `"${c.complexity}"`,
      `"${c.overall_status}"`,
      c.created_at ? formatDate(c.created_at) : "",
    ].join(",");
  });

  const csvString = [header.join(","), ...csvRows].join("\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const today = new Date().toISOString().split("T")[0];
  link.setAttribute("href", url);
  link.setAttribute("download", `handy-clients-${today}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/* ═══════════════════════ SKELETON ═══════════════════════ */

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-gray-700/50 rounded animate-pulse ${className}`} />
  );
}

/* ═══════════════════════ MAIN COMPONENT ═══════════════════════ */

export default function ClientsTab() {
  const [clients, setClients] = useState<ClientWithExperts[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<ClientWithExperts | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [countryFilter, setCountryFilter] = useState("All");
  const [complexityFilter, setComplexityFilter] = useState("All");

  /* ── Fetch data ── */
  useEffect(() => {
    async function fetchClients() {
      setLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from("clients")
        .select("*, client_experts(expert:experts(full_name))")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to fetch clients:", error);
      }

      setClients((data as ClientWithExperts[]) || []);
      setLoading(false);
    }

    fetchClients();
  }, []);

  /* ── Derived: unique countries ── */
  const allCountries = useMemo(() => {
    const set = new Set<string>();
    for (const c of clients) {
      for (const country of c.countries || []) {
        set.add(country);
      }
    }
    return Array.from(set).sort();
  }, [clients]);

  /* ── Filtering ── */
  const filtered = useMemo(() => {
    let list = [...clients];

    // Text search
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.full_name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== "All") {
      list = list.filter(
        (c) =>
          (c.overall_status || "").toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Country filter
    if (countryFilter !== "All") {
      list = list.filter((c) => (c.countries || []).includes(countryFilter));
    }

    // Complexity filter
    if (complexityFilter !== "All") {
      list = list.filter(
        (c) => (c.complexity || "").toLowerCase() === complexityFilter.toLowerCase()
      );
    }

    return list;
  }, [clients, search, statusFilter, countryFilter, complexityFilter]);

  /* ── Active filter check ── */
  const hasActiveFilters =
    statusFilter !== "All" ||
    countryFilter !== "All" ||
    complexityFilter !== "All";

  /* ═══════════════════════ RENDER ═══════════════════════ */

  return (
    <div className="relative">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-white">Clients</h2>
          {!loading && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple/10 text-purple-light border border-purple/30">
              {clients.length}
            </span>
          )}
        </div>
        <button
          onClick={() => exportCSV(filtered)}
          disabled={loading || filtered.length === 0}
          className="px-4 py-2 rounded-lg bg-purple text-white font-semibold text-sm hover:bg-purple-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Export CSV
        </button>
      </div>

      {/* ── Search + Filters Row ── */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
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
            placeholder="Search by name or email..."
            className="w-full bg-navy border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple/50 transition-colors"
          />
        </div>

        {/* Status */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`bg-navy border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple/50 transition-colors ${
            statusFilter !== "All"
              ? "border-purple/50 text-purple-light"
              : "border-gray-700"
          }`}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === "All" ? "All Statuses" : s}
            </option>
          ))}
        </select>

        {/* Country */}
        <select
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          className={`bg-navy border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple/50 transition-colors ${
            countryFilter !== "All"
              ? "border-purple/50 text-purple-light"
              : "border-gray-700"
          }`}
        >
          <option value="All">All Countries</option>
          {allCountries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Complexity */}
        <select
          value={complexityFilter}
          onChange={(e) => setComplexityFilter(e.target.value)}
          className={`bg-navy border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple/50 transition-colors ${
            complexityFilter !== "All"
              ? "border-purple/50 text-purple-light"
              : "border-gray-700"
          }`}
        >
          {COMPLEXITY_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c === "All" ? "All Complexity" : c}
            </option>
          ))}
        </select>

        {/* Reset Filters */}
        {hasActiveFilters && (
          <button
            onClick={() => {
              setStatusFilter("All");
              setCountryFilter("All");
              setComplexityFilter("All");
            }}
            className="px-3 py-2 rounded-lg border border-gray-700 text-sm text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* ── Table ── */}
      {loading ? (
        /* Loading skeleton */
        <div className="bg-navy-light border border-gray-700 rounded-xl overflow-hidden">
          <div className="p-4 space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        /* Empty state */
        <div className="bg-navy-light border border-gray-700 rounded-xl p-16 text-center">
          <svg
            className="w-12 h-12 mx-auto mb-4 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
            />
          </svg>
          <p className="text-gray-400 text-lg font-medium mb-1">
            No clients found
          </p>
          <p className="text-gray-500 text-sm">
            {search || hasActiveFilters
              ? "Try adjusting your search or filters to find what you're looking for."
              : "No clients have been added to the platform yet."}
          </p>
        </div>
      ) : (
        <div className="bg-navy-light border border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy-dark/50">
                  <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">
                    Email
                  </th>
                  <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">
                    Countries
                  </th>
                  <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">
                    Assigned Experts
                  </th>
                  <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">
                    Pipeline Stage
                  </th>
                  <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">
                    Complexity
                  </th>
                  <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((client) => {
                  const expertNames = (client.client_experts || [])
                    .map((ce) => ce.expert?.full_name)
                    .filter(Boolean)
                    .join(", ");

                  return (
                    <tr
                      key={client.id}
                      onClick={() => setSelectedClient(client)}
                      className="border-t border-gray-700/50 hover:bg-white/[0.02] cursor-pointer transition-colors"
                    >
                      {/* Name */}
                      <td className="px-4 py-3 text-sm text-gray-300 font-medium text-white whitespace-nowrap">
                        {client.full_name}
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">
                        {client.email}
                      </td>

                      {/* Countries */}
                      <td className="px-4 py-3 text-sm text-gray-300">
                        <span className="flex items-center gap-1 flex-wrap">
                          {(client.countries || []).map((country) => (
                            <span
                              key={country}
                              title={country}
                              className="text-base"
                            >
                              {getFlag(country)}
                            </span>
                          ))}
                        </span>
                      </td>

                      {/* Assigned Experts */}
                      <td className="px-4 py-3 text-sm text-gray-300 max-w-[200px]">
                        <span className="truncate block">
                          {expertNames || (
                            <span className="text-gray-600">Unassigned</span>
                          )}
                        </span>
                      </td>

                      {/* Pipeline Stage */}
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {client.pipeline_stage ? (
                          <span
                            className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border ${getPipelineBadgeClasses(
                              client.pipeline_stage
                            )}`}
                          >
                            {client.pipeline_stage}
                          </span>
                        ) : (
                          <span className="text-gray-600 text-xs">--</span>
                        )}
                      </td>

                      {/* Complexity */}
                      <td className="px-4 py-3 text-sm text-gray-300">
                        <span className="text-xs font-medium">
                          {client.complexity}
                        </span>
                      </td>

                      {/* Created Date */}
                      <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">
                        {formatDate(client.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Slide-over Detail Panel ── */}
      {selectedClient && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setSelectedClient(null)}
          />

          {/* Panel */}
          <div className="fixed top-0 right-0 h-full w-[480px] max-w-full bg-navy-dark border-l border-gray-700 z-50 overflow-y-auto shadow-2xl">
            {/* Panel Header */}
            <div className="sticky top-0 bg-navy-dark border-b border-gray-700 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-bold text-white truncate pr-4">
                {selectedClient.full_name}
              </h3>
              <button
                onClick={() => setSelectedClient(null)}
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Panel Body */}
            <div className="px-6 py-5 space-y-5">
              {/* Full Name */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Full Name
                </label>
                <p className="text-sm text-white mt-1">
                  {selectedClient.full_name}
                </p>
              </div>

              {/* Email */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Email
                </label>
                <p className="text-sm text-gray-300 mt-1">
                  {selectedClient.email}
                </p>
              </div>

              {/* Phone */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Phone
                </label>
                <p className="text-sm text-gray-300 mt-1">
                  {selectedClient.phone || (
                    <span className="text-gray-600">Not provided</span>
                  )}
                </p>
              </div>

              {/* Countries */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Countries
                </label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {(selectedClient.countries || []).length > 0 ? (
                    selectedClient.countries.map((country) => (
                      <span
                        key={country}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-navy-light border border-gray-700 text-sm text-gray-300"
                      >
                        <span className="text-base">{getFlag(country)}</span>
                        {country}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-600">None</span>
                  )}
                </div>
              </div>

              {/* Asset Types */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Asset Types
                </label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {(selectedClient.asset_types || []).length > 0 ? (
                    selectedClient.asset_types.map((asset) => (
                      <span
                        key={asset}
                        className="px-2 py-0.5 rounded text-xs bg-purple/10 text-purple-light border border-purple/20"
                      >
                        {asset}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-600">None</span>
                  )}
                </div>
              </div>

              {/* Complexity */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Complexity
                </label>
                <p className="text-sm text-gray-300 mt-1">
                  {selectedClient.complexity}
                </p>
              </div>

              {/* Tax Years */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Tax Years
                </label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {(selectedClient.tax_years || []).length > 0 ? (
                    selectedClient.tax_years.map((year) => (
                      <span
                        key={year}
                        className="px-2 py-0.5 rounded text-xs bg-navy-light border border-gray-700 text-gray-300"
                      >
                        {year}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-600">None</span>
                  )}
                </div>
              </div>

              {/* Overall Status */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Overall Status
                </label>
                <p className="text-sm text-gray-300 mt-1 capitalize">
                  {selectedClient.overall_status}
                </p>
              </div>

              {/* Pipeline Stage */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Pipeline Stage
                </label>
                <div className="mt-1">
                  {selectedClient.pipeline_stage ? (
                    <span
                      className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full border ${getPipelineBadgeClasses(
                        selectedClient.pipeline_stage
                      )}`}
                    >
                      {selectedClient.pipeline_stage}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-600">Not set</span>
                  )}
                </div>
              </div>

              {/* Quick Notes */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Notes
                </label>
                <p className="text-sm text-gray-300 mt-1 whitespace-pre-wrap">
                  {selectedClient.notes_quick || (
                    <span className="text-gray-600">No notes</span>
                  )}
                </p>
              </div>

              {/* Created At */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Created
                </label>
                <p className="text-sm text-gray-300 mt-1">
                  {formatDate(selectedClient.created_at)}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
