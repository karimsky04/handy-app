"use client";

import { useEffect, useState } from "react";
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
} from "recharts";

/* ====================== TYPES ====================== */

interface DashboardStats {
  totalClients: number;
  totalExperts: number;
  activeCases: number;
  revenueThisMonth: number;
  revenueThisQuarter: number;
  totalRevenue: number;
}

interface ClientGrowthPoint {
  month: string;
  count: number;
}

interface RevenuePoint {
  month: string;
  revenue: number;
}

interface PipelineStage {
  stage: string;
  count: number;
  percentage: number;
}

interface ActivityEntry {
  id: string;
  action: string;
  details: string | null;
  created_at: string;
}

interface CountryBreakdown {
  country: string;
  count: number;
}

/* ====================== HELPERS ====================== */

function formatCurrency(amount: number): string {
  return "$" + amount.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function relativeTime(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? "s" : ""} ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? "s" : ""} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? "s" : ""} ago`;
  if (diffWeek < 5) return `${diffWeek} week${diffWeek !== 1 ? "s" : ""} ago`;
  return `${diffMonth} month${diffMonth !== 1 ? "s" : ""} ago`;
}

function getActionIcon(action: string): string {
  const lower = action.toLowerCase();
  if (lower.includes("client") && (lower.includes("create") || lower.includes("add") || lower.includes("new"))) return "\u{1F464}";
  if (lower.includes("invoice") || lower.includes("payment") || lower.includes("paid")) return "\u{1F4B0}";
  if (lower.includes("task") || lower.includes("complete")) return "\u2705";
  if (lower.includes("document") || lower.includes("upload") || lower.includes("file")) return "\u{1F4C4}";
  if (lower.includes("quote") || lower.includes("sent")) return "\u{1F4E8}";
  if (lower.includes("message") || lower.includes("note")) return "\u{1F4AC}";
  if (lower.includes("expert") || lower.includes("assign")) return "\u{1F9D1}\u200D\u{1F4BC}";
  if (lower.includes("status") || lower.includes("update")) return "\u{1F504}";
  if (lower.includes("login") || lower.includes("auth")) return "\u{1F511}";
  return "\u{1F4CB}";
}

function getMonthLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function getStartOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

function getStartOfQuarter(): string {
  const now = new Date();
  const qMonth = Math.floor(now.getMonth() / 3) * 3;
  return new Date(now.getFullYear(), qMonth, 1).toISOString();
}

const PIPELINE_STAGES = [
  "Quote Request",
  "Data Collection",
  "Assessment",
  "Processing",
  "Delivery",
  "Complete",
];

/* ====================== SKELETON ====================== */

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
            style={{ height: `${30 + Math.random() * 60}%` } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  );
}

/* ====================== CUSTOM TOOLTIP ====================== */

function CustomTooltip({
  active,
  payload,
  label,
  isCurrency,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  isCurrency?: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-navy-dark border border-gray-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-bold text-white">
        {isCurrency ? formatCurrency(payload[0].value) : payload[0].value}
      </p>
    </div>
  );
}

/* ====================== MAIN COMPONENT ====================== */

export default function OverviewTab() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [clientGrowth, setClientGrowth] = useState<ClientGrowthPoint[]>([]);
  const [revenueChart, setRevenueChart] = useState<RevenuePoint[]>([]);
  const [pipeline, setPipeline] = useState<PipelineStage[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [countryBreakdown, setCountryBreakdown] = useState<CountryBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAll() {
      const supabase = createClient();

      try {
        const [
          { count: totalClients },
          { count: totalExperts },
          { count: activeCases },
          { data: allPayments },
          { data: monthPayments },
          { data: quarterPayments },
          { data: allClients },
          { data: allPaymentsForChart },
          { data: pipelineClients },
          { data: activityRows },
          { data: clientCountries },
        ] = await Promise.all([
          // Stats: client count
          supabase.from("clients").select("*", { count: "exact", head: true }),
          // Stats: expert count
          supabase.from("experts").select("*", { count: "exact", head: true }),
          // Stats: active cases (from client_experts)
          supabase
            .from("client_experts")
            .select("*", { count: "exact", head: true })
            .eq("status", "active"),
          // Stats: total revenue (from payments)
          supabase.from("payments").select("amount"),
          // Stats: revenue this month
          supabase
            .from("payments")
            .select("amount")
            .gte("payment_date", getStartOfMonth()),
          // Stats: revenue this quarter
          supabase
            .from("payments")
            .select("amount")
            .gte("payment_date", getStartOfQuarter()),
          // Client growth chart
          supabase.from("clients").select("created_at"),
          // Revenue chart (from payments)
          supabase.from("payments").select("amount, payment_date"),
          // Pipeline funnel
          supabase.from("clients").select("pipeline_stage"),
          // Activity feed
          supabase
            .from("activity_log")
            .select("id, action, details, created_at")
            .order("created_at", { ascending: false })
            .limit(20),
          // Country breakdown
          supabase.from("clients").select("countries"),
        ]);

        // --- Stats ---
        const sumPayments = (rows: Array<{ amount: number }> | null) =>
          (rows ?? []).reduce((acc, r) => acc + (r.amount ?? 0), 0);

        setStats({
          totalClients: totalClients ?? 0,
          totalExperts: totalExperts ?? 0,
          activeCases: activeCases ?? 0,
          revenueThisMonth: sumPayments(monthPayments),
          revenueThisQuarter: sumPayments(quarterPayments),
          totalRevenue: sumPayments(allPayments),
        });

        // --- Client Growth (last 12 months) ---
        const now = new Date();
        const monthBuckets: Record<string, number> = {};
        for (let i = 11; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          monthBuckets[getMonthLabel(d)] = 0;
        }

        (allClients ?? []).forEach((c: { created_at: string }) => {
          const d = new Date(c.created_at);
          const label = getMonthLabel(d);
          if (label in monthBuckets) {
            monthBuckets[label]++;
          }
        });

        setClientGrowth(
          Object.entries(monthBuckets).map(([month, count]) => ({ month, count }))
        );

        // --- Revenue Chart (last 12 months) ---
        const revBuckets: Record<string, number> = {};
        for (let i = 11; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          revBuckets[getMonthLabel(d)] = 0;
        }

        (allPaymentsForChart ?? []).forEach((p: { amount: number; payment_date: string }) => {
          if (!p.payment_date) return;
          const d = new Date(p.payment_date);
          const label = getMonthLabel(d);
          if (label in revBuckets) {
            revBuckets[label] += p.amount ?? 0;
          }
        });

        setRevenueChart(
          Object.entries(revBuckets).map(([month, revenue]) => ({ month, revenue }))
        );

        // --- Pipeline Funnel ---
        const stageCounts: Record<string, number> = {};
        PIPELINE_STAGES.forEach((s) => (stageCounts[s] = 0));

        (pipelineClients ?? []).forEach((c: { pipeline_stage: string | null }) => {
          const stage = c.pipeline_stage ?? "";
          if (stage in stageCounts) {
            stageCounts[stage]++;
          }
        });

        const total = Object.values(stageCounts).reduce((a, b) => a + b, 0);
        setPipeline(
          PIPELINE_STAGES.map((stage) => ({
            stage,
            count: stageCounts[stage],
            percentage: total > 0 ? Math.round((stageCounts[stage] / total) * 100) : 0,
          }))
        );

        // --- Activity Feed ---
        setActivity((activityRows as ActivityEntry[]) ?? []);

        // --- Country Breakdown ---
        const countryCounts: Record<string, number> = {};
        (clientCountries ?? []).forEach((c: { countries: string[] | null }) => {
          (c.countries ?? []).forEach((country) => {
            countryCounts[country] = (countryCounts[country] ?? 0) + 1;
          });
        });

        const sorted = Object.entries(countryCounts)
          .map(([country, count]) => ({ country, count }))
          .sort((a, b) => b.count - a.count);

        setCountryBreakdown(sorted);
      } catch (err) {
        console.error("Failed to load overview data:", err);
        setError("Failed to load dashboard data. Please try again.");
        setStats({
          totalClients: 0,
          totalExperts: 0,
          activeCases: 0,
          revenueThisMonth: 0,
          revenueThisQuarter: 0,
          totalRevenue: 0,
        });
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, []);

  const maxCountry = countryBreakdown.length > 0 ? countryBreakdown[0].count : 1;

  /* ====================== ERROR STATE ====================== */

  if (error && !loading && !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-400 text-sm mb-3">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              window.location.reload();
            }}
            className="px-4 py-2 bg-purple/20 text-purple-light rounded-lg text-sm hover:bg-purple/30 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  /* ====================== STAT CARDS CONFIG ====================== */

  const statCards = stats
    ? [
        {
          label: "Total Clients",
          value: String(stats.totalClients),
          icon: (
            <svg className="w-5 h-5 text-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          ),
        },
        {
          label: "Total Experts",
          value: String(stats.totalExperts),
          icon: (
            <svg className="w-5 h-5 text-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
            </svg>
          ),
        },
        {
          label: "Active Cases",
          value: String(stats.activeCases),
          icon: (
            <svg className="w-5 h-5 text-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          ),
        },
        {
          label: "Revenue This Month",
          value: formatCurrency(stats.revenueThisMonth),
          icon: (
            <svg className="w-5 h-5 text-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          highlight: true,
        },
        {
          label: "Revenue This Quarter",
          value: formatCurrency(stats.revenueThisQuarter),
          icon: (
            <svg className="w-5 h-5 text-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
          ),
          highlight: true,
        },
        {
          label: "Total Revenue",
          value: formatCurrency(stats.totalRevenue),
          icon: (
            <svg className="w-5 h-5 text-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
            </svg>
          ),
          highlight: true,
        },
      ]
    : [];

  /* ====================== RENDER ====================== */

  return (
    <div className="space-y-8">
      {/* Stats Row -- 3x2 grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)
          : statCards.map((card) => (
              <div
                key={card.label}
                className="bg-navy-light border border-gray-700 rounded-xl p-5"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-400">{card.label}</p>
                  {card.icon}
                </div>
                <p
                  className={`text-2xl font-bold ${
                    card.highlight ? "text-purple-light" : "text-white"
                  }`}
                >
                  {card.value}
                </p>
              </div>
            ))}
      </div>

      {/* Charts Row -- 2 column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Growth Chart */}
        {loading ? (
          <ChartCardSkeleton title="Client Growth (Last 12 Months)" />
        ) : (
          <div className="bg-navy-light border border-gray-700 rounded-xl p-5">
            <p className="text-sm font-medium text-gray-400 mb-4">
              Client Growth (Last 12 Months)
            </p>
            {clientGrowth.every((p) => p.count === 0) ? (
              <div className="h-64 flex items-center justify-center">
                <p className="text-gray-500 text-sm">
                  Add your first client to see growth metrics
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={clientGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
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
                  <Tooltip
                    content={<CustomTooltip />}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#7C3AED"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#7C3AED", stroke: "#7C3AED" }}
                    activeDot={{ r: 6, fill: "#8B5CF6", stroke: "#fff", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {/* Revenue Chart */}
        {loading ? (
          <ChartCardSkeleton title="Monthly Revenue (Last 12 Months)" />
        ) : (
          <div className="bg-navy-light border border-gray-700 rounded-xl p-5">
            <p className="text-sm font-medium text-gray-400 mb-4">
              Monthly Revenue (Last 12 Months)
            </p>
            {revenueChart.every((p) => p.revenue === 0) ? (
              <div className="h-64 flex items-center justify-center">
                <p className="text-gray-500 text-sm">
                  No data yet
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={revenueChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
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
                    tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    content={<CustomTooltip isCurrency />}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="#7C3AED"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}
      </div>

      {/* Pipeline + Activity -- 2 column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Funnel */}
        {loading ? (
          <div className="bg-navy-light border border-gray-700 rounded-xl p-5">
            <Skeleton className="h-5 w-40 mb-6" />
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 mb-3" style={{ width: `${100 - i * 12}%` } as React.CSSProperties} />
            ))}
          </div>
        ) : (
          <div className="bg-navy-light border border-gray-700 rounded-xl p-5">
            <p className="text-sm font-medium text-gray-400 mb-5">
              Pipeline Funnel
            </p>
            {pipeline.every((s) => s.count === 0) ? (
              <div className="h-48 flex items-center justify-center">
                <p className="text-gray-500 text-sm">
                  No clients in the pipeline yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pipeline.map((stage, idx) => {
                  const maxWidth = 100 - idx * 12;
                  const barWidth = stage.percentage > 0 ? Math.max(stage.percentage, 8) : 0;
                  return (
                    <div key={stage.stage}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">{stage.stage}</span>
                        <span className="text-xs text-gray-500">
                          {stage.count} ({stage.percentage}%)
                        </span>
                      </div>
                      <div
                        className="h-7 rounded-md overflow-hidden bg-gray-800/50"
                        style={{ width: `${maxWidth}%` }}
                      >
                        <div
                          className="h-full rounded-md transition-all duration-500"
                          style={{
                            width: `${barWidth}%`,
                            background: `linear-gradient(90deg, #7C3AED 0%, #6D28D9 100%)`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Activity Feed */}
        {loading ? (
          <div className="bg-navy-light border border-gray-700 rounded-xl p-5">
            <Skeleton className="h-5 w-36 mb-4" />
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 mb-4">
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-3 w-full mb-2" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-navy-light border border-gray-700 rounded-xl p-5">
            <p className="text-sm font-medium text-gray-400 mb-4">
              Recent Activity
            </p>
            {activity.length === 0 ? (
              <div className="h-48 flex items-center justify-center">
                <p className="text-gray-500 text-sm">
                  No activity recorded yet
                </p>
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto pr-1 space-y-1 scrollbar-thin">
                {activity.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.02] transition-colors"
                  >
                    <span className="text-lg leading-none mt-0.5 shrink-0">
                      {getActionIcon(entry.action)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-300 leading-snug">
                        {entry.details || entry.action}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {relativeTime(entry.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Country Breakdown */}
      {loading ? (
        <div className="bg-navy-light border border-gray-700 rounded-xl p-5">
          <Skeleton className="h-5 w-44 mb-4" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 mb-3" style={{ width: `${90 - i * 15}%` } as React.CSSProperties} />
          ))}
        </div>
      ) : (
        <div className="bg-navy-light border border-gray-700 rounded-xl p-5">
          <p className="text-sm font-medium text-gray-400 mb-5">
            Clients by Country
          </p>
          {countryBreakdown.length === 0 ? (
            <div className="h-32 flex items-center justify-center">
              <p className="text-gray-500 text-sm">
                No country data available yet
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {countryBreakdown.map((entry) => {
                const pct = maxCountry > 0 ? (entry.count / maxCountry) * 100 : 0;
                return (
                  <div key={entry.country} className="flex items-center gap-3">
                    <span className="text-lg w-7 text-center shrink-0">
                      {getFlag(entry.country)}
                    </span>
                    <span className="text-sm text-gray-300 w-36 shrink-0 truncate">
                      {entry.country}
                    </span>
                    <div className="flex-1 h-6 bg-gray-800/50 rounded-md overflow-hidden">
                      <div
                        className="h-full rounded-md transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          minWidth: pct > 0 ? "24px" : "0px",
                          backgroundColor: "#7C3AED",
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-white w-10 text-right shrink-0">
                      {entry.count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
