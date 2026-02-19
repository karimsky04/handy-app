"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { getFlag } from "@/lib/country-flags";
import type { Task } from "@/lib/types/expert";

interface TasksTabProps {
  clientId: string;
  clientCountries: string[];
  expertId: string;
}

interface NewTaskForm {
  title: string;
  description: string;
  due_date: string;
}

const EMPTY_FORM: NewTaskForm = { title: "", description: "", due_date: "" };

function formatDueDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function daysOverdue(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr + "T00:00:00");
  const diff = today.getTime() - due.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function isOverdue(task: Task): boolean {
  if (!task.due_date || task.status === "completed") return false;
  return daysOverdue(task.due_date) > 0;
}

function nextStatus(current: string): string {
  if (current === "pending") return "in_progress";
  if (current === "in_progress") return "completed";
  return "pending";
}

// ---------- Checkbox icon ----------

function StatusCheckbox({
  status,
  onClick,
}: {
  status: string;
  onClick: () => void;
}) {
  if (status === "completed") {
    return (
      <button
        onClick={onClick}
        className="flex-shrink-0 w-5 h-5 rounded-full bg-teal flex items-center justify-center transition-colors"
        aria-label="Mark pending"
      >
        <svg
          className="w-3 h-3 text-navy"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </button>
    );
  }

  if (status === "in_progress") {
    return (
      <button
        onClick={onClick}
        className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-blue-400 flex items-center justify-center transition-colors"
        aria-label="Mark completed"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
      </button>
    );
  }

  // pending
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-gray-500 hover:border-gray-400 transition-colors"
      aria-label="Mark in progress"
    />
  );
}

// ---------- Status badge ----------

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-gray-700/50 text-gray-400",
    in_progress: "bg-blue-500/10 text-blue-400 border border-blue-500/30",
    completed: "bg-teal/10 text-teal border border-teal/30",
  };

  return (
    <span
      className={`text-xs px-2 py-0.5 rounded ${styles[status] ?? styles.pending}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

// ---------- Main component ----------

export default function TasksTab({
  clientId,
  clientCountries,
  expertId,
}: TasksTabProps) {
  const supabase = useRef(createClient()).current;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Extra jurisdictions added via "Add Jurisdiction" that may have no tasks yet
  const [extraJurisdictions, setExtraJurisdictions] = useState<string[]>([]);

  // Which jurisdiction section has the add-task form open
  const [addingTaskFor, setAddingTaskFor] = useState<string | null>(null);
  const [newTaskForm, setNewTaskForm] = useState<NewTaskForm>(EMPTY_FORM);

  // Inline editing
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState("");
  const [editingDateId, setEditingDateId] = useState<string | null>(null);
  const [editingDateValue, setEditingDateValue] = useState("");

  // Add jurisdiction UI
  const [showAddJurisdiction, setShowAddJurisdiction] = useState(false);

  // ---------- Fetch ----------

  const fetchTasks = useCallback(async () => {
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: true });

    setTasks((data ?? []) as Task[]);
    setLoading(false);
  }, [supabase, clientId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // ---------- Helpers ----------

  async function logActivity(action: string, details: string) {
    await supabase.from("activity_log").insert({
      expert_id: expertId,
      client_id: clientId,
      action,
      details,
    });
  }

  // Derive jurisdiction groups
  const tasksByJurisdiction: Record<string, Task[]> = {};
  for (const t of tasks) {
    const key = t.jurisdiction ?? "General";
    if (!tasksByJurisdiction[key]) tasksByJurisdiction[key] = [];
    tasksByJurisdiction[key].push(t);
  }

  // Include extra jurisdictions (empty sections)
  for (const j of extraJurisdictions) {
    if (!tasksByJurisdiction[j]) tasksByJurisdiction[j] = [];
  }

  const jurisdictions = Object.keys(tasksByJurisdiction);

  // Sort tasks within each group: incomplete first, completed last
  function sortedTasks(list: Task[]): Task[] {
    return [...list].sort((a, b) => {
      if (a.status === "completed" && b.status !== "completed") return 1;
      if (a.status !== "completed" && b.status === "completed") return -1;
      return 0;
    });
  }

  // Countries available for "Add Jurisdiction"
  const usedJurisdictions = new Set(jurisdictions);
  const availableCountries = clientCountries.filter(
    (c) => !usedJurisdictions.has(c)
  );

  // ---------- Task actions ----------

  async function cycleStatus(task: Task) {
    const newStatus = nextStatus(task.status);
    const completedAt =
      newStatus === "completed" ? new Date().toISOString() : null;

    await supabase
      .from("tasks")
      .update({ status: newStatus, completed_at: completedAt })
      .eq("id", task.id);

    const label =
      newStatus === "completed"
        ? `Task '${task.title}' marked as completed`
        : newStatus === "in_progress"
          ? `Task '${task.title}' marked as in progress`
          : `Task '${task.title}' marked as pending`;

    await logActivity("task_status_changed", label);

    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? { ...t, status: newStatus, completed_at: completedAt }
          : t
      )
    );
  }

  async function deleteTask(task: Task) {
    await supabase.from("tasks").delete().eq("id", task.id);
    await logActivity("task_deleted", `Task '${task.title}' deleted`);
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
  }

  async function saveTitle(taskId: string) {
    const trimmed = editingTitleValue.trim();
    if (!trimmed) {
      setEditingTitleId(null);
      return;
    }

    await supabase.from("tasks").update({ title: trimmed }).eq("id", taskId);

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, title: trimmed } : t))
    );
    setEditingTitleId(null);
  }

  async function saveDueDate(taskId: string) {
    const value = editingDateValue || null;

    await supabase.from("tasks").update({ due_date: value }).eq("id", taskId);

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, due_date: value } : t))
    );
    setEditingDateId(null);
  }

  async function createTask(jurisdiction: string) {
    const trimmed = newTaskForm.title.trim();
    if (!trimmed) return;

    const payload = {
      client_id: clientId,
      expert_id: expertId,
      jurisdiction: jurisdiction === "General" ? null : jurisdiction,
      title: trimmed,
      description: newTaskForm.description.trim() || null,
      due_date: newTaskForm.due_date || null,
      status: "pending",
    };

    const { data } = await supabase
      .from("tasks")
      .insert(payload)
      .select()
      .single();

    if (data) {
      setTasks((prev) => [...prev, data as Task]);
    }

    await logActivity(
      "task_created",
      `Task '${trimmed}' created for ${jurisdiction}`
    );

    setNewTaskForm(EMPTY_FORM);
    setAddingTaskFor(null);
  }

  // ---------- Render ----------

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-navy-light border border-gray-700 rounded-xl p-5 animate-pulse"
          >
            <div className="h-5 w-40 bg-gray-700/50 rounded mb-4" />
            <div className="space-y-3">
              <div className="h-10 bg-gray-700/30 rounded-lg" />
              <div className="h-10 bg-gray-700/30 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (jurisdictions.length === 0 && !showAddJurisdiction) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 mb-4">No tasks yet for this client.</p>
        <button
          onClick={() => setShowAddJurisdiction(true)}
          className="px-4 py-2 rounded-lg bg-gold text-navy font-semibold text-sm hover:bg-gold/90 transition-colors"
        >
          + Add Jurisdiction
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {jurisdictions.map((jurisdiction) => {
        const groupTasks = sortedTasks(tasksByJurisdiction[jurisdiction]);
        const completedCount = groupTasks.filter(
          (t) => t.status === "completed"
        ).length;

        return (
          <div
            key={jurisdiction}
            className="bg-navy-light border border-gray-700 rounded-xl p-5 mb-4"
          >
            {/* Jurisdiction header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {jurisdiction === "General"
                    ? "\uD83D\uDCCB"
                    : getFlag(jurisdiction)}
                </span>
                <h3 className="text-base font-semibold text-white">
                  {jurisdiction}
                </h3>
                <span className="text-xs text-gray-500 ml-1">
                  {completedCount}/{groupTasks.length} tasks
                </span>
              </div>
            </div>

            {/* Task list */}
            {groupTasks.length === 0 ? (
              <p className="text-gray-500 text-sm py-2 px-1">
                No tasks in this jurisdiction yet.
              </p>
            ) : (
              <div className="space-y-2 mb-3">
                {groupTasks.map((task) => {
                  const overdue = isOverdue(task);
                  const overdueDays = task.due_date
                    ? daysOverdue(task.due_date)
                    : 0;

                  return (
                    <div
                      key={task.id}
                      className={`px-4 py-3 rounded-lg border border-gray-700/50 hover:border-gray-600 transition-colors ${
                        overdue ? "border-l-2 border-l-red-500" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <div className="pt-0.5">
                          <StatusCheckbox
                            status={task.status}
                            onClick={() => cycleStatus(task)}
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Title */}
                            {editingTitleId === task.id ? (
                              <input
                                autoFocus
                                className="bg-navy border border-gray-700 rounded-lg px-3 py-1 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold/50 flex-1"
                                value={editingTitleValue}
                                onChange={(e) =>
                                  setEditingTitleValue(e.target.value)
                                }
                                onBlur={() => saveTitle(task.id)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveTitle(task.id);
                                  if (e.key === "Escape")
                                    setEditingTitleId(null);
                                }}
                              />
                            ) : (
                              <span
                                className={`text-sm cursor-pointer hover:text-gold/80 transition-colors ${
                                  task.status === "completed"
                                    ? "text-gray-400 line-through"
                                    : "text-white"
                                }`}
                                onClick={() => {
                                  setEditingTitleId(task.id);
                                  setEditingTitleValue(task.title);
                                }}
                              >
                                {task.title}
                              </span>
                            )}

                            <StatusBadge status={task.status} />

                            {overdue && (
                              <span className="text-xs text-red-400 font-medium">
                                ({overdueDays} day{overdueDays !== 1 ? "s" : ""}{" "}
                                overdue)
                              </span>
                            )}
                          </div>

                          {/* Description */}
                          {task.description && (
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                              {task.description}
                            </p>
                          )}

                          {/* Due date */}
                          <div className="flex items-center gap-3 mt-1.5">
                            {editingDateId === task.id ? (
                              <input
                                type="date"
                                autoFocus
                                className="bg-navy border border-gray-700 rounded-lg px-3 py-1 text-xs text-white focus:outline-none focus:border-gold/50"
                                value={editingDateValue}
                                onChange={(e) =>
                                  setEditingDateValue(e.target.value)
                                }
                                onBlur={() => saveDueDate(task.id)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveDueDate(task.id);
                                  if (e.key === "Escape")
                                    setEditingDateId(null);
                                }}
                              />
                            ) : (
                              <span
                                className={`text-xs cursor-pointer hover:text-gold/80 transition-colors ${
                                  overdue ? "text-red-400" : "text-gray-500"
                                }`}
                                onClick={() => {
                                  setEditingDateId(task.id);
                                  setEditingDateValue(task.due_date ?? "");
                                }}
                              >
                                {task.due_date
                                  ? `Due: ${formatDueDate(task.due_date)}`
                                  : "Set due date"}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Delete */}
                        <button
                          onClick={() => deleteTask(task)}
                          className="flex-shrink-0 p-1 text-gray-600 hover:text-red-400 transition-colors"
                          aria-label={`Delete task ${task.title}`}
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
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add task form / button */}
            {addingTaskFor === jurisdiction ? (
              <div className="mt-3 space-y-3 border border-gray-700/50 rounded-lg p-4">
                <input
                  type="text"
                  placeholder="Task title *"
                  className="w-full bg-navy border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold/50"
                  value={newTaskForm.title}
                  onChange={(e) =>
                    setNewTaskForm((f) => ({ ...f, title: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newTaskForm.title.trim()) {
                      createTask(jurisdiction);
                    }
                    if (e.key === "Escape") {
                      setAddingTaskFor(null);
                      setNewTaskForm(EMPTY_FORM);
                    }
                  }}
                  autoFocus
                />
                <textarea
                  placeholder="Description (optional)"
                  rows={2}
                  className="w-full bg-navy border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold/50 resize-none"
                  value={newTaskForm.description}
                  onChange={(e) =>
                    setNewTaskForm((f) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                />
                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    className="bg-navy border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold/50"
                    value={newTaskForm.due_date}
                    onChange={(e) =>
                      setNewTaskForm((f) => ({
                        ...f,
                        due_date: e.target.value,
                      }))
                    }
                  />
                  <div className="flex-1" />
                  <button
                    onClick={() => {
                      setAddingTaskFor(null);
                      setNewTaskForm(EMPTY_FORM);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-gray-700 text-xs text-gray-300 hover:border-gold/40 hover:text-gold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => createTask(jurisdiction)}
                    disabled={!newTaskForm.title.trim()}
                    className="px-4 py-2 rounded-lg bg-gold text-navy font-semibold text-sm hover:bg-gold/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Save Task
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAddingTaskFor(jurisdiction);
                  setNewTaskForm(EMPTY_FORM);
                }}
                className="mt-2 px-3 py-1.5 rounded-lg border border-gray-700 text-xs text-gray-300 hover:border-gold/40 hover:text-gold transition-colors"
              >
                + Add Task
              </button>
            )}
          </div>
        );
      })}

      {/* Add Jurisdiction */}
      {showAddJurisdiction ? (
        <div className="bg-navy-light border border-gray-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">
            Add Jurisdiction
          </h3>
          {availableCountries.length === 0 ? (
            <p className="text-xs text-gray-500 mb-3">
              All client countries already have task sections.
            </p>
          ) : (
            <select
              className="w-full bg-navy border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold/50 mb-3"
              defaultValue=""
              onChange={(e) => {
                const val = e.target.value;
                if (val) {
                  setExtraJurisdictions((prev) => [...prev, val]);
                  setShowAddJurisdiction(false);
                }
              }}
            >
              <option value="" disabled>
                Select a country...
              </option>
              {availableCountries.map((c) => (
                <option key={c} value={c}>
                  {getFlag(c)} {c}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => setShowAddJurisdiction(false)}
            className="px-3 py-1.5 rounded-lg border border-gray-700 text-xs text-gray-300 hover:border-gold/40 hover:text-gold transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAddJurisdiction(true)}
          className="px-4 py-2 rounded-lg bg-gold text-navy font-semibold text-sm hover:bg-gold/90 transition-colors"
        >
          + Add Jurisdiction
        </button>
      )}
    </div>
  );
}
