"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { getFlag } from "@/lib/country-flags";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

/* =========================================================================
   Types
   ========================================================================= */

interface ClientRow {
  id: string;
  created_at: string;
  countries: string[] | null;
}

interface InvoiceRow {
  id: string;
  paid_at: string | null;
  paid_amount: number | null;
  status: string;
  expert_id: string | null;
  client_id: string | null;
}

interface TaskRow {
  id: string;
  status: string;
  client_id: string | null;
}

interface ExpertRow {
  id: string;
  full_name: string;
}

/* =========================================================================
   Constants
   ========================================================================= */

const PIE_COLORS = ["#7C3AED", "#6D28D9", "#5B21B6", "#4C1D95", "#8B5CF6", "#A78BFA"];

/* =========================================================================
   Custom Tooltip
   ========================================================================= */

function CustomTooltip({
  active,
  payload,
  label,
  isCurrency,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name?: string }>;
  label?: string;
  isCurrency?: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-navy-dark border border-gray-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-bold text-white">
        {isCurrency
          ? "$" + payload[0].value.toLocaleString()
          : payload[0].value}
      </p>
    </div>
  );
}

/* =========================================================================
   Skeleton helpers
   ========================================================================= */

function Skeleton({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`bg-gray-700/50 rounded animate-pulse ${className}`}
      style={style}
    />
  );
}

function StatCardSkeleton() {
  return (
    <div className="bg-navy-light border border-gray-700 rounded-xl p-5">
      <Skeleton className="h-3 w-20 mb-3" />
      <Skeleton className="h-7 w-24" />
    </div>
  );
}

function ChartCardSkeleton({ title }: { title: string }) {
  return (
    <div className="bg-navy-light border border-gray-700 rounded-xl p-5">
      <p className="text-sm font-medium text-gray-400 mb-4">{title}</p>
      <div className="h-64 flex items-end gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1"
            style={{ height: `${30 + Math.random() * 60}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-44 rounded-lg" />
      </div>
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      {/* Chart cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <ChartCardSkeleton key={i} title="" />
        ))}
      </div>
    </div>
  );
}

/* =========================================================================
   Empty state
   ========================================================================= */

function EmptyState({ message }: { message: string }) {
  return (
    <div className="h-64 flex items-center justify-center">
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
}

/* =========================================================================
   Helpers
   ========================================================================= */

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(key: string): string {
  const [year, month] = key.split("-");
  const d = new Date(parseInt(year), parseInt(month) - 1);
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function getLast12Months(): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  }
  return months;
}

function fmtCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}k`;
  return `$${amount.toFixed(0)}`;
}

/* =========================================================================
   Main Component
   ========================================================================= */

export default function AnalyticsTab() {
  const supabase = createClient();

  /* ---- raw data state ---- */
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [experts, setExperts] = useState<ExpertRow[]>([]);
  const [documentCount, setDocumentCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [loading, setLoading] = useState(true);

  /* ------------------------------------------------------------------
     Fetch all data
     ------------------------------------------------------------------ */

  useEffect(() => {
    async function fetchAll() {
      try {
        const [
          { data: clientData },
          { data: invoiceData },
          { data: taskData },
          { count: docCount },
          { count: msgCount },
          { data: expertData },
        ] = await Promise.all([
          supabase
            .from("clients")
            .select("id, created_at, countries"),
          supabase
            .from("invoices")
            .select("id, paid_at, paid_amount, status, expert_id, client_id"),
          supabase
            .from("tasks")
            .select("id, status, client_id"),
          supabase
            .from("documents")
            .select("id", { count: "exact", head: true }),
          supabase
            .from("messages")
            .select("id", { count: "exact", head: true }),
          supabase
            .from("experts")
            .select("id, full_name"),
        ]);

        setClients((clientData ?? []) as ClientRow[]);
        setInvoices((invoiceData ?? []) as InvoiceRow[]);
        setTasks((taskData ?? []) as TaskRow[]);
        setDocumentCount(docCount ?? 0);
        setMessageCount(msgCount ?? 0);
        setExperts((expertData ?? []) as ExpertRow[]);
      } catch (err) {
        console.error("Failed to load analytics data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------------------------------------------------------
     Computed data
     ------------------------------------------------------------------ */

  const last12 = useMemo(() => getLast12Months(), []);

  // ---- Growth: Clients by month ----
  const clientsByMonth = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of clients) {
      const key = getMonthKey(c.created_at);
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, [clients]);

  // Cumulative client count
  const cumulativeClientsData = useMemo(() => {
    let cumulative = 0;
    const windowStart = last12[0];
    for (const c of clients) {
      if (getMonthKey(c.created_at) < windowStart) cumulative++;
    }
    return last12.map((month) => {
      cumulative += clientsByMonth[month] ?? 0;
      return { month: getMonthLabel(month), total: cumulative };
    });
  }, [clients, clientsByMonth, last12]);

  // New clients per month
  const newClientsData = useMemo(() => {
    return last12.map((month) => ({
      month: getMonthLabel(month),
      count: clientsByMonth[month] ?? 0,
    }));
  }, [clientsByMonth, last12]);

  // ---- Revenue: paid invoices ----
  const paidInvoices = useMemo(() => {
    return invoices.filter(
      (inv) => inv.status === "paid" && inv.paid_at && inv.paid_amount != null
    );
  }, [invoices]);

  const totalRevenue = useMemo(() => {
    return paidInvoices.reduce((sum, inv) => sum + (inv.paid_amount ?? 0), 0);
  }, [paidInvoices]);

  // Revenue over time
  const revenueByMonth = useMemo(() => {
    const map: Record<string, number> = {};
    for (const inv of paidInvoices) {
      const key = getMonthKey(inv.paid_at!);
      map[key] = (map[key] ?? 0) + (inv.paid_amount ?? 0);
    }
    return last12.map((month) => ({
      month: getMonthLabel(month),
      revenue: map[month] ?? 0,
    }));
  }, [paidInvoices, last12]);

  // Revenue by country (join invoices with clients via client_id)
  const revenueByCountry = useMemo(() => {
    const clientMap = new Map(clients.map((c) => [c.id, c]));
    const map: Record<string, number> = {};
    for (const inv of paidInvoices) {
      const client = inv.client_id ? clientMap.get(inv.client_id) : null;
      const country = client?.countries?.[0] ?? "Unknown";
      map[country] = (map[country] ?? 0) + (inv.paid_amount ?? 0);
    }
    return Object.entries(map)
      .map(([country, revenue]) => ({ country, revenue }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [paidInvoices, clients]);

  // Revenue by expert (top 10)
  const revenueByExpert = useMemo(() => {
    const map: Record<string, number> = {};
    for (const inv of paidInvoices) {
      const key = inv.expert_id ?? "unassigned";
      map[key] = (map[key] ?? 0) + (inv.paid_amount ?? 0);
    }
    const expertMap = new Map(experts.map((e) => [e.id, e.full_name]));
    return Object.entries(map)
      .map(([expertId, revenue]) => ({
        name: expertMap.get(expertId) ?? "Unassigned",
        revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [paidInvoices, experts]);

  // Average fee
  const averageFee = useMemo(() => {
    if (paidInvoices.length === 0) return 0;
    return totalRevenue / paidInvoices.length;
  }, [totalRevenue, paidInvoices]);

  // ---- Operations ----
  const distinctTaskClients = useMemo(() => {
    const set = new Set(tasks.map((t) => t.client_id).filter(Boolean));
    return set.size;
  }, [tasks]);

  const avgTasksPerClient = useMemo(() => {
    if (distinctTaskClients === 0) return 0;
    return tasks.length / distinctTaskClients;
  }, [tasks, distinctTaskClients]);

  const completedTasks = useMemo(() => {
    return tasks.filter((t) => t.status === "completed");
  }, [tasks]);

  const taskCompletionRate = useMemo(() => {
    if (tasks.length === 0) return 0;
    return (completedTasks.length / tasks.length) * 100;
  }, [tasks, completedTasks]);

  /* ------------------------------------------------------------------
     Export PDF Report
     ------------------------------------------------------------------ */

  const handleExportPDF = useCallback(() => {
    const now = new Date();
    const monthYear = now.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    const totalClients = clients.length;
    const totalExpertsCount = experts.length;
    const revenue = fmtCurrency(totalRevenue);
    const activeCases = tasks.filter((t) => t.status !== "completed").length;

    const reportHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Handy. Platform Report - ${monthYear}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #12121f;
      color: #ffffff;
      padding: 48px;
    }
    .header {
      margin-bottom: 48px;
      border-bottom: 2px solid #7C3AED;
      padding-bottom: 24px;
    }
    .header h1 {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .header h1 span { color: #00d4aa; }
    .header p {
      margin-top: 8px;
      font-size: 14px;
      color: #9CA3AF;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 24px;
      margin-bottom: 48px;
    }
    .metric-card {
      background: #1a1a2e;
      border: 1px solid #374151;
      border-radius: 12px;
      padding: 24px;
    }
    .metric-card .label {
      font-size: 12px;
      color: #9CA3AF;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }
    .metric-card .value {
      font-size: 28px;
      font-weight: 700;
      color: #7C3AED;
    }
    .footer {
      margin-top: 48px;
      padding-top: 24px;
      border-top: 1px solid #374151;
      font-size: 11px;
      color: #6B7280;
      text-align: center;
    }
    @media print {
      body { padding: 24px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Handy<span>.</span> Platform Report</h1>
    <p>${monthYear}</p>
  </div>
  <div class="metrics-grid">
    <div class="metric-card">
      <div class="label">Total Clients</div>
      <div class="value">${totalClients}</div>
    </div>
    <div class="metric-card">
      <div class="label">Total Experts</div>
      <div class="value">${totalExpertsCount}</div>
    </div>
    <div class="metric-card">
      <div class="label">Total Revenue</div>
      <div class="value">${revenue}</div>
    </div>
    <div class="metric-card">
      <div class="label">Active Cases</div>
      <div class="value">${activeCases}</div>
    </div>
  </div>
  <div class="metrics-grid">
    <div class="metric-card">
      <div class="label">Paid Invoices</div>
      <div class="value">${paidInvoices.length}</div>
    </div>
    <div class="metric-card">
      <div class="label">Average Fee</div>
      <div class="value">${fmtCurrency(averageFee)}</div>
    </div>
    <div class="metric-card">
      <div class="label">Task Completion</div>
      <div class="value">${taskCompletionRate.toFixed(1)}%</div>
    </div>
    <div class="metric-card">
      <div class="label">Total Documents</div>
      <div class="value">${documentCount}</div>
    </div>
  </div>
  <div class="footer">
    Generated from app.handytax.io &middot; Confidential
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(reportHTML);
      printWindow.document.close();
    }
  }, [
    clients,
    experts,
    totalRevenue,
    tasks,
    paidInvoices,
    averageFee,
    taskCompletionRate,
    documentCount,
  ]);

  /* ------------------------------------------------------------------
     Render
     ------------------------------------------------------------------ */

  if (loading) return <SkeletonGrid />;

  const hasClients = clients.length > 0;
  const hasRevenue = paidInvoices.length > 0;
  const hasTasks = tasks.length > 0;

  return (
    <div className="space-y-10">
      {/* ---- Header with Export ---- */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Platform performance &middot; Updated in real time
          </p>
        </div>
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple text-white font-semibold text-sm hover:bg-purple-dark transition-colors shadow-lg shadow-purple/20"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
            />
          </svg>
          Export PDF Report
        </button>
      </div>

      {/* ================================================================
          GROWTH SECTION
          ================================================================ */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">
          Growth
        </h2>

        {!hasClients ? (
          <div className="bg-navy-light border border-gray-700 rounded-xl p-5">
            <EmptyState message="Add your first client to see growth metrics." />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Clients Over Time (cumulative) */}
            <div className="bg-navy-light border border-gray-700 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">
                Clients Over Time
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={cumulativeClientsData}>
                  <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#9CA3AF", fontSize: 11 }}
                    axisLine={{ stroke: "#374151" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#9CA3AF", fontSize: 11 }}
                    axisLine={{ stroke: "#374151" }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="total"
                    name="Total Clients"
                    stroke="#7C3AED"
                    strokeWidth={2.5}
                    dot={{ fill: "#7C3AED", r: 3 }}
                    activeDot={{
                      fill: "#8B5CF6",
                      r: 5,
                      stroke: "#7C3AED",
                      strokeWidth: 2,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* 2. New Clients Per Month */}
            <div className="bg-navy-light border border-gray-700 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">
                New Clients Per Month
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={newClientsData}>
                  <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#9CA3AF", fontSize: 11 }}
                    axisLine={{ stroke: "#374151" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#9CA3AF", fontSize: 11 }}
                    axisLine={{ stroke: "#374151" }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="count"
                    name="New Clients"
                    fill="#7C3AED"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </section>

      {/* ================================================================
          REVENUE SECTION
          ================================================================ */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">
          Revenue
        </h2>

        {!hasRevenue ? (
          <div className="bg-navy-light border border-gray-700 rounded-xl p-5">
            <EmptyState message="No paid invoices yet. Revenue metrics will appear once clients start paying." />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 3. Revenue Over Time */}
              <div className="bg-navy-light border border-gray-700 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-300 mb-4">
                  Revenue Over Time
                </h3>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={revenueByMonth}>
                    <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "#9CA3AF", fontSize: 11 }}
                      axisLine={{ stroke: "#374151" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#9CA3AF", fontSize: 11 }}
                      axisLine={{ stroke: "#374151" }}
                      tickLine={false}
                      tickFormatter={(v: number) =>
                        `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                      }
                    />
                    <Tooltip content={<CustomTooltip isCurrency />} />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="#7C3AED"
                      strokeWidth={2.5}
                      dot={{ fill: "#7C3AED", r: 3 }}
                      activeDot={{
                        fill: "#8B5CF6",
                        r: 5,
                        stroke: "#7C3AED",
                        strokeWidth: 2,
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* 4. Revenue by Country (PieChart) */}
              <div className="bg-navy-light border border-gray-700 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-300 mb-4">
                  Revenue by Country
                </h3>
                {revenueByCountry.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={revenueByCountry}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={95}
                        dataKey="revenue"
                        nameKey="country"
                        paddingAngle={2}
                        stroke="none"
                      >
                        {revenueByCountry.map((_, index) => (
                          <Cell
                            key={index}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload || payload.length === 0)
                            return null;
                          const data = payload[0].payload;
                          return (
                            <div className="bg-navy-dark border border-gray-700 rounded-lg px-3 py-2 shadow-xl">
                              <p className="text-sm text-white font-medium">
                                {getFlag(data.country)} {data.country}
                              </p>
                              <p className="text-xs text-gray-400">
                                ${data.revenue.toLocaleString()}
                              </p>
                            </div>
                          );
                        }}
                      />
                      <Legend
                        formatter={(value: string) => (
                          <span className="text-xs text-gray-400">
                            {getFlag(value)} {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="No country data available" />
                )}
              </div>
            </div>

            {/* 5. Revenue by Expert (horizontal BarChart, top 10) */}
            <div className="bg-navy-light border border-gray-700 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">
                Revenue by Expert (Top 10)
              </h3>
              {revenueByExpert.length > 0 ? (
                <ResponsiveContainer
                  width="100%"
                  height={Math.max(200, revenueByExpert.length * 48)}
                >
                  <BarChart
                    data={revenueByExpert}
                    layout="vertical"
                    margin={{ left: 20 }}
                  >
                    <CartesianGrid
                      stroke="#374151"
                      strokeDasharray="3 3"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tick={{ fill: "#9CA3AF", fontSize: 11 }}
                      axisLine={{ stroke: "#374151" }}
                      tickLine={false}
                      tickFormatter={(v: number) =>
                        `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                      }
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fill: "#9CA3AF", fontSize: 12 }}
                      axisLine={{ stroke: "#374151" }}
                      tickLine={false}
                      width={120}
                    />
                    <Tooltip content={<CustomTooltip isCurrency />} />
                    <Bar
                      dataKey="revenue"
                      name="Revenue"
                      fill="#7C3AED"
                      radius={[0, 4, 4, 0]}
                      barSize={28}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="No expert revenue data yet" />
              )}
            </div>

            {/* 6. Average Fee stat card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-navy-light border border-gray-700 rounded-xl p-5">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold text-white">
                  {fmtCurrency(totalRevenue)}
                </p>
              </div>
              <div className="bg-navy-light border border-gray-700 rounded-xl p-5">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                  Paid Invoices
                </p>
                <p className="text-2xl font-bold text-white">
                  {paidInvoices.length}
                </p>
              </div>
              <div className="bg-navy-light border border-gray-700 rounded-xl p-5">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                  Average Fee
                </p>
                <p className="text-2xl font-bold text-purple-light">
                  {fmtCurrency(averageFee)}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ================================================================
          OPERATIONS SECTION
          ================================================================ */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">
          Operations
        </h2>

        {!hasTasks && documentCount === 0 && messageCount === 0 ? (
          <div className="bg-navy-light border border-gray-700 rounded-xl p-5">
            <EmptyState message="Start processing tasks, documents, and messages to see operational metrics." />
          </div>
        ) : (
          <div className="space-y-6">
            {/* 7. Stats cards row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-navy-light border border-gray-700 rounded-xl p-5">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                  Tasks per Client
                </p>
                <p className="text-2xl font-bold text-white">
                  {avgTasksPerClient.toFixed(1)}
                </p>
                <p className="text-xs text-gray-500 mt-1">avg</p>
              </div>
              <div className="bg-navy-light border border-gray-700 rounded-xl p-5">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                  Task Completion Rate
                </p>
                <p className="text-2xl font-bold text-white">
                  {taskCompletionRate.toFixed(1)}%
                </p>
                <p
                  className={`text-xs mt-1 ${
                    taskCompletionRate >= 75
                      ? "text-green-400"
                      : taskCompletionRate >= 50
                        ? "text-yellow-400"
                        : "text-red-400"
                  }`}
                >
                  {taskCompletionRate >= 75
                    ? "Healthy"
                    : taskCompletionRate >= 50
                      ? "Moderate"
                      : "Needs attention"}
                </p>
              </div>
              <div className="bg-navy-light border border-gray-700 rounded-xl p-5">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                  Total Documents
                </p>
                <p className="text-2xl font-bold text-white">
                  {documentCount.toLocaleString()}
                </p>
              </div>
              <div className="bg-navy-light border border-gray-700 rounded-xl p-5">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                  Total Messages
                </p>
                <p className="text-2xl font-bold text-white">
                  {messageCount.toLocaleString()}
                </p>
              </div>
            </div>

            {/* 8. Task completion rate progress bar */}
            <div className="bg-navy-light border border-gray-700 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-300">
                  Task Completion Progress
                </h3>
                <span className="text-sm font-bold text-white">
                  {completedTasks.length} / {tasks.length} tasks
                </span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${Math.max(taskCompletionRate, tasks.length > 0 ? 2 : 0)}%`,
                    background:
                      "linear-gradient(90deg, #7C3AED 0%, #8B5CF6 100%)",
                  }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">0%</span>
                <span
                  className={`text-xs font-semibold ${
                    taskCompletionRate >= 75
                      ? "text-green-400"
                      : taskCompletionRate >= 50
                        ? "text-yellow-400"
                        : "text-gray-400"
                  }`}
                >
                  {taskCompletionRate.toFixed(1)}%
                </span>
                <span className="text-xs text-gray-500">100%</span>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
