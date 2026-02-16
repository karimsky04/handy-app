"use client";

import Link from "next/link";

/* ═══════════════════ MOCK DATA ═══════════════════ */

interface Task {
  label: string;
  status: "complete" | "in_progress" | "pending";
  detail: string;
}

interface JurisdictionCard {
  code: string;
  flag: string;
  country: string;
  statusLabel: string;
  statusColor: "amber" | "red" | "blue";
  deadline: string;
  countdownText: string;
  countdownColor: string;
  progress: number;
  tasks: Task[];
  expert: string;
  expertTitle: string;
  ctaLabel: string;
}

const JURISDICTIONS: JurisdictionCard[] = [
  {
    code: "GB",
    flag: "🇬🇧",
    country: "United Kingdom",
    statusLabel: "In Progress",
    statusColor: "amber",
    deadline: "31 January 2026",
    countdownText: "OVERDUE — 16 days",
    countdownColor: "text-red-400",
    progress: 60,
    tasks: [
      { label: "Crypto report", status: "complete", detail: "Complete" },
      {
        label: "SA100 filing",
        status: "in_progress",
        detail: "With accountant",
      },
      {
        label: "SA108 attachment",
        status: "in_progress",
        detail: "Pending review",
      },
    ],
    expert: "Sarah Mitchell",
    expertTitle: "ACCA — London",
    ctaLabel: "View Details",
  },
  {
    code: "FR",
    flag: "🇫🇷",
    country: "France",
    statusLabel: "Not Started",
    statusColor: "red",
    deadline: "Mid-May 2026",
    countdownText: "88 days remaining",
    countdownColor: "text-amber-400",
    progress: 10,
    tasks: [
      {
        label: "Cerfa 2086 preparation",
        status: "pending",
        detail: "Not started",
      },
      {
        label: "PFU calculation",
        status: "pending",
        detail: "Awaiting data",
      },
      {
        label: "Treaty relief (UK-FR)",
        status: "pending",
        detail: "Pending",
      },
    ],
    expert: "Pierre Dubois",
    expertTitle: "Expert-Comptable — Paris",
    ctaLabel: "Get Started",
  },
  {
    code: "PT",
    flag: "🇵🇹",
    country: "Portugal",
    statusLabel: "Under Review",
    statusColor: "blue",
    deadline: "30 June 2026",
    countdownText: "134 days remaining",
    countdownColor: "text-teal",
    progress: 35,
    tasks: [
      {
        label: "NHR status verification",
        status: "complete",
        detail: "Confirmed",
      },
      {
        label: "Modelo 3 preparation",
        status: "in_progress",
        detail: "In progress",
      },
      {
        label: "Crypto classification review",
        status: "in_progress",
        detail: "With expert",
      },
    ],
    expert: "Ana Santos",
    expertTitle: "TOC — Lisbon",
    ctaLabel: "View Details",
  },
];

const ACTIVITY = [
  {
    time: "Today",
    text: "Sarah Mitchell uploaded revised SA108 for your review",
    urgent: true,
  },
  {
    time: "Yesterday",
    text: "Crypto reconciliation report updated — 24,847 of 25,102 transactions matched",
    urgent: false,
  },
  {
    time: "3 days ago",
    text: "Pierre Dubois accepted your case — France filing can begin",
    urgent: false,
  },
  {
    time: "1 week ago",
    text: "Your compliance map was generated",
    urgent: false,
  },
];

const DEADLINES = [
  {
    label: "UK Self Assessment",
    detail: "OVERDUE",
    color: "text-red-400",
    dotColor: "bg-red-400",
    pulse: true,
  },
  {
    label: "France income declaration",
    detail: "88 days",
    color: "text-amber-400",
    dotColor: "bg-amber-400",
    pulse: false,
  },
  {
    label: "Portugal Modelo 3",
    detail: "134 days",
    color: "text-teal",
    dotColor: "bg-teal",
    pulse: false,
  },
];

/* ═══════════════════ HELPERS ═══════════════════ */

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  amber: { bg: "bg-amber-500/10 border-amber-500/30", text: "text-amber-400" },
  red: { bg: "bg-red-500/10 border-red-500/30", text: "text-red-400" },
  blue: { bg: "bg-blue-500/10 border-blue-500/30", text: "text-blue-400" },
};

function TaskIcon({ status }: { status: Task["status"] }) {
  if (status === "complete") return <span className="text-teal">&#10003;</span>;
  if (status === "in_progress")
    return <span className="text-amber-400">&#8635;</span>;
  return <span className="text-gray-500">&#9203;</span>;
}

/* ═══════════════════ PAGE ═══════════════════ */

export default function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, Michael
          </h1>
          <p className="text-gray-400 mt-1">
            2 of 3 jurisdictions in progress
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />
          All experts online
        </div>
      </div>

      {/* Jurisdiction Cards */}
      <div className="grid lg:grid-cols-3 gap-5 mb-8">
        {JURISDICTIONS.map((j) => {
          const badge = STATUS_BADGE[j.statusColor];
          return (
            <div
              key={j.code}
              className="bg-navy-light border border-gray-700 rounded-xl p-5 hover:border-gray-600 transition-colors group"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{j.flag}</span>
                  <div>
                    <h3 className="font-semibold text-lg leading-tight">
                      {j.country}
                    </h3>
                    <p className="text-sm text-gray-400">{j.deadline}</p>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border ${badge.bg} ${badge.text}`}
                >
                  {j.statusLabel}
                </span>
              </div>

              {/* Countdown */}
              <p className={`text-sm font-semibold mb-3 ${j.countdownColor}`}>
                {j.countdownText}
              </p>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                  <span>Progress</span>
                  <span>{j.progress}%</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal rounded-full transition-all"
                    style={{ width: `${j.progress}%` }}
                  />
                </div>
              </div>

              {/* Tasks */}
              <div className="space-y-2 mb-5">
                {j.tasks.map((t, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 text-sm"
                  >
                    <TaskIcon status={t.status} />
                    <span className="text-gray-300">{t.label}:</span>
                    <span
                      className={
                        t.status === "complete"
                          ? "text-teal"
                          : t.status === "in_progress"
                            ? "text-amber-400"
                            : "text-gray-500"
                      }
                    >
                      {t.detail}
                    </span>
                  </div>
                ))}
              </div>

              {/* Expert */}
              <div className="flex items-center gap-2.5 text-sm text-gray-400 mb-5 pb-5 border-b border-gray-700/50">
                <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-300">
                  {j.expert
                    .split(" ")
                    .map((w) => w[0])
                    .join("")}
                </div>
                <span>
                  {j.expert},{" "}
                  <span className="text-gray-500">{j.expertTitle}</span>
                </span>
              </div>

              {/* CTA */}
              <button className="w-full py-2.5 rounded-lg border border-gray-700 text-sm font-medium text-gray-300 hover:border-teal/40 hover:text-teal transition-colors group-hover:border-gray-600">
                {j.ctaLabel}
              </button>
            </div>
          );
        })}
      </div>

      {/* Bottom Section: Activity + Sidebar */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Activity Feed — spans 2 cols */}
        <div className="lg:col-span-2 space-y-5">
          {/* Timeline */}
          <div className="bg-navy-light border border-gray-700 rounded-xl p-5">
            <h3 className="font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {ACTIVITY.map((a, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${a.urgent ? "bg-teal" : "bg-gray-600"}`}
                    />
                    {i < ACTIVITY.length - 1 && (
                      <div className="w-px flex-1 bg-gray-800 mt-1" />
                    )}
                  </div>
                  <div className="pb-4">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">
                      {a.time}
                    </span>
                    <p className="text-sm text-gray-300 mt-0.5">{a.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Treaty Alert */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <span className="text-lg flex-shrink-0">&#128276;</span>
              <div>
                <h4 className="font-semibold text-amber-300 text-sm mb-1">
                  Double Taxation Alert
                </h4>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Your UK and France obligations overlap for the 2023/24 tax
                  year. Sarah and Pierre are coordinating to apply UK-France
                  treaty relief. No action needed from you.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar — Deadlines */}
        <div className="bg-navy-light border border-gray-700 rounded-xl p-5 h-fit">
          <h3 className="font-semibold mb-4">Upcoming Deadlines</h3>
          <div className="space-y-4">
            {DEADLINES.map((d, i) => (
              <div
                key={i}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5">
                    {d.pulse && (
                      <span
                        className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${d.dotColor}`}
                      />
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-2.5 w-2.5 ${d.dotColor}`}
                    />
                  </span>
                  <span className="text-sm text-gray-300">{d.label}</span>
                </div>
                <span className={`text-sm font-semibold ${d.color}`}>
                  {d.detail}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-gray-700/50">
            <Link
              href="/dashboard/experts"
              className="text-sm text-teal hover:text-teal-light transition-colors font-medium"
            >
              Contact your experts &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
