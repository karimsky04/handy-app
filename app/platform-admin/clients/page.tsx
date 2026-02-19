"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { getFlag } from "@/lib/country-flags";
import type { Client, ClientExpert } from "@/lib/types/expert";

/* ═══════════════════════ TYPES ═══════════════════════ */

type ClientExpertWithName = ClientExpert & {
  expert?: { full_name: string } | null;
};

type SortField = "full_name" | "created_at" | "revenue";
type SortDir = "asc" | "desc";

/* ═══════════════════════ CONSTANTS ═══════════════════════ */

const ROWS_PER_PAGE = 25;

const PIPELINE_STAGES = [
  "All",
  "Active",
  "In Progress",
  "Filing",
  "Complete",
  "On Hold",
];

const COMPLEXITY_OPTIONS = [
  "All",
  "Simple",
  "Moderate",
  "Complex",
  "Multi-Jurisdiction Complex",
];

/* ═══════════════════════ HELPERS ═══════════════════════ */

function complexityBadgeClasses(complexity: string): string {
  const c = complexity.toLowerCase();
  if (c.includes("multi")) return "bg-red-500/10 text-red-400 border-red-500/30";
  if (c.includes("complex")) return "bg-amber-500/10 text-amber-400 border-amber-500/30";
  if (c.includes("moderate")) return "bg-purple/10 text-purple-light border-purple/30";
  return "bg-teal/10 text-teal border-teal/30";
}

function pipelineBadgeClasses(): string {
  return "bg-purple/10 text-purple-light border-purple/30";
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function exportCSV(
  rows: Client[],
  expertMap: Record<string, string[]>,
  revenueMap: Record<string, number>
) {
  const header = [
    "Name",
    "Email",
    "Phone",
    "Countries",
    "Experts",
    "Pipeline Stage",
    "Complexity",
    "Status",
    "Revenue",
    "Created",
  ];

  const csvRows = rows.map((c) => {
    const experts = (expertMap[c.id] || []).join("; ");
    const countries = c.countries.join("; ");
    const revenue = revenueMap[c.id] || 0;
    return [
      `"${c.full_name}"`,
      `"${c.email}"`,
      `"${c.phone || ""}"`,
      `"${countries}"`,
      `"${experts}"`,
      `"${c.pipeline_stage || ""}"`,
      `"${c.complexity}"`,
      `"${c.overall_status}"`,
      revenue.toFixed(2),
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

/* ═══════════════════════ SORT ARROW ═══════════════════════ */

function SortArrow({
  field,
  sortField,
  sortDir,
}: {
  field: SortField;
  sortField: SortField;
  sortDir: SortDir;
}) {
  if (sortField !== field) {
    return (
      <svg
        className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-40 transition-opacity"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
      </svg>
    );
  }
  return sortDir === "asc" ? (
    <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
  ) : (
    <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

/* ═══════════════════════ PAGE ═══════════════════════ */

export default function PlatformAdminClientsPage() {
  const router = useRouter();
  const supabase = createClient();

  /* ── state ── */
  const [clients, setClients] = useState<Client[]>([]);
  const [clientExperts, setClientExperts] = useState<ClientExpertWithName[]>([]);
  const [revenueMap, setRevenueMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [countryFilter, setCountryFilter] = useState("All");
  const [complexityFilter, setComplexityFilter] = useState("All");
  const [expertFilter, setExpertFilter] = useState("All");

  // sort
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // pagination
  const [page, setPage] = useState(1);

  /* ── fetch data ── */
  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const [clientsRes, expertsRes, invoicesRes] = await Promise.all([
        supabase.from("clients").select("*"),
        supabase
          .from("client_experts")
          .select("*, expert:experts(full_name)"),
        supabase
          .from("invoices")
          .select("client_id, amount")
          .eq("status", "paid"),
      ]);

      if (clientsRes.data) {
        setClients(clientsRes.data as Client[]);
      }

      if (expertsRes.data) {
        setClientExperts(expertsRes.data as ClientExpertWithName[]);
      }

      if (invoicesRes.data) {
        const rMap: Record<string, number> = {};
        for (const inv of invoicesRes.data as { client_id: string; amount: number }[]) {
          if (inv.client_id) {
            rMap[inv.client_id] = (rMap[inv.client_id] || 0) + (inv.amount || 0);
          }
        }
        setRevenueMap(rMap);
      }

      setLoading(false);
    }

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── derived: expert names map (client_id -> expert names[]) ── */
  const expertMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const ce of clientExperts) {
      const name = ce.expert?.full_name || "Unknown";
      if (!map[ce.client_id]) map[ce.client_id] = [];
      if (!map[ce.client_id].includes(name)) {
        map[ce.client_id].push(name);
      }
    }
    return map;
  }, [clientExperts]);

  /* ── derived: unique countries ── */
  const allCountries = useMemo(() => {
    const set = new Set<string>();
    for (const c of clients) {
      for (const country of c.countries) {
        set.add(country);
      }
    }
    return Array.from(set).sort();
  }, [clients]);

  /* ── derived: unique expert names ── */
  const allExpertNames = useMemo(() => {
    const set = new Set<string>();
    for (const ce of clientExperts) {
      const name = ce.expert?.full_name;
      if (name) set.add(name);
    }
    return Array.from(set).sort();
  }, [clientExperts]);

  /* ── filtering ── */
  const filtered = useMemo(() => {
    let list = [...clients];

    // search
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.full_name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
      );
    }

    // status / pipeline stage
    if (statusFilter !== "All") {
      list = list.filter(
        (c) =>
          (c.pipeline_stage || "").toLowerCase() === statusFilter.toLowerCase() ||
          (c.overall_status || "").toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // country
    if (countryFilter !== "All") {
      list = list.filter((c) => c.countries.includes(countryFilter));
    }

    // complexity
    if (complexityFilter !== "All") {
      list = list.filter(
        (c) => c.complexity.toLowerCase() === complexityFilter.toLowerCase()
      );
    }

    // expert
    if (expertFilter !== "All") {
      const clientIdsForExpert = new Set(
        clientExperts
          .filter((ce) => ce.expert?.full_name === expertFilter)
          .map((ce) => ce.client_id)
      );
      list = list.filter((c) => clientIdsForExpert.has(c.id));
    }

    // sort
    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === "full_name") {
        cmp = a.full_name.localeCompare(b.full_name);
      } else if (sortField === "created_at") {
        cmp =
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortField === "revenue") {
        cmp = (revenueMap[a.id] || 0) - (revenueMap[b.id] || 0);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [
    clients,
    search,
    statusFilter,
    countryFilter,
    complexityFilter,
    expertFilter,
    clientExperts,
    sortField,
    sortDir,
    revenueMap,
  ]);

  /* ── pagination ── */
  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paginatedRows = filtered.slice(
    (page - 1) * ROWS_PER_PAGE,
    page * ROWS_PER_PAGE
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, countryFilter, complexityFilter, expertFilter]);

  /* ── sort toggle ── */
  const toggleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDir("asc");
      }
    },
    [sortField]
  );

  /* ── reset filters ── */
  const resetFilters = useCallback(() => {
    setSearch("");
    setStatusFilter("All");
    setCountryFilter("All");
    setComplexityFilter("All");
    setExpertFilter("All");
  }, []);

  const hasActiveFilters =
    search !== "" ||
    statusFilter !== "All" ||
    countryFilter !== "All" ||
    complexityFilter !== "All" ||
    expertFilter !== "All";

  /* ═══════════════════════ RENDER ═══════════════════════ */

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">All Clients</h1>
          {!loading && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple/10 text-purple-light border border-purple/30">
              {clients.length}
            </span>
          )}
        </div>
        <button
          onClick={() => exportCSV(filtered, expertMap, revenueMap)}
          disabled={loading || filtered.length === 0}
          className="px-4 py-2 rounded-lg bg-purple text-white font-semibold text-sm hover:bg-purple-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Export CSV
        </button>
      </div>

      {/* ── Filters Row ── */}
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
            className="w-full bg-navy border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple/50 transition-colors"
          />
        </div>

        {/* Status */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-navy border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple/50 transition-colors"
        >
          {PIPELINE_STAGES.map((s) => (
            <option key={s} value={s}>
              {s === "All" ? "All Stages" : s}
            </option>
          ))}
        </select>

        {/* Country */}
        <select
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          className="bg-navy border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple/50 transition-colors"
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
          className="bg-navy border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple/50 transition-colors"
        >
          {COMPLEXITY_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c === "All" ? "All Complexity" : c}
            </option>
          ))}
        </select>

        {/* Expert */}
        <select
          value={expertFilter}
          onChange={(e) => setExpertFilter(e.target.value)}
          className="bg-navy border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple/50 transition-colors"
        >
          <option value="All">All Experts</option>
          {allExpertNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        {/* Reset */}
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="px-3 py-2 rounded-lg border border-gray-700 text-sm text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* ── Table ── */}
      {loading ? (
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
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        /* ── Empty State ── */
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
            {hasActiveFilters
              ? "Try adjusting your filters to find what you're looking for."
              : "Add your first client through the Expert Portal to get started."}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-navy-light border border-gray-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                {/* ── Table Header ── */}
                <thead>
                  <tr className="bg-navy-dark/50 text-xs text-gray-500 uppercase tracking-wider">
                    <th
                      className="group text-left px-4 py-3 font-medium cursor-pointer hover:text-purple-light transition-colors"
                      onClick={() => toggleSort("full_name")}
                    >
                      <span className="flex items-center">
                        Name
                        <SortArrow
                          field="full_name"
                          sortField={sortField}
                          sortDir={sortDir}
                        />
                      </span>
                    </th>
                    <th className="text-left px-4 py-3 font-medium">Email</th>
                    <th className="text-left px-4 py-3 font-medium">
                      Countries
                    </th>
                    <th className="text-left px-4 py-3 font-medium">
                      Assigned Experts
                    </th>
                    <th className="text-left px-4 py-3 font-medium">
                      Pipeline Stage
                    </th>
                    <th className="text-left px-4 py-3 font-medium">
                      Complexity
                    </th>
                    <th
                      className="group text-right px-4 py-3 font-medium cursor-pointer hover:text-purple-light transition-colors"
                      onClick={() => toggleSort("revenue")}
                    >
                      <span className="flex items-center justify-end">
                        Total Revenue
                        <SortArrow
                          field="revenue"
                          sortField={sortField}
                          sortDir={sortDir}
                        />
                      </span>
                    </th>
                    <th
                      className="group text-left px-4 py-3 font-medium cursor-pointer hover:text-purple-light transition-colors"
                      onClick={() => toggleSort("created_at")}
                    >
                      <span className="flex items-center">
                        Created
                        <SortArrow
                          field="created_at"
                          sortField={sortField}
                          sortDir={sortDir}
                        />
                      </span>
                    </th>
                  </tr>
                </thead>

                {/* ── Table Body ── */}
                <tbody>
                  {paginatedRows.map((client) => {
                    const experts = expertMap[client.id] || [];
                    const revenue = revenueMap[client.id] || 0;

                    return (
                      <tr
                        key={client.id}
                        onClick={() =>
                          router.push(`/expert/clients/${client.id}`)
                        }
                        className="border-t border-gray-700/50 hover:bg-white/5 cursor-pointer transition-colors"
                      >
                        {/* Name */}
                        <td className="px-4 py-3 font-medium text-white whitespace-nowrap">
                          {client.full_name}
                        </td>

                        {/* Email */}
                        <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                          {client.email}
                        </td>

                        {/* Countries */}
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1 flex-wrap">
                            {client.countries.map((country) => (
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
                        <td className="px-4 py-3 text-gray-400 max-w-[200px]">
                          <span className="truncate block">
                            {experts.length > 0
                              ? experts.join(", ")
                              : "Unassigned"}
                          </span>
                        </td>

                        {/* Pipeline Stage */}
                        <td className="px-4 py-3">
                          {client.pipeline_stage ? (
                            <span
                              className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border ${pipelineBadgeClasses()}`}
                            >
                              {client.pipeline_stage}
                            </span>
                          ) : (
                            <span className="text-gray-600 text-xs">--</span>
                          )}
                        </td>

                        {/* Complexity */}
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border ${complexityBadgeClasses(client.complexity)}`}
                          >
                            {client.complexity}
                          </span>
                        </td>

                        {/* Revenue */}
                        <td className="px-4 py-3 text-right font-medium text-white whitespace-nowrap">
                          {revenue > 0 ? formatCurrency(revenue) : "--"}
                        </td>

                        {/* Created */}
                        <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                          {formatDate(client.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">
                Showing{" "}
                <span className="text-gray-300 font-medium">
                  {(page - 1) * ROWS_PER_PAGE + 1}
                </span>
                {" - "}
                <span className="text-gray-300 font-medium">
                  {Math.min(page * ROWS_PER_PAGE, filtered.length)}
                </span>{" "}
                of{" "}
                <span className="text-gray-300 font-medium">
                  {filtered.length}
                </span>{" "}
                clients
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-700 text-sm text-gray-400 hover:text-white hover:border-gray-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-400 px-2">
                  Page{" "}
                  <span className="text-white font-medium">{page}</span> of{" "}
                  <span className="text-white font-medium">{totalPages}</span>
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-gray-700 text-sm text-gray-400 hover:text-white hover:border-gray-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
