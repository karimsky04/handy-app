"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import { getFlag } from "@/lib/country-flags";
import type { Expert } from "@/lib/types/expert";

interface ClientAssignment {
  id: string;
  client_id: string;
  status: string;
  jurisdiction: string;
  client: {
    id: string;
    full_name: string;
    email: string;
    overall_status: string;
  } | null;
}

interface MonthlyEarning {
  month: string;
  total: number;
}

export default function PlatformAdminExpertsPage() {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [clientCounts, setClientCounts] = useState<Record<string, number>>({});
  const [earnings, setEarnings] = useState<Record<string, number>>({});
  const [taskCounts, setTaskCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Detail panel state
  const [detailClients, setDetailClients] = useState<ClientAssignment[]>([]);
  const [detailMonthlyEarnings, setDetailMonthlyEarnings] = useState<MonthlyEarning[]>([]);
  const [detailCompletedTasks, setDetailCompletedTasks] = useState(0);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchExperts();
  }, []);

  async function fetchExperts() {
    setLoading(true);
    const supabase = createClient();

    // Fetch all experts
    const { data: expertsData } = await supabase
      .from("experts")
      .select("*")
      .order("created_at", { ascending: false });

    // Fetch active client counts per expert
    const { data: clientCountsData } = await supabase
      .from("client_experts")
      .select("expert_id")
      .eq("status", "active");

    // Fetch total earnings per expert (paid invoices)
    const { data: invoicesData } = await supabase
      .from("invoices")
      .select("expert_id, paid_amount")
      .eq("status", "paid");

    // Fetch task counts per expert
    const { data: tasksData } = await supabase
      .from("tasks")
      .select("expert_id");

    // Process experts
    setExperts((expertsData as Expert[]) || []);

    // Process client counts
    const counts: Record<string, number> = {};
    if (clientCountsData) {
      for (const row of clientCountsData) {
        counts[row.expert_id] = (counts[row.expert_id] || 0) + 1;
      }
    }
    setClientCounts(counts);

    // Process earnings
    const earningsMap: Record<string, number> = {};
    if (invoicesData) {
      for (const row of invoicesData) {
        earningsMap[row.expert_id] =
          (earningsMap[row.expert_id] || 0) + (row.paid_amount || 0);
      }
    }
    setEarnings(earningsMap);

    // Process task counts
    const taskMap: Record<string, number> = {};
    if (tasksData) {
      for (const row of tasksData) {
        taskMap[row.expert_id] = (taskMap[row.expert_id] || 0) + 1;
      }
    }
    setTaskCounts(taskMap);

    setLoading(false);
  }

  async function fetchExpertDetail(expertId: string) {
    setDetailLoading(true);
    setDetailClients([]);
    setDetailMonthlyEarnings([]);
    setDetailCompletedTasks(0);

    const supabase = createClient();

    // Fetch assigned clients
    const { data: clientAssignments } = await supabase
      .from("client_experts")
      .select("id, client_id, status, jurisdiction, client:clients(id, full_name, email, overall_status)")
      .eq("expert_id", expertId)
      .eq("status", "active");

    setDetailClients((clientAssignments as unknown as ClientAssignment[]) || []);

    // Fetch completed tasks count
    const { count: completedCount } = await supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("expert_id", expertId)
      .eq("status", "completed");

    setDetailCompletedTasks(completedCount || 0);

    // Fetch monthly earnings for last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: monthlyInvoices } = await supabase
      .from("invoices")
      .select("paid_amount, paid_at")
      .eq("expert_id", expertId)
      .eq("status", "paid")
      .gte("paid_at", sixMonthsAgo.toISOString());

    // Group by month
    const monthlyMap: Record<string, number> = {};
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyMap[key] = 0;
      months.push(key);
    }

    if (monthlyInvoices) {
      for (const inv of monthlyInvoices) {
        if (inv.paid_at) {
          const d = new Date(inv.paid_at);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          if (key in monthlyMap) {
            monthlyMap[key] += inv.paid_amount || 0;
          }
        }
      }
    }

    setDetailMonthlyEarnings(months.map((m) => ({ month: m, total: monthlyMap[m] })));
    setDetailLoading(false);
  }

  function handleRowClick(expertId: string) {
    if (expandedId === expertId) {
      setExpandedId(null);
    } else {
      setExpandedId(expertId);
      fetchExpertDetail(expertId);
    }
  }

  const filteredExperts = useMemo(() => {
    if (!search.trim()) return experts;
    const q = search.toLowerCase();
    return experts.filter(
      (e) =>
        e.full_name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q)
    );
  }, [experts, search]);

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function renderStars(rating: number | null): string {
    if (rating === null || rating === undefined) return "No rating";
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    let stars = "";
    for (let i = 0; i < full; i++) stars += "\u2605";
    if (half) stars += "\u2605";
    const empty = 5 - full - (half ? 1 : 0);
    for (let i = 0; i < empty; i++) stars += "\u2606";
    return `${stars} ${rating.toFixed(1)}`;
  }

  function renderStatusBadge(status: string) {
    let classes = "";
    switch (status) {
      case "active":
        classes = "bg-teal/10 text-teal border border-teal/30";
        break;
      case "suspended":
        classes = "bg-red-500/10 text-red-400 border border-red-500/30";
        break;
      case "pending":
        classes = "bg-amber-500/10 text-amber-400 border border-amber-500/30";
        break;
      default:
        classes = "bg-gray-500/10 text-gray-400 border border-gray-500/30";
    }
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${classes}`}>
        {status}
      </span>
    );
  }

  function renderJurisdictions(jurisdictions: string[]) {
    if (!jurisdictions || jurisdictions.length === 0) {
      return <span className="text-gray-500">--</span>;
    }
    const shown = jurisdictions.slice(0, 3);
    const overflow = jurisdictions.length - 3;
    return (
      <span className="flex items-center gap-1">
        {shown.map((j) => (
          <span key={j} title={j} className="text-base">
            {getFlag(j)}
          </span>
        ))}
        {overflow > 0 && (
          <span className="text-xs text-gray-400 ml-0.5">+{overflow}</span>
        )}
      </span>
    );
  }

  function formatMonth(key: string): string {
    const [year, month] = key.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString("en-US", { month: "short" });
  }

  // Loading state
  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-8 w-48 bg-gray-700 rounded" />
            <div className="h-10 w-36 bg-gray-700 rounded-lg" />
          </div>
          <div className="h-10 w-80 bg-gray-700 rounded-lg" />
          <div className="bg-navy-light border border-gray-700 rounded-xl overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 border-t border-gray-700/50">
                <div className="h-4 w-32 bg-gray-700 rounded" />
                <div className="h-4 w-24 bg-gray-700 rounded" />
                <div className="h-4 w-40 bg-gray-700 rounded" />
                <div className="h-4 w-16 bg-gray-700 rounded" />
                <div className="h-4 w-12 bg-gray-700 rounded" />
                <div className="h-4 w-20 bg-gray-700 rounded" />
                <div className="h-4 w-20 bg-gray-700 rounded" />
                <div className="h-4 w-16 bg-gray-700 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">Experts</h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple/10 text-purple-light border border-purple/30">
            {experts.length}
          </span>
        </div>
        <button
          disabled
          title="Coming soon"
          className="px-4 py-2.5 rounded-lg bg-purple text-white text-sm font-semibold opacity-50 cursor-not-allowed"
        >
          Invite Expert
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-sm">
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
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-navy-light border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple/50 transition-colors"
          />
        </div>
      </div>

      {/* Empty state */}
      {filteredExperts.length === 0 && !loading ? (
        <div className="bg-navy-light border border-gray-700 rounded-xl p-16 text-center">
          <svg
            className="w-12 h-12 text-gray-600 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"
            />
          </svg>
          <p className="text-gray-400 text-sm">
            {search.trim()
              ? "No experts match your search"
              : "No experts on the platform yet"}
          </p>
        </div>
      ) : (
        /* Experts table */
        <div className="bg-navy-light border border-gray-700 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-navy-dark/50">
                <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Name
                </th>
                <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Company
                </th>
                <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Email
                </th>
                <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Jurisdictions
                </th>
                <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Active Clients
                </th>
                <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Rating
                </th>
                <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Total Earned
                </th>
                <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredExperts.map((expert) => (
                <ExpertRow
                  key={expert.id}
                  expert={expert}
                  clientCount={clientCounts[expert.id] || 0}
                  totalEarned={earnings[expert.id] || 0}
                  taskCount={taskCounts[expert.id] || 0}
                  isExpanded={expandedId === expert.id}
                  onToggle={() => handleRowClick(expert.id)}
                  detailClients={detailClients}
                  detailMonthlyEarnings={detailMonthlyEarnings}
                  detailCompletedTasks={detailCompletedTasks}
                  detailLoading={detailLoading}
                  formatCurrency={formatCurrency}
                  renderStars={renderStars}
                  renderStatusBadge={renderStatusBadge}
                  renderJurisdictions={renderJurisdictions}
                  formatMonth={formatMonth}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------
// Expert row + expandable detail panel
// ------------------------------------------------------------------

interface ExpertRowProps {
  expert: Expert;
  clientCount: number;
  totalEarned: number;
  taskCount: number;
  isExpanded: boolean;
  onToggle: () => void;
  detailClients: ClientAssignment[];
  detailMonthlyEarnings: MonthlyEarning[];
  detailCompletedTasks: number;
  detailLoading: boolean;
  formatCurrency: (n: number) => string;
  renderStars: (r: number | null) => string;
  renderStatusBadge: (s: string) => JSX.Element;
  renderJurisdictions: (j: string[]) => JSX.Element;
  formatMonth: (k: string) => string;
}

function ExpertRow({
  expert,
  clientCount,
  totalEarned,
  taskCount,
  isExpanded,
  onToggle,
  detailClients,
  detailMonthlyEarnings,
  detailCompletedTasks,
  detailLoading,
  formatCurrency,
  renderStars,
  renderStatusBadge,
  renderJurisdictions,
  formatMonth,
}: ExpertRowProps) {
  const maxEarning = Math.max(...detailMonthlyEarnings.map((m) => m.total), 1);

  return (
    <>
      {/* Main row */}
      <tr
        onClick={onToggle}
        className={`border-t border-gray-700/50 hover:bg-white/5 cursor-pointer transition-colors ${
          isExpanded ? "bg-white/5" : ""
        }`}
      >
        <td className="px-6 py-4">
          <span className="text-sm font-semibold text-white">{expert.full_name}</span>
        </td>
        <td className="px-6 py-4">
          <span className="text-sm text-gray-400">{expert.company_name || "\u2014"}</span>
        </td>
        <td className="px-6 py-4">
          <span className="text-sm text-gray-400">{expert.email}</span>
        </td>
        <td className="px-6 py-4">{renderJurisdictions(expert.jurisdictions)}</td>
        <td className="px-6 py-4">
          <span className="text-sm text-white">{clientCount}</span>
        </td>
        <td className="px-6 py-4">
          <span className="text-sm text-amber-400">{renderStars(expert.rating)}</span>
        </td>
        <td className="px-6 py-4">
          <span className="text-sm text-white font-medium">{formatCurrency(totalEarned)}</span>
        </td>
        <td className="px-6 py-4">{renderStatusBadge(expert.status)}</td>
      </tr>

      {/* Expanded detail panel */}
      {isExpanded && (
        <tr>
          <td colSpan={8} className="p-0">
            <div className="bg-navy/80 border-t border-purple/20 border-l-2 border-l-purple px-6 py-5">
              {detailLoading ? (
                <div className="flex items-center gap-3 py-4">
                  <div className="w-4 h-4 border-2 border-purple/30 border-t-purple rounded-full animate-spin" />
                  <span className="text-sm text-gray-400">Loading expert details...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Column 1: Clients list */}
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Assigned Clients ({detailClients.length})
                    </h3>
                    {detailClients.length === 0 ? (
                      <p className="text-sm text-gray-500">No active clients</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {detailClients.map((assignment) => (
                          <div
                            key={assignment.id}
                            className="flex items-center justify-between bg-navy-dark/50 rounded-lg px-3 py-2"
                          >
                            <div className="min-w-0">
                              <p className="text-sm text-white truncate">
                                {assignment.client?.full_name || "Unknown"}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {assignment.client?.email || ""}
                              </p>
                            </div>
                            <span className="text-xs text-gray-400 shrink-0 ml-2">
                              {assignment.jurisdiction && getFlag(assignment.jurisdiction)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Column 2: Earnings breakdown */}
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Earnings (Last 6 Months)
                    </h3>
                    <div className="space-y-2">
                      {detailMonthlyEarnings.map((m) => (
                        <div key={m.month} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 w-10 shrink-0">
                            {formatMonth(m.month)}
                          </span>
                          <div className="flex-1 h-5 bg-navy-dark/50 rounded overflow-hidden">
                            <div
                              className="h-full bg-purple/40 rounded transition-all"
                              style={{
                                width: `${maxEarning > 0 ? (m.total / maxEarning) * 100 : 0}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-400 w-16 text-right shrink-0">
                            {formatCurrency(m.total)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 3: Stats & details */}
                  <div className="space-y-5">
                    {/* Stats row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-navy-dark/50 rounded-lg px-3 py-3">
                        <p className="text-xs text-gray-500 mb-1">Tasks Completed</p>
                        <p className="text-lg font-bold text-white">{detailCompletedTasks}</p>
                      </div>
                      <div className="bg-navy-dark/50 rounded-lg px-3 py-3">
                        <p className="text-xs text-gray-500 mb-1">Avg. Rating</p>
                        <p className="text-lg font-bold text-amber-400">
                          {expert.rating !== null ? expert.rating.toFixed(1) : "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Account status */}
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Account Status
                      </h3>
                      <div className="flex items-center gap-2">
                        {renderStatusBadge(expert.status)}
                        <span className="text-xs text-gray-600">(read-only)</span>
                      </div>
                    </div>

                    {/* Specializations */}
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Specializations
                      </h3>
                      {expert.specializations && expert.specializations.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {expert.specializations.map((spec) => (
                            <span
                              key={spec}
                              className="px-2 py-0.5 rounded text-xs bg-purple/10 text-purple-light border border-purple/20"
                            >
                              {spec}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">None listed</p>
                      )}
                    </div>

                    {/* Jurisdictions full list */}
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Jurisdictions
                      </h3>
                      {expert.jurisdictions && expert.jurisdictions.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {expert.jurisdictions.map((j) => (
                            <span
                              key={j}
                              className="px-2 py-0.5 rounded text-xs bg-navy-dark/70 text-gray-300 border border-gray-700"
                            >
                              {getFlag(j)} {j}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">None listed</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
