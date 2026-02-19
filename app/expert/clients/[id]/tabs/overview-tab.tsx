"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { getFlag } from "@/lib/country-flags";
import type { Client } from "@/lib/types/expert";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ClientExpertWithName {
  id: string;
  client_id: string;
  expert_id: string;
  jurisdiction: string;
  status: string;
  expert_name: string;
  is_you: boolean;
}

interface OverviewTabProps {
  client: Client;
  experts: ClientExpertWithName[];
  onClientUpdate: (updates: Partial<Client>) => void;
  onRefresh: () => void;
  expertId: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PIPELINE_STAGES = [
  "Quote Request",
  "Data Collection",
  "Assessment",
  "Processing",
  "Delivery",
  "Complete",
] as const;

const STATUS_OPTIONS = [
  "Active",
  "In Progress",
  "Filing",
  "Complete",
  "On Hold",
] as const;

const COMPLEXITY_COLORS: Record<string, string> = {
  Simple: "bg-teal/10 text-teal border-teal/30",
  Moderate: "bg-gold/10 text-gold border-gold/30",
  Complex: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  "Multi-Jurisdiction Complex": "bg-red-500/10 text-red-400 border-red-500/30",
};

// ---------------------------------------------------------------------------
// Inline Editable Field
// ---------------------------------------------------------------------------

function InlineEditField({
  label,
  value,
  fieldKey,
  onSave,
  type = "text",
}: {
  label: string;
  value: string;
  fieldKey: string;
  onSave: (key: string, value: string) => void;
  type?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = useCallback(() => {
    setEditing(false);
    if (draft.trim() !== value) {
      onSave(fieldKey, draft.trim());
      setSaved(true);
      const timer = setTimeout(() => setSaved(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [draft, value, fieldKey, onSave]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") {
      setDraft(value);
      setEditing(false);
    }
  };

  return (
    <div className="flex items-center gap-2 group">
      <span className="text-xs text-gray-500 w-14 shrink-0">{label}</span>
      {editing ? (
        <input
          ref={inputRef}
          type={type}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-navy border border-gold/40 rounded-md px-2 py-1 text-sm text-white outline-none focus:border-gold transition-colors"
        />
      ) : (
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-sm text-gray-300 truncate">
            {value || "---"}
          </span>
          <button
            onClick={() => setEditing(true)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-gold shrink-0"
            aria-label={`Edit ${label}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </button>
          {saved && (
            <span className="text-xs text-teal animate-pulse">Saved!</span>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delete Confirmation Modal
// ---------------------------------------------------------------------------

function DeleteModal({
  clientName,
  onConfirm,
  onCancel,
}: {
  clientName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [typed, setTyped] = useState("");
  const matches = typed === clientName;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-navy-light border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <h3 className="text-lg font-semibold text-white mb-2">
          Delete Client
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          This action is irreversible. To confirm, type the client&apos;s full
          name below:
        </p>
        <p className="text-sm font-mono text-red-400 mb-3 bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2">
          {clientName}
        </p>
        <input
          type="text"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="Type client name to confirm..."
          className="w-full bg-navy border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-red-500/50 transition-colors mb-4"
        />
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-700 text-sm text-gray-300 hover:border-gold/40 hover:text-gold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!matches}
            className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm hover:bg-red-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Delete Permanently
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function OverviewTab({
  client,
  experts,
  onClientUpdate,
  onRefresh,
  expertId,
}: OverviewTabProps) {
  const router = useRouter();
  const supabase = createClient();

  // Local state
  const [notesQuick, setNotesQuick] = useState(client.notes_quick ?? "");
  const [notesSaved, setNotesSaved] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Add Jurisdiction state
  const [showAddJurisdiction, setShowAddJurisdiction] = useState(false);
  const [newJurisdiction, setNewJurisdiction] = useState("");
  const [savingJurisdiction, setSavingJurisdiction] = useState(false);

  // Sync quick notes when client prop changes
  useEffect(() => {
    setNotesQuick(client.notes_quick ?? "");
  }, [client.notes_quick]);

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------

  const handleFieldSave = useCallback(
    async (key: string, value: string) => {
      const updates: Partial<Client> = { [key]: value };
      await supabase.from("clients").update(updates).eq("id", client.id);
      onClientUpdate(updates);
    },
    [supabase, client.id, onClientUpdate]
  );

  const handlePipelineClick = useCallback(
    async (stage: string) => {
      await supabase
        .from("clients")
        .update({ pipeline_stage: stage })
        .eq("id", client.id);
      onClientUpdate({ pipeline_stage: stage });
    },
    [supabase, client.id, onClientUpdate]
  );

  const handleStatusChange = useCallback(
    async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newStatus = e.target.value;
      await supabase
        .from("clients")
        .update({ overall_status: newStatus })
        .eq("id", client.id);
      onClientUpdate({ overall_status: newStatus });
    },
    [supabase, client.id, onClientUpdate]
  );

  const handleNotesSave = useCallback(async () => {
    if (notesQuick === (client.notes_quick ?? "")) return;
    await supabase
      .from("clients")
      .update({ notes_quick: notesQuick })
      .eq("id", client.id);
    onClientUpdate({ notes_quick: notesQuick });
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 1500);
  }, [supabase, client.id, notesQuick, client.notes_quick, onClientUpdate]);

  const handleAddJurisdiction = useCallback(async () => {
    if (!newJurisdiction) return;
    setSavingJurisdiction(true);
    await supabase.from("client_experts").insert({
      client_id: client.id,
      expert_id: expertId,
      jurisdiction: newJurisdiction,
      status: "active",
    });
    setSavingJurisdiction(false);
    setNewJurisdiction("");
    setShowAddJurisdiction(false);
    onRefresh();
  }, [supabase, client.id, expertId, newJurisdiction, onRefresh]);

  const handleDeleteClient = useCallback(async () => {
    setDeleting(true);
    await supabase.from("clients").delete().eq("id", client.id);
    router.push("/expert/clients");
  }, [supabase, client.id, router]);

  // -----------------------------------------------------------------------
  // Pipeline helpers
  // -----------------------------------------------------------------------

  const currentStageIndex = PIPELINE_STAGES.indexOf(
    client.pipeline_stage as (typeof PIPELINE_STAGES)[number]
  );

  // Available jurisdictions for Add Jurisdiction (those not yet assigned)
  const assignedJurisdictions = new Set(experts.map((e) => e.jurisdiction));
  const availableJurisdictions = (client.countries ?? []).filter(
    (c) => !assignedJurisdictions.has(c)
  );

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="space-y-4">
      {/* ----------------------------------------------------------------- */}
      {/* Client Details                                                     */}
      {/* ----------------------------------------------------------------- */}
      <div className="bg-navy-light border border-gray-700 rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">
            Client Details
          </h2>
          {/* Complexity badge */}
          <span
            className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
              COMPLEXITY_COLORS[client.complexity] ??
              "bg-gray-700/50 text-gray-400 border-gray-600"
            }`}
          >
            {client.complexity}
          </span>
        </div>

        <div className="space-y-3">
          <InlineEditField
            label="Name"
            value={client.full_name}
            fieldKey="full_name"
            onSave={handleFieldSave}
          />
          <InlineEditField
            label="Email"
            value={client.email}
            fieldKey="email"
            onSave={handleFieldSave}
            type="email"
          />
          <InlineEditField
            label="Phone"
            value={client.phone ?? ""}
            fieldKey="phone"
            onSave={handleFieldSave}
            type="tel"
          />
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Pipeline Stage                                                     */}
      {/* ----------------------------------------------------------------- */}
      <div className="bg-navy-light border border-gray-700 rounded-xl p-5 mb-4">
        <h2 className="text-base font-semibold text-white mb-4">
          Pipeline Stage
        </h2>
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {PIPELINE_STAGES.map((stage, idx) => {
            const isCurrent = idx === currentStageIndex;
            const isCompleted = currentStageIndex >= 0 && idx < currentStageIndex;
            const isFuture = currentStageIndex < 0 || idx > currentStageIndex;

            let stageClasses =
              "px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all whitespace-nowrap border ";
            if (isCurrent) {
              stageClasses +=
                "bg-gold/15 border-gold/40 text-gold shadow-sm shadow-gold/10";
            } else if (isCompleted) {
              stageClasses +=
                "bg-teal/10 border-teal/30 text-teal";
            } else if (isFuture) {
              stageClasses +=
                "bg-gray-800/50 border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-400";
            }

            return (
              <div key={stage} className="flex items-center">
                {idx > 0 && (
                  <div
                    className={`w-4 h-px mx-0.5 ${
                      isCompleted || isCurrent ? "bg-teal/40" : "bg-gray-700"
                    }`}
                  />
                )}
                <button
                  onClick={() => handlePipelineClick(stage)}
                  className={stageClasses}
                >
                  {stage}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Overall Status                                                     */}
      {/* ----------------------------------------------------------------- */}
      <div className="bg-navy-light border border-gray-700 rounded-xl p-5 mb-4">
        <h2 className="text-base font-semibold text-white mb-3">
          Overall Status
        </h2>
        <select
          value={client.overall_status}
          onChange={handleStatusChange}
          className="bg-navy-light border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-gold/50 transition-colors cursor-pointer"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Countries                                                          */}
      {/* ----------------------------------------------------------------- */}
      <div className="bg-navy-light border border-gray-700 rounded-xl p-5 mb-4">
        <h2 className="text-base font-semibold text-white mb-3">Countries</h2>
        {client.countries && client.countries.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {client.countries.map((country) => (
              <div
                key={country}
                className="bg-navy border border-gray-700 rounded-lg p-3 flex items-center gap-2"
              >
                <span className="text-lg">{getFlag(country)}</span>
                <span className="text-sm text-gray-300">{country}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No countries specified</p>
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Asset Types & Tax Years                                            */}
      {/* ----------------------------------------------------------------- */}
      <div className="bg-navy-light border border-gray-700 rounded-xl p-5 mb-4">
        <div className="grid sm:grid-cols-2 gap-6">
          {/* Asset Types */}
          <div>
            <h2 className="text-base font-semibold text-white mb-3">
              Asset Types
            </h2>
            {client.asset_types && client.asset_types.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {client.asset_types.map((asset) => (
                  <span
                    key={asset}
                    className="bg-gold/10 text-gold border border-gold/30 text-xs px-2 py-1 rounded-full"
                  >
                    {asset}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No asset types specified</p>
            )}
          </div>

          {/* Tax Years */}
          <div>
            <h2 className="text-base font-semibold text-white mb-3">
              Tax Years
            </h2>
            {client.tax_years && client.tax_years.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {client.tax_years.map((year) => (
                  <span
                    key={year}
                    className="bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs px-2 py-1 rounded-full"
                  >
                    {year}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No tax years specified</p>
            )}
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Assigned Experts                                                   */}
      {/* ----------------------------------------------------------------- */}
      <div className="bg-navy-light border border-gray-700 rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-white">
            Assigned Experts
          </h2>
          {availableJurisdictions.length > 0 && (
            <button
              onClick={() => setShowAddJurisdiction(!showAddJurisdiction)}
              className="px-4 py-2 rounded-lg border border-gray-700 text-sm text-gray-300 hover:border-gold/40 hover:text-gold transition-colors"
            >
              {showAddJurisdiction ? "Cancel" : "+ Add Jurisdiction"}
            </button>
          )}
        </div>

        {/* Expert pills */}
        {experts.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-3">
            {experts.map((exp) => (
              <span
                key={exp.id}
                className={`text-sm px-3 py-1.5 rounded-lg border flex items-center gap-1.5 ${
                  exp.is_you
                    ? "bg-gold/10 border-gold/30 text-gold"
                    : "bg-navy border-gray-700 text-gray-300"
                }`}
              >
                <span>{getFlag(exp.jurisdiction)}</span>
                <span>{exp.jurisdiction}</span>
                <span className="text-gray-500 mx-0.5">--</span>
                <span>{exp.is_you ? "You" : exp.expert_name}</span>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-3">No experts assigned yet</p>
        )}

        {/* Add Jurisdiction form */}
        {showAddJurisdiction && (
          <div className="mt-3 p-4 bg-navy border border-gray-700 rounded-lg">
            <p className="text-xs text-gray-400 mb-2">
              Assign yourself to a jurisdiction
            </p>
            <div className="flex items-center gap-3">
              <select
                value={newJurisdiction}
                onChange={(e) => setNewJurisdiction(e.target.value)}
                className="bg-navy-light border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-gold/50 transition-colors flex-1"
              >
                <option value="">Select jurisdiction...</option>
                {availableJurisdictions.map((j) => (
                  <option key={j} value={j}>
                    {getFlag(j)} {j}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddJurisdiction}
                disabled={!newJurisdiction || savingJurisdiction}
                className="px-4 py-2 rounded-lg bg-gold text-navy font-semibold text-sm hover:bg-gold/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {savingJurisdiction ? "Saving..." : "Assign"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Quick Notes                                                        */}
      {/* ----------------------------------------------------------------- */}
      <div className="bg-navy-light border border-gray-700 rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-white">Quick Notes</h2>
          <div className="flex items-center gap-2">
            {notesSaved && (
              <span className="text-xs text-teal animate-pulse">Saved!</span>
            )}
            <span className="text-xs text-gray-500">
              {notesQuick.length} / 2000
            </span>
          </div>
        </div>
        <textarea
          value={notesQuick}
          onChange={(e) => {
            if (e.target.value.length <= 2000) {
              setNotesQuick(e.target.value);
            }
          }}
          onBlur={handleNotesSave}
          rows={4}
          placeholder="Add quick notes about this client..."
          className="w-full bg-navy border border-gray-700 rounded-lg p-3 text-sm text-gray-300 placeholder-gray-600 outline-none focus:border-gold/40 transition-colors resize-y"
        />
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Danger Zone                                                        */}
      {/* ----------------------------------------------------------------- */}
      <div className="bg-navy-light border border-red-500/20 rounded-xl p-5 mb-4">
        <h2 className="text-base font-semibold text-red-400 mb-2">
          Danger Zone
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Permanently delete this client and all associated data. This action
          cannot be undone.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          disabled={deleting}
          className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm hover:bg-red-500/20 transition-colors disabled:opacity-40"
        >
          {deleting ? "Deleting..." : "Delete Client"}
        </button>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Delete Confirmation Modal                                          */}
      {/* ----------------------------------------------------------------- */}
      {showDeleteModal && (
        <DeleteModal
          clientName={client.full_name}
          onConfirm={handleDeleteClient}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}
