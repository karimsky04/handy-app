"use client";

import { useExpert } from "@/lib/context/expert-auth-context";
import {
  useDashboardStats,
  useUrgentTasks,
  useMonthlyEarnings,
} from "@/lib/hooks/use-expert-data";

/* ═══════════════════════ HELPERS ═══════════════════════ */

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
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
    <div
      className={`bg-gray-700/50 rounded animate-pulse ${className}`}
    />
  );
}

/* ═══════════════════════ PAGE ═══════════════════════ */

export default function ExpertDashboard() {
  const { expert, loading: authLoading } = useExpert();
  const { stats, loading: statsLoading } = useDashboardStats();
  const { tasks: urgentTasks, loading: tasksLoading } = useUrgentTasks();
  const { earnings: monthlyEarnings, loading: earningsLoading } =
    useMonthlyEarnings();

  const maxEarning = monthlyEarnings.length
    ? Math.max(...monthlyEarnings.map((m) => m.amount), 1)
    : 1;

  const firstName = expert?.full_name?.split(" ")[0] ?? "";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {authLoading ? (
            <Skeleton className="h-9 w-72" />
          ) : (
            `${getGreeting()}, ${firstName}`
          )}
        </h1>
        <p className="text-gray-400 mt-1">
          {tasksLoading
            ? ""
            : urgentTasks.length > 0
              ? `You have ${urgentTasks.length} task${urgentTasks.length > 1 ? "s" : ""} requiring attention`
              : "You're all caught up"}
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {statsLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-navy-light border border-gray-700 rounded-xl px-4 py-3.5"
              >
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-5 w-14" />
              </div>
            ))
          : [
              {
                label: "Active Clients",
                value: String(stats?.activeClients ?? 0),
              },
              {
                label: "Jurisdictions Covered",
                value: String(stats?.jurisdictions ?? 0),
              },
              {
                label: "Rating",
                value: stats?.rating ? `${stats.rating} ★` : "—",
              },
              {
                label: "Earned This Quarter",
                value: formatCurrency(stats?.earnedThisQuarter ?? 0),
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-navy-light border border-gray-700 rounded-xl px-4 py-3.5"
              >
                <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                <p className="text-lg font-bold text-white">{stat.value}</p>
              </div>
            ))}
      </div>

      {/* Urgent Actions */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold mb-4">
          Requires Your Attention
        </h2>
        {tasksLoading ? (
          <div className="grid lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-navy-light border border-gray-700 rounded-xl p-5"
              >
                <Skeleton className="h-4 w-3/4 mb-3" />
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-2/3 mb-4" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </div>
        ) : urgentTasks.length === 0 ? (
          <div className="bg-navy-light border border-gray-700 rounded-xl p-8 text-center">
            <p className="text-gray-400">No urgent tasks right now</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-4">
            {urgentTasks.map((task) => (
              <div
                key={task.id}
                className={`bg-navy-light border-l-4 ${task.is_overdue ? "border-red-500/40" : "border-amber-500/40"} border border-gray-700 rounded-xl p-5 flex flex-col`}
              >
                <div className="flex items-start gap-2 mb-3">
                  <span className="text-lg flex-shrink-0">
                    {task.is_overdue ? "🔴" : "🟡"}
                  </span>
                  <h3 className="font-semibold text-sm leading-tight">
                    {task.client_name} — {task.title}
                    {task.is_overdue && " OVERDUE"}
                  </h3>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed mb-4 flex-1">
                  Due:{" "}
                  {task.due_date
                    ? new Date(task.due_date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "No date"}
                </p>
                <p className="text-xs text-gray-500">
                  Status: {task.status.replace("_", " ")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Client Matches — empty state */}
      <div className="mb-10">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">New Client Matches</h2>
          <p className="text-sm text-gray-500">
            Based on your specializations and availability
          </p>
        </div>
        <div className="bg-navy-light border border-gray-700 rounded-xl p-8 text-center">
          <p className="text-gray-400">No new client matches</p>
          <p className="text-xs text-gray-500 mt-1">
            We&apos;ll notify you when clients matching your expertise become
            available
          </p>
        </div>
      </div>

      {/* Referral Banner */}
      <div className="mb-10 bg-gold/5 border border-gold/20 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-200">
            Know a great accountant?
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Help us grow the expert network and earn referral bonuses.
          </p>
        </div>
        <a
          href="/experts/join"
          className="px-5 py-2.5 rounded-lg bg-gold/10 border border-gold/30 text-sm font-medium text-gold hover:bg-gold/20 transition-colors flex-shrink-0"
        >
          Refer an Expert &rarr;
        </a>
      </div>

      {/* Performance Snapshot */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Performance Snapshot</h2>
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-navy-light border border-gray-700 rounded-xl px-4 py-4">
              <p className="text-xs text-gray-500 mb-1">Client satisfaction</p>
              <p className="text-xl font-bold text-white">
                {stats?.rating ? `${stats.rating} / 5.0` : "—"}
              </p>
            </div>
            <div className="bg-navy-light border border-gray-700 rounded-xl px-4 py-4">
              <p className="text-xs text-gray-500 mb-1">Active Clients</p>
              <p className="text-xl font-bold text-white">
                {stats?.activeClients ?? 0}
              </p>
            </div>
            <div className="bg-navy-light border border-gray-700 rounded-xl px-4 py-4">
              <p className="text-xs text-gray-500 mb-1">Jurisdictions</p>
              <p className="text-xl font-bold text-white">
                {stats?.jurisdictions ?? 0}
              </p>
            </div>
            <div className="bg-navy-light border border-gray-700 rounded-xl px-4 py-4">
              <p className="text-xs text-gray-500 mb-1">Earned this quarter</p>
              <p className="text-xl font-bold text-gold">
                {formatCurrency(stats?.earnedThisQuarter ?? 0)}
              </p>
            </div>
          </div>

          {/* Earnings Chart */}
          <div className="bg-navy-light border border-gray-700 rounded-xl p-5">
            <p className="text-xs text-gray-500 mb-4">
              Monthly Earnings (Last 6 Months)
            </p>
            {earningsLoading ? (
              <div className="flex items-end gap-3 h-32">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <Skeleton className="w-full h-16" />
                  </div>
                ))}
              </div>
            ) : monthlyEarnings.length === 0 ? (
              <div className="h-32 flex items-center justify-center">
                <p className="text-gray-500 text-sm">No earnings data yet</p>
              </div>
            ) : (
              <div className="flex items-end gap-3 h-32">
                {monthlyEarnings.map((m) => (
                  <div
                    key={m.month}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <span className="text-[10px] text-gray-400 font-medium">
                      {m.amount > 0
                        ? `£${(m.amount / 1000).toFixed(1)}k`
                        : "£0"}
                    </span>
                    <div
                      className="w-full rounded-t-md bg-gold/30 hover:bg-gold/50 transition-colors"
                      style={{
                        height: `${(m.amount / maxEarning) * 100}%`,
                        minHeight: "8px",
                      }}
                    />
                    <span className="text-[10px] text-gray-500">
                      {m.month}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
