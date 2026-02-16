"use client";

import { useState } from "react";

/* ═══════════════════════ TYPES ═══════════════════════ */

type EventColor = "teal" | "gold" | "blue" | "green" | "purple" | "gray";

interface CalendarEvent {
  day: number; // 0=Mon ... 4=Fri
  startHour: number;
  startMin: number;
  endHour: number;
  endMin: number;
  icon: string;
  title: string;
  color: EventColor;
  detail: string;
}

interface Deadline {
  dot: string;
  client: string;
  label: string;
  sublabel: string;
}

interface FilingRow {
  client: string;
  gb: string;
  fr: string;
  pt: string;
  us: string;
  es: string;
}

/* ═══════════════════════ DATA ═══════════════════════ */

const DAYS = ["Mon 16", "Tue 17", "Wed 18", "Thu 19", "Fri 20"];
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

const EVENTS: CalendarEvent[] = [
  // Monday
  { day: 0, startHour: 10, startMin: 0, endHour: 10, endMin: 30, icon: "📞", title: "Call with Michael Thompson", color: "teal", detail: "Review SA100 before submission" },
  { day: 0, startHour: 14, startMin: 0, endHour: 14, endMin: 30, icon: "👥", title: "Coordination: Pierre Dubois", color: "gold", detail: "Split-year employment allocation for Michael Thompson" },
  { day: 0, startHour: 16, startMin: 0, endHour: 16, endMin: 30, icon: "📞", title: "New client intro: James Wilson", color: "green", detail: "Initial consultation — crypto + stocks, UK only" },
  // Tuesday
  { day: 1, startHour: 9, startMin: 0, endHour: 11, endMin: 0, icon: "🔍", title: "Transaction review: Emma Chen", color: "blue", detail: "Review 255 flagged DeFi transactions" },
  { day: 1, startHour: 13, startMin: 0, endHour: 13, endMin: 30, icon: "📞", title: "Call with David Park", color: "teal", detail: "Final review before US coordinator handoff" },
  // Wednesday
  { day: 2, startHour: 10, startMin: 0, endHour: 12, endMin: 0, icon: "📝", title: "SA100 preparation: Michael Thompson", color: "blue", detail: "Compile final return with all income streams" },
  { day: 2, startHour: 15, startMin: 0, endHour: 15, endMin: 30, icon: "👥", title: "Coordination: Ana Santos", color: "gold", detail: "NHR implications for Michael's Estonian company" },
  // Thursday
  { day: 3, startHour: 9, startMin: 0, endHour: 9, endMin: 30, icon: "📞", title: "New client intro: Sofia Rodriguez", color: "green", detail: "Multi-jurisdiction UK+Spain, initial assessment" },
  { day: 3, startHour: 11, startMin: 0, endHour: 12, endMin: 0, icon: "🔍", title: "DeFi classification: Emma Chen", color: "blue", detail: "Uniswap LP positions — CGT analysis" },
  { day: 3, startHour: 14, startMin: 0, endHour: 14, endMin: 30, icon: "📞", title: "Follow-up: Priya Sharma", color: "teal", detail: "Post-filing review, answer questions" },
  // Friday
  { day: 4, startHour: 10, startMin: 0, endHour: 11, endMin: 0, icon: "📝", title: "Quarterly compliance review", color: "purple", detail: "Review all active clients' upcoming deadlines" },
  { day: 4, startHour: 13, startMin: 0, endHour: 14, endMin: 0, icon: "📝", title: "Admin: Update client templates", color: "gray", detail: "Update templates for 2024/25 changes" },
];

const DEADLINES: Deadline[] = [
  { dot: "🔴", client: "Michael Thompson — UK SA100", label: "OVERDUE (Jan 31)", sublabel: "Penalty accruing: £100 + £10/day after 3 months" },
  { dot: "🔴", client: "Emma Chen — UK SA100", label: "OVERDUE (Jan 31)", sublabel: "" },
  { dot: "🔴", client: "David Park — UK SA100", label: "OVERDUE (Jan 31)", sublabel: "" },
  { dot: "🟢", client: "Michael Thompson — France Cerfa", label: "88 days (Mid-May 2026)", sublabel: "" },
  { dot: "🟢", client: "Sofia Rodriguez — Spain Modelo 100", label: "58 days (Apr 15, 2026)", sublabel: "" },
  { dot: "🟢", client: "Michael Thompson — Portugal Modelo 3", label: "134 days (Jun 30, 2026)", sublabel: "" },
];

const FILING_ROWS: FilingRow[] = [
  { client: "Michael Thompson", gb: "🟡", fr: "⚪", pt: "🟡", us: "—", es: "—" },
  { client: "Emma Chen", gb: "🟡", fr: "—", pt: "—", us: "—", es: "—" },
  { client: "David Park", gb: "🔵", fr: "—", pt: "—", us: "🟡", es: "—" },
  { client: "Priya Sharma", gb: "✅", fr: "—", pt: "—", us: "—", es: "—" },
  { client: "Sofia Rodriguez", gb: "⚪", fr: "—", pt: "—", us: "—", es: "⚪" },
  { client: "Tom Williams", gb: "✅", fr: "—", pt: "—", us: "—", es: "—" },
  { client: "Lisa Morgan", gb: "✅", fr: "—", pt: "—", us: "—", es: "—" },
];

/* ═══════════════════════ HELPERS ═══════════════════════ */

const COLOR_MAP: Record<EventColor, { bg: string; border: string; text: string }> = {
  teal: { bg: "bg-teal/15", border: "border-teal/40", text: "text-teal" },
  gold: { bg: "bg-gold/15", border: "border-gold/40", text: "text-gold" },
  blue: { bg: "bg-blue-500/15", border: "border-blue-500/40", text: "text-blue-400" },
  green: { bg: "bg-emerald-500/15", border: "border-emerald-500/40", text: "text-emerald-400" },
  purple: { bg: "bg-purple-500/15", border: "border-purple-500/40", text: "text-purple-400" },
  gray: { bg: "bg-gray-700/30", border: "border-gray-600", text: "text-gray-400" },
};

function formatTime(h: number, m: number): string {
  const period = h >= 12 ? "pm" : "am";
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return m === 0 ? `${hour}${period}` : `${hour}:${String(m).padStart(2, "0")}${period}`;
}

/* ═══════════════════════ PAGE ═══════════════════════ */

export default function ExpertCalendarPage() {
  const [view, setView] = useState<"week" | "month" | "list">("week");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-gray-400 mt-1">
            Deadlines, client meetings, and task schedule
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 rounded-lg border border-gray-700 text-sm text-gray-300 hover:border-gray-600 transition-colors">
            &larr;
          </button>
          <button className="px-4 py-1.5 rounded-lg border border-gold/30 bg-gold/10 text-sm font-medium text-gold">
            Today
          </button>
          <button className="px-3 py-1.5 rounded-lg border border-gray-700 text-sm text-gray-300 hover:border-gray-600 transition-colors">
            &rarr;
          </button>
          <div className="h-5 w-px bg-gray-700 mx-1" />
          {(["week", "month", "list"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                view === v
                  ? "bg-gold/10 border border-gold/30 text-gold"
                  : "border border-gray-700 text-gray-400 hover:border-gray-600"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Week Label */}
      <p className="text-sm text-gray-500 mb-4">
        February 16 – 20, 2026
      </p>

      {/* Main Grid: Calendar + Sidebar */}
      <div className="grid lg:grid-cols-[1fr_280px] gap-5 mb-8">
        {/* Calendar Grid */}
        <div className="bg-navy-light border border-gray-700 rounded-xl overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-[60px_repeat(5,1fr)] border-b border-gray-700/50">
            <div className="px-2 py-3" />
            {DAYS.map((d) => (
              <div
                key={d}
                className="px-2 py-3 text-center text-xs font-medium text-gray-400 border-l border-gray-700/30"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Time grid */}
          <div className="relative">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="grid grid-cols-[60px_repeat(5,1fr)] h-16 border-b border-gray-700/20"
              >
                <div className="px-2 pt-1 text-[10px] text-gray-500 text-right pr-3">
                  {formatTime(hour, 0)}
                </div>
                {DAYS.map((_, di) => (
                  <div
                    key={di}
                    className="border-l border-gray-700/20 relative"
                  />
                ))}
              </div>
            ))}

            {/* Events overlay */}
            {EVENTS.map((ev, i) => {
              const startOffset =
                (ev.startHour - 8) * 64 + (ev.startMin / 60) * 64;
              const duration =
                (ev.endHour - ev.startHour) * 64 +
                ((ev.endMin - ev.startMin) / 60) * 64;
              const col = ev.day;
              const colors = COLOR_MAP[ev.color];

              // Calculate left position: skip 60px time col, each day col is (100% - 60px) / 5
              return (
                <div
                  key={i}
                  className={`absolute rounded-md px-2 py-1.5 border-l-[3px] ${colors.bg} ${colors.border} overflow-hidden cursor-pointer hover:brightness-110 transition-all group`}
                  style={{
                    top: `${startOffset}px`,
                    height: `${Math.max(duration, 28)}px`,
                    left: `calc(60px + ${col} * ((100% - 60px) / 5) + 2px)`,
                    width: `calc((100% - 60px) / 5 - 4px)`,
                  }}
                >
                  <p
                    className={`text-[10px] font-medium ${colors.text} leading-tight truncate`}
                  >
                    {ev.icon} {ev.title}
                  </p>
                  {duration >= 40 && (
                    <p className="text-[9px] text-gray-500 truncate mt-0.5">
                      {formatTime(ev.startHour, ev.startMin)} –{" "}
                      {formatTime(ev.endHour, ev.endMin)}
                    </p>
                  )}
                  {duration >= 56 && (
                    <p className="text-[9px] text-gray-500 truncate mt-0.5">
                      {ev.detail}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Deadline Sidebar */}
        <div className="bg-navy-light border border-gray-700 rounded-xl p-4 h-fit">
          <h3 className="font-semibold text-sm mb-4">Upcoming Deadlines</h3>
          <div className="space-y-3">
            {DEADLINES.map((d, i) => (
              <div key={i} className="pb-3 border-b border-gray-700/30 last:border-b-0 last:pb-0">
                <div className="flex items-start gap-2">
                  <span className="text-xs flex-shrink-0 mt-0.5">{d.dot}</span>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-200 font-medium leading-tight">
                      {d.client}
                    </p>
                    <p
                      className={`text-[11px] mt-0.5 ${
                        d.label.includes("OVERDUE")
                          ? "text-red-400 font-medium"
                          : "text-gray-500"
                      }`}
                    >
                      {d.label}
                    </p>
                    {d.sublabel && (
                      <p className="text-[10px] text-red-400/70 mt-0.5">
                        {d.sublabel}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Event Type Legend */}
      <div className="flex flex-wrap gap-4 mb-8 px-1">
        {[
          { icon: "📞", label: "Client calls", color: "text-teal" },
          { icon: "👥", label: "Expert coordination", color: "text-gold" },
          { icon: "🔍", label: "Review / Analysis", color: "text-blue-400" },
          { icon: "📝", label: "Preparation / Admin", color: "text-purple-400" },
          { icon: "🆕", label: "New client intros", color: "text-emerald-400" },
        ].map((item) => (
          <span key={item.label} className="flex items-center gap-1.5 text-xs text-gray-500">
            <span>{item.icon}</span>
            <span className={item.color}>{item.label}</span>
          </span>
        ))}
      </div>

      {/* Filing Status Overview */}
      <div className="bg-navy-light border border-gray-700 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-700/50">
          <h3 className="font-semibold text-sm">Filing Status Overview</h3>
        </div>

        {/* Desktop table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700/30">
                <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium">
                  Client
                </th>
                {["🇬🇧 UK", "🇫🇷 FR", "🇵🇹 PT", "🇺🇸 US", "🇪🇸 ES"].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-center px-3 py-3 text-xs text-gray-500 font-medium whitespace-nowrap"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {FILING_ROWS.map((row) => (
                <tr
                  key={row.client}
                  className="border-b border-gray-700/20 last:border-b-0 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-5 py-3 text-gray-200 font-medium whitespace-nowrap">
                    {row.client}
                  </td>
                  {[row.gb, row.fr, row.pt, row.us, row.es].map(
                    (val, i) => (
                      <td key={i} className="text-center px-3 py-3">
                        <span className="text-sm">{val}</span>
                      </td>
                    )
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="px-5 py-3 border-t border-gray-700/30 flex flex-wrap gap-4">
          {[
            { icon: "🔴", label: "Overdue" },
            { icon: "🟡", label: "In Progress" },
            { icon: "🔵", label: "Under Review" },
            { icon: "⚪", label: "Not Started" },
            { icon: "✅", label: "Complete" },
            { icon: "—", label: "Not Applicable" },
          ].map((item) => (
            <span
              key={item.label}
              className="flex items-center gap-1.5 text-xs text-gray-500"
            >
              <span>{item.icon}</span>
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
