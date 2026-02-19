"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useExpert } from "@/lib/context/expert-auth-context";
import { createClient } from "@/lib/supabase";

/* ═══════════════════════ TYPES ═══════════════════════ */

interface Task {
  id: string;
  client_id: string;
  expert_id: string;
  jurisdiction: string | null;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  client?: { full_name: string };
}

type EventColor = "teal" | "gold" | "blue" | "green" | "purple" | "gray";

interface CalendarEvent {
  id: string;
  day: number; // 0=Mon ... 4=Fri
  startHour: number;
  startMin: number;
  endHour: number;
  endMin: number;
  title: string;
  color: EventColor;
  detail: string;
  status: string;
}

/* ═══════════════════════ HELPERS ═══════════════════════ */

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

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

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // adjust when day is Sunday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekLabel(monday: Date): string {
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  if (monday.getMonth() === friday.getMonth()) {
    return `${monthNames[monday.getMonth()]} ${monday.getDate()} \u2013 ${friday.getDate()}, ${monday.getFullYear()}`;
  }
  return `${monthNames[monday.getMonth()]} ${monday.getDate()} \u2013 ${monthNames[friday.getMonth()]} ${friday.getDate()}, ${friday.getFullYear()}`;
}

function getDayLabels(monday: Date): string[] {
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  return dayNames.map((name, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return `${name} ${d.getDate()}`;
  });
}

function taskColor(status: string): EventColor {
  switch (status) {
    case "completed":
      return "green";
    case "in_progress":
      return "blue";
    case "pending":
      return "gold";
    default:
      return "gray";
  }
}

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-gray-700/50 rounded animate-pulse ${className}`} />
  );
}

/* ═══════════════════════ PAGE ═══════════════════════ */

export default function ExpertCalendarPage() {
  const { expert, loading: authLoading } = useExpert();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"week" | "month" | "list">("week");
  const [weekOffset, setWeekOffset] = useState(0);

  const monday = useMemo(() => {
    const base = getMonday(new Date());
    base.setDate(base.getDate() + weekOffset * 7);
    return base;
  }, [weekOffset]);

  const friday = useMemo(() => {
    const f = new Date(monday);
    f.setDate(monday.getDate() + 4);
    f.setHours(23, 59, 59, 999);
    return f;
  }, [monday]);

  const dayLabels = useMemo(() => getDayLabels(monday), [monday]);
  const weekLabel = useMemo(() => formatWeekLabel(monday), [monday]);

  const fetchTasks = useCallback(async () => {
    if (!expert) return;

    setLoading(true);
    const supabase = createClient();

    try {
      const { data } = await supabase
        .from("tasks")
        .select("*, client:clients(full_name)")
        .eq("expert_id", expert.id)
        .not("due_date", "is", null)
        .order("due_date", { ascending: true });

      setTasks((data as Task[]) ?? []);
    } catch {
      // Query failed — show empty rather than infinite skeleton
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [expert]);

  useEffect(() => {
    if (authLoading) return;
    if (!expert) {
      setLoading(false);
      return;
    }

    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expert, authLoading]);

  // Tasks for the current week view
  const weekTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (!t.due_date) return false;
      const d = new Date(t.due_date);
      return d >= monday && d <= friday;
    });
  }, [tasks, monday, friday]);

  // Map tasks to calendar events
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return weekTasks.map((t) => {
      const d = new Date(t.due_date!);
      const dayOfWeek = d.getDay();
      // Convert Sunday(0)...Saturday(6) to Mon(0)...Fri(4)
      const day = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      let startHour = d.getHours();
      let startMin = d.getMinutes();

      // If no specific time (midnight / 00:00), default to 9am
      if (startHour === 0 && startMin === 0) {
        startHour = 9;
        startMin = 0;
      }

      // Clamp to visible range
      if (startHour < 8) startHour = 8;
      if (startHour > 17) startHour = 17;

      const endHour = startHour;
      const endMin = startMin + 30;

      const clientName =
        (t.client as unknown as { full_name: string })?.full_name ?? "Unknown";

      return {
        id: t.id,
        day: Math.min(day, 4), // clamp to weekdays
        startHour,
        startMin,
        endHour: endMin >= 60 ? endHour + 1 : endHour,
        endMin: endMin >= 60 ? endMin - 60 : endMin,
        title: `${clientName} — ${t.title}`,
        color: taskColor(t.status),
        detail: t.description ?? t.jurisdiction ?? "",
        status: t.status,
      };
    });
  }, [weekTasks]);

  // Upcoming deadlines — all non-completed tasks with due_date, sorted by due_date
  const deadlines = useMemo(() => {
    const now = new Date();
    return tasks
      .filter((t) => t.due_date && t.status !== "completed")
      .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
      .slice(0, 10)
      .map((t) => {
        const dueDate = new Date(t.due_date!);
        const isOverdue = dueDate < now;
        const diffDays = Math.ceil(
          (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        const clientName =
          (t.client as unknown as { full_name: string })?.full_name ?? "Unknown";

        let label: string;
        if (isOverdue) {
          label = `OVERDUE (${dueDate.toLocaleDateString("en-GB", { month: "short", day: "numeric" })})`;
        } else if (diffDays === 0) {
          label = "Due today";
        } else if (diffDays === 1) {
          label = "Due tomorrow";
        } else {
          label = `${diffDays} days (${dueDate.toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" })})`;
        }

        return {
          id: t.id,
          client: `${clientName} — ${t.title}`,
          label,
          isOverdue,
          jurisdiction: t.jurisdiction,
        };
      });
  }, [tasks]);

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
          <button
            onClick={() => setWeekOffset((o) => o - 1)}
            className="px-3 py-1.5 rounded-lg border border-gray-700 text-sm text-gray-300 hover:border-gray-600 transition-colors"
          >
            &larr;
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className="px-4 py-1.5 rounded-lg border border-gold/30 bg-gold/10 text-sm font-medium text-gold"
          >
            Today
          </button>
          <button
            onClick={() => setWeekOffset((o) => o + 1)}
            className="px-3 py-1.5 rounded-lg border border-gray-700 text-sm text-gray-300 hover:border-gray-600 transition-colors"
          >
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
      <p className="text-sm text-gray-500 mb-4">{weekLabel}</p>

      {/* Main Grid: Calendar + Sidebar */}
      <div className="grid lg:grid-cols-[1fr_280px] gap-5 mb-8">
        {/* Calendar Grid */}
        {loading ? (
          <div className="bg-navy-light border border-gray-700 rounded-xl p-5">
            <div className="grid grid-cols-5 gap-3 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[60px_repeat(5,1fr)] gap-2 mb-3">
                <Skeleton className="h-4 w-10" />
                {Array.from({ length: 5 }).map((_, j) => (
                  <Skeleton key={j} className="h-12 w-full" />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-navy-light border border-gray-700 rounded-xl overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-[60px_repeat(5,1fr)] border-b border-gray-700/50">
              <div className="px-2 py-3" />
              {dayLabels.map((d) => (
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
                  {dayLabels.map((_, di) => (
                    <div
                      key={di}
                      className="border-l border-gray-700/20 relative"
                    />
                  ))}
                </div>
              ))}

              {/* Events overlay */}
              {calendarEvents.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="text-sm text-gray-600">No tasks scheduled this week</p>
                </div>
              ) : (
                calendarEvents.map((ev) => {
                  const startOffset =
                    (ev.startHour - 8) * 64 + (ev.startMin / 60) * 64;
                  const duration =
                    (ev.endHour - ev.startHour) * 64 +
                    ((ev.endMin - ev.startMin) / 60) * 64;
                  const col = ev.day;
                  const colors = COLOR_MAP[ev.color];

                  return (
                    <div
                      key={ev.id}
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
                        {ev.title}
                      </p>
                      {duration >= 40 && (
                        <p className="text-[9px] text-gray-500 truncate mt-0.5">
                          {formatTime(ev.startHour, ev.startMin)} &ndash;{" "}
                          {formatTime(ev.endHour, ev.endMin)}
                        </p>
                      )}
                      {duration >= 56 && ev.detail && (
                        <p className="text-[9px] text-gray-500 truncate mt-0.5">
                          {ev.detail}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Deadline Sidebar */}
        <div className="bg-navy-light border border-gray-700 rounded-xl p-4 h-fit">
          <h3 className="font-semibold text-sm mb-4">Upcoming Deadlines</h3>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="pb-3 border-b border-gray-700/30 last:border-b-0 last:pb-0">
                  <Skeleton className="h-3 w-full mb-2" />
                  <Skeleton className="h-2.5 w-2/3" />
                </div>
              ))}
            </div>
          ) : deadlines.length === 0 ? (
            <p className="text-xs text-gray-500 py-4 text-center">
              No upcoming deadlines
            </p>
          ) : (
            <div className="space-y-3">
              {deadlines.map((d) => (
                <div
                  key={d.id}
                  className="pb-3 border-b border-gray-700/30 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 mt-1">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          d.isOverdue ? "bg-red-500" : "bg-emerald-500"
                        }`}
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-200 font-medium leading-tight">
                        {d.client}
                      </p>
                      {d.jurisdiction && (
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          {d.jurisdiction}
                        </p>
                      )}
                      <p
                        className={`text-[11px] mt-0.5 ${
                          d.isOverdue
                            ? "text-red-400 font-medium"
                            : "text-gray-500"
                        }`}
                      >
                        {d.label}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Event Type Legend */}
      <div className="flex flex-wrap gap-4 px-1">
        {[
          { color: "bg-gold", label: "Pending" },
          { color: "bg-blue-500", label: "In Progress" },
          { color: "bg-emerald-500", label: "Completed" },
          { color: "bg-gray-500", label: "Other" },
        ].map((item) => (
          <span
            key={item.label}
            className="flex items-center gap-1.5 text-xs text-gray-500"
          >
            <span className={`inline-block w-2.5 h-2.5 rounded-sm ${item.color}`} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
