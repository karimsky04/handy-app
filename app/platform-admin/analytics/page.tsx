"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import { getFlag } from "@/lib/country-flags";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ClientRow {
  id: string;
  created_at: string;
  countries: string[] | null;
  overall_status: string | null;
  pipeline_stage: string | null;
}

interface InvoiceRow {
  id: string;
  paid_at: string | null;
  paid_amount: number | null;
  currency: string;
  status: string;
  expert_id: string | null;
  client_id: string | null;
  created_at: string;
}

interface TaskRow {
  id: string;
  status: string;
  expert_id: string | null;
  client_id: string | null;
  created_at: string;
  completed_at: string | null;
}

interface ExpertRow {
  id: string;
  full_name: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PURPLE_PALETTE = ["#7C3AED", "#8B5CF6", "#6D28D9", "#A78BFA", "#C4B5FD"];

const PIPELINE_STAGES = [
  "Quote Request",
  "Data Collection",
  "Assessment",
  "Processing",
  "Delivery",
  "Complete",
];

// ---------------------------------------------------------------------------
// Custom Tooltip
// ---------------------------------------------------------------------------

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-navy-light border border-gray-700 rounded-lg px-3 py-2 shadow-xl">
      {label && <p className="text-xs text-gray-400 mb-1">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="text-sm text-white font-medium">
          <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: entry.color || PURPLE_PALETTE[0] }} />
          {entry.name}: {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  trend,
  prefix,
  suffix,
}: {
  label: string;
  value: string | number;
  trend?: { direction: "up" | "down" | "neutral"; text: string };
  prefix?: string;
  suffix?: string;
}) {
  return (
    <div className="bg-navy-light border border-gray-700 rounded-xl p-5">
      <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">{label}</p>
      <p className="text-2xl font-bold text-white">
        {prefix}
        {typeof value === "number" ? value.toLocaleString(undefined, { maximumFractionDigits: 1 }) : value}
        {suffix}
      </p>
      {trend && (
        <p
          className={`text-xs mt-1 ${
            trend.direction === "up"
              ? "text-green-400"
              : trend.direction === "down"
                ? "text-red-400"
                : "text-gray-500"
          }`}
        >
          {trend.direction === "up" ? "\u2191" : trend.direction === "down" ? "\u2193" : "\u2014"} {trend.text}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 bg-purple/5 border border-purple/20 rounded-xl p-5">
      <svg className="w-5 h-5 text-purple-light shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      </svg>
      <p className="text-sm text-purple-light">{message}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton Loader
// ---------------------------------------------------------------------------

function SkeletonGrid() {
  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 bg-gray-700/50 rounded animate-pulse" />
        <div className="h-10 w-44 bg-gray-700/50 rounded-lg animate-pulse" />
      </div>
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-navy-light border border-gray-700 rounded-xl p-5 animate-pulse">
            <div className="h-3 w-20 bg-gray-700/50 rounded mb-3" />
            <div className="h-7 w-16 bg-gray-700/50 rounded" />
          </div>
        ))}
      </div>
      {/* Chart cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-navy-light border border-gray-700 rounded-xl p-5 animate-pulse">
            <div className="h-4 w-32 bg-gray-700/50 rounded mb-4" />
            <div className="h-52 bg-gray-700/30 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

function fmtCurrency(amount: number): string {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}k`;
  return amount.toFixed(0);
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function AnalyticsPage() {
  const supabase = createClient();

  // Raw data
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [experts, setExperts] = useState<ExpertRow[]>([]);
  const [documentCount, setDocumentCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // -------------------------------------------------------------------------
  // Fetch all data
  // -------------------------------------------------------------------------

  useEffect(() => {
    async function fetchAll() {
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
          .select("id, created_at, countries, overall_status, pipeline_stage"),
        supabase
          .from("invoices")
          .select("id, paid_at, paid_amount, currency, status, expert_id, client_id, created_at"),
        supabase
          .from("tasks")
          .select("id, status, expert_id, client_id, created_at, completed_at"),
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
      setLoading(false);
    }

    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------------------
  // Computed metrics
  // -------------------------------------------------------------------------

  const last12 = useMemo(() => getLast12Months(), []);

  // --- Growth ---
  const clientsByMonth = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of clients) {
      const key = getMonthKey(c.created_at);
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, [clients]);

  const cumulativeClientsData = useMemo(() => {
    let cumulative = 0;
    // Count all clients before the 12-month window
    const windowStart = last12[0];
    for (const c of clients) {
      if (getMonthKey(c.created_at) < windowStart) cumulative++;
    }
    return last12.map((month) => {
      cumulative += clientsByMonth[month] ?? 0;
      return { month: getMonthLabel(month), total: cumulative };
    });
  }, [clients, clientsByMonth, last12]);

  const newClientsData = useMemo(() => {
    return last12.map((month) => ({
      month: getMonthLabel(month),
      count: clientsByMonth[month] ?? 0,
    }));
  }, [clientsByMonth, last12]);

  const activeClients = useMemo(() => {
    return clients.filter(
      (c) =>
        c.overall_status !== "completed" &&
        c.overall_status !== "Complete" &&
        c.overall_status !== "archived" &&
        c.overall_status !== "cancelled"
    ).length;
  }, [clients]);

  const retentionRate = useMemo(() => {
    if (clients.length === 0) return 0;
    return (activeClients / clients.length) * 100;
  }, [clients, activeClients]);

  // --- Revenue ---
  const paidInvoices = useMemo(() => {
    return invoices.filter((inv) => inv.status === "paid" && inv.paid_at && inv.paid_amount != null);
  }, [invoices]);

  const totalRevenue = useMemo(() => {
    return paidInvoices.reduce((sum, inv) => sum + (inv.paid_amount ?? 0), 0);
  }, [paidInvoices]);

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

  const revenueByCountry = useMemo(() => {
    const map: Record<string, number> = {};
    const clientMap = new Map(clients.map((c) => [c.id, c]));
    for (const inv of paidInvoices) {
      const client = inv.client_id ? clientMap.get(inv.client_id) : null;
      const country = client?.countries?.[0] ?? "Unknown";
      map[country] = (map[country] ?? 0) + (inv.paid_amount ?? 0);
    }
    return Object.entries(map)
      .map(([country, revenue]) => ({ country, revenue }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [paidInvoices, clients]);

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
      .sort((a, b) => b.revenue - a.revenue);
  }, [paidInvoices, experts]);

  const clientsWithPaidInvoices = useMemo(() => {
    const set = new Set(paidInvoices.map((inv) => inv.client_id).filter(Boolean));
    return set.size;
  }, [paidInvoices]);

  const avgFeePerClient = useMemo(() => {
    if (clientsWithPaidInvoices === 0) return 0;
    return totalRevenue / clientsWithPaidInvoices;
  }, [totalRevenue, clientsWithPaidInvoices]);

  const mrr = useMemo(() => {
    const recentMonths = last12.slice(-3);
    const revenueMap: Record<string, number> = {};
    for (const inv of paidInvoices) {
      const key = getMonthKey(inv.paid_at!);
      revenueMap[key] = (revenueMap[key] ?? 0) + (inv.paid_amount ?? 0);
    }
    let total = 0;
    let monthsWithData = 0;
    for (const m of recentMonths) {
      const rev = revenueMap[m] ?? 0;
      total += rev;
      if (rev > 0) monthsWithData++;
    }
    return monthsWithData > 0 ? total / monthsWithData : 0;
  }, [paidInvoices, last12]);

  // --- Operational ---
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

  const avgCompletionDays = useMemo(() => {
    const tasksWithBothDates = completedTasks.filter((t) => t.completed_at && t.created_at);
    if (tasksWithBothDates.length === 0) return 0;
    const totalDays = tasksWithBothDates.reduce((sum, t) => {
      const created = new Date(t.created_at).getTime();
      const completed = new Date(t.completed_at!).getTime();
      return sum + (completed - created) / (1000 * 60 * 60 * 24);
    }, 0);
    return totalDays / tasksWithBothDates.length;
  }, [completedTasks]);

  // --- Pipeline ---
  const conversionRate = useMemo(() => {
    if (clients.length === 0) return 0;
    const completedClients = clients.filter(
      (c) =>
        c.pipeline_stage === "Complete" ||
        c.overall_status === "completed" ||
        c.overall_status === "Complete"
    ).length;
    return (completedClients / clients.length) * 100;
  }, [clients]);

  const stageDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of clients) {
      const stage = c.pipeline_stage ?? "Not Set";
      map[stage] = (map[stage] ?? 0) + 1;
    }
    // Ensure all pipeline stages appear (even if 0)
    for (const stage of PIPELINE_STAGES) {
      if (!map[stage]) map[stage] = 0;
    }
    // Include "Not Set" if it exists
    const orderedStages = [...PIPELINE_STAGES];
    if (map["Not Set"]) orderedStages.unshift("Not Set");
    return orderedStages
      .filter((s) => map[s] !== undefined)
      .map((stage) => ({
        stage,
        count: map[stage] ?? 0,
        pct: clients.length > 0 ? ((map[stage] ?? 0) / clients.length) * 100 : 0,
      }));
  }, [clients]);

  // -------------------------------------------------------------------------
  // PDF Export
  // -------------------------------------------------------------------------

  async function handleExportPDF() {
    const reportEl = document.getElementById("analytics-report");
    if (!reportEl) return;

    const canvas = await html2canvas(reportEl, {
      backgroundColor: "#12121f",
      scale: 2,
    });

    const pdf = new jsPDF("p", "mm", "a4");
    const imgData = canvas.toDataURL("image/png");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    // Add title
    pdf.setFontSize(20);
    pdf.setTextColor(124, 58, 237);
    pdf.text("Handy. Platform Report", 15, 20);
    pdf.setFontSize(10);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
      15,
      28
    );

    // Add chart image
    pdf.addImage(imgData, "PNG", 5, 35, pdfWidth - 10, pdfHeight * 0.8);

    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 120);
    pdf.text(
      "Generated from app.handytax.io | Confidential",
      15,
      pdf.internal.pageSize.getHeight() - 10
    );

    pdf.save(`handy-platform-report-${new Date().toISOString().slice(0, 7)}.pdf`);
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (loading) return <SkeletonGrid />;

  const hasClients = clients.length > 0;
  const hasRevenue = paidInvoices.length > 0;
  const hasTasks = tasks.length > 0;

  return (
    <div className="p-6 lg:p-8 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Platform performance &middot; Updated in real time
          </p>
        </div>
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple text-white font-semibold text-sm hover:bg-purple-dark transition-colors shadow-lg shadow-purple/20"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Export PDF Report
        </button>
      </div>

      {/* === Report Area (captured for PDF) === */}
      <div id="analytics-report" className="space-y-8">
        {/* ================================================================
            SECTION 1: GROWTH METRICS
        ================================================================ */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
            Growth Metrics
          </h2>

          {!hasClients ? (
            <EmptyState message="Add your first client to see growth metrics." />
          ) : (
            <>
              {/* Retention stat */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <StatCard label="Total Clients" value={clients.length} />
                <StatCard label="Active Clients" value={activeClients} />
                <StatCard label="Client Retention Rate" value={retentionRate.toFixed(1)} suffix="%" />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cumulative Clients */}
                <div className="bg-navy-light border border-gray-700 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4">Clients Over Time</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={cumulativeClientsData}>
                      <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="total"
                        name="Total Clients"
                        stroke="#7C3AED"
                        strokeWidth={2.5}
                        dot={{ fill: "#7C3AED", r: 3 }}
                        activeDot={{ fill: "#8B5CF6", r: 5, stroke: "#7C3AED", strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* New Clients Per Month */}
                <div className="bg-navy-light border border-gray-700 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4">New Clients Per Month</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={newClientsData}>
                      <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="New Clients" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </section>

        {/* ================================================================
            SECTION 2: REVENUE METRICS
        ================================================================ */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Revenue Metrics
          </h2>

          {!hasRevenue ? (
            <EmptyState message="No paid invoices yet. Revenue metrics will appear once clients start paying." />
          ) : (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard label="Total Revenue" value={fmtCurrency(totalRevenue)} prefix="$" />
                <StatCard label="Avg Fee per Client" value={fmtCurrency(avgFeePerClient)} prefix="$" />
                <StatCard label="MRR Estimate" value={fmtCurrency(mrr)} prefix="$" />
                <StatCard label="Paying Clients" value={clientsWithPaidInvoices} />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Over Time */}
                <div className="bg-navy-light border border-gray-700 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4">Revenue Over Time</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={revenueByMonth}>
                      <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${fmtCurrency(v)}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="revenue" name="Revenue" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Revenue By Country */}
                <div className="bg-navy-light border border-gray-700 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4">Revenue by Country</h3>
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
                            <Cell key={index} fill={PURPLE_PALETTE[index % PURPLE_PALETTE.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload || payload.length === 0) return null;
                            const data = payload[0].payload;
                            return (
                              <div className="bg-navy-light border border-gray-700 rounded-lg px-3 py-2 shadow-xl">
                                <p className="text-sm text-white font-medium">
                                  {getFlag(data.country)} {data.country}
                                </p>
                                <p className="text-xs text-gray-400">${data.revenue.toLocaleString()}</p>
                              </div>
                            );
                          }}
                        />
                        <Legend
                          formatter={(value: string) => (
                            <span className="text-xs text-gray-400">{getFlag(value)} {value}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-10">No country data</p>
                  )}
                </div>

                {/* Revenue By Expert */}
                <div className="bg-navy-light border border-gray-700 rounded-xl p-5 lg:col-span-2">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4">Revenue by Expert</h3>
                  <ResponsiveContainer width="100%" height={Math.max(200, revenueByExpert.length * 48)}>
                    <BarChart data={revenueByExpert} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid stroke="#374151" strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${fmtCurrency(v)}`} />
                      <YAxis type="category" dataKey="name" tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={false} tickLine={false} width={120} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="revenue" name="Revenue" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </section>

        {/* ================================================================
            SECTION 3: OPERATIONAL METRICS
        ================================================================ */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.384 3.08A1.5 1.5 0 014.5 16.92V7.08a1.5 1.5 0 011.536-1.33l5.384 3.08a1.5 1.5 0 010 2.66zm7.5-4.33l-5.384 3.08a1.5 1.5 0 01-1.536-2.66l5.384-3.08a1.5 1.5 0 011.536 2.66z" />
            </svg>
            Operational Metrics
          </h2>

          {!hasTasks && documentCount === 0 && messageCount === 0 ? (
            <EmptyState message="Start processing tasks, documents, and messages to see operational metrics." />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <StatCard label="Avg Tasks / Client" value={avgTasksPerClient.toFixed(1)} />
              <StatCard
                label="Task Completion"
                value={taskCompletionRate.toFixed(1)}
                suffix="%"
                trend={
                  taskCompletionRate >= 75
                    ? { direction: "up", text: "Healthy" }
                    : taskCompletionRate >= 50
                      ? { direction: "neutral", text: "Moderate" }
                      : { direction: "down", text: "Needs attention" }
                }
              />
              <StatCard
                label="Avg Completion"
                value={avgCompletionDays.toFixed(1)}
                suffix=" days"
              />
              <StatCard label="Documents Processed" value={documentCount} />
              <StatCard label="Messages Sent" value={messageCount} />
            </div>
          )}
        </section>

        {/* ================================================================
            SECTION 4: PIPELINE HEALTH
        ================================================================ */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
            </svg>
            Pipeline Health
          </h2>

          {!hasClients ? (
            <EmptyState message="Add clients to see pipeline health and conversion metrics." />
          ) : (
            <>
              {/* Top-line stat */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <StatCard
                  label="Conversion Rate"
                  value={conversionRate.toFixed(1)}
                  suffix="%"
                  trend={
                    conversionRate >= 50
                      ? { direction: "up", text: "Strong" }
                      : conversionRate >= 25
                        ? { direction: "neutral", text: "Growing" }
                        : { direction: "down", text: "Early stage" }
                  }
                />
                <StatCard label="Total in Pipeline" value={clients.length} />
                <StatCard
                  label="Completed"
                  value={clients.filter(
                    (c) =>
                      c.pipeline_stage === "Complete" ||
                      c.overall_status === "completed" ||
                      c.overall_status === "Complete"
                  ).length}
                />
              </div>

              {/* Stage distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar chart */}
                <div className="bg-navy-light border border-gray-700 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4">Stage Distribution</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={stageDistribution} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid stroke="#374151" strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <YAxis type="category" dataKey="stage" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Clients" radius={[0, 4, 4, 0]} barSize={22}>
                        {stageDistribution.map((_, index) => (
                          <Cell key={index} fill={PURPLE_PALETTE[index % PURPLE_PALETTE.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Drop-off funnel */}
                <div className="bg-navy-light border border-gray-700 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4">Pipeline Funnel</h3>
                  <div className="space-y-3">
                    {stageDistribution.map((item, i) => {
                      const maxCount = Math.max(...stageDistribution.map((s) => s.count), 1);
                      const barWidth = (item.count / maxCount) * 100;

                      return (
                        <div key={item.stage}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-400">{item.stage}</span>
                            <span className="text-xs text-gray-300 font-medium">
                              {item.count} <span className="text-gray-500">({item.pct.toFixed(0)}%)</span>
                            </span>
                          </div>
                          <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.max(barWidth, item.count > 0 ? 3 : 0)}%`,
                                backgroundColor: PURPLE_PALETTE[i % PURPLE_PALETTE.length],
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Drop-off arrows between stages */}
                  <div className="mt-6 pt-4 border-t border-gray-700/50">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Stage-to-Stage Drop-off</p>
                    <div className="space-y-2">
                      {stageDistribution.slice(0, -1).map((item, i) => {
                        const next = stageDistribution[i + 1];
                        if (!next || item.count === 0) return null;
                        const dropoff = item.count - next.count;
                        const dropoffPct = (dropoff / item.count) * 100;
                        return (
                          <div key={item.stage + "->" + next.stage} className="flex items-center gap-2 text-xs">
                            <span className="text-gray-400 w-24 truncate">{item.stage}</span>
                            <svg className="w-3 h-3 text-gray-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                            <span className="text-gray-400 w-24 truncate">{next.stage}</span>
                            <span
                              className={`font-medium ml-auto ${
                                dropoffPct > 30 ? "text-red-400" : dropoffPct > 10 ? "text-yellow-400" : "text-green-400"
                              }`}
                            >
                              {dropoff >= 0 ? `-${dropoff}` : `+${Math.abs(dropoff)}`}
                              <span className="text-gray-500 ml-1">
                                ({dropoffPct >= 0 ? dropoffPct.toFixed(0) : 0}%)
                              </span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
