"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import type { InternalNote } from "@/lib/types/expert";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NotesTabProps {
  clientId: string;
  expertId: string;
  expertName: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);
}

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = date.getFullYear();
  const time = date.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${day} ${month} ${year}, ${time}`;
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
      {/* Pen / note icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-12 w-12 text-amber-500/30 mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
        />
      </svg>
      <p className="text-sm text-gray-400 mb-1">No internal notes yet.</p>
      <p className="text-xs text-gray-500">
        Be the first to add a note.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Note Card
// ---------------------------------------------------------------------------

function NoteCard({ note }: { note: InternalNote }) {
  const initials = getInitials(note.author_name);

  return (
    <div className="bg-navy-light/80 border border-amber-500/10 rounded-lg p-4 mb-3">
      <div className="flex items-start gap-3">
        {/* Author avatar */}
        <div className="bg-gold/20 text-gold w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          {/* Author name and timestamp */}
          <div className="flex items-baseline gap-2 mb-1.5">
            <span className="text-sm font-semibold text-white">
              {note.author_name}
            </span>
            <span className="text-xs text-gray-500">
              {formatTimestamp(note.created_at)}
            </span>
          </div>

          {/* Content */}
          <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
            {note.content}
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function NotesTab({
  clientId,
  expertId,
  expertName,
}: NotesTabProps) {
  const supabase = createClient();

  // State
  const [notes, setNotes] = useState<InternalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // -------------------------------------------------------------------------
  // Fetch notes on mount
  // -------------------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function fetchNotes() {
      try {
        const { data, error: fetchError } = await supabase
          .from("internal_notes")
          .select("*")
          .eq("client_id", clientId)
          .order("created_at", { ascending: true });

        if (!cancelled) {
          if (fetchError) {
            setError(fetchError.message);
          } else {
            setNotes((data as InternalNote[]) ?? []);
          }
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load notes");
          setLoading(false);
        }
      }
    }

    fetchNotes();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  // -------------------------------------------------------------------------
  // Auto-scroll to bottom when notes change
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [notes]);

  // -------------------------------------------------------------------------
  // Submit handler
  // -------------------------------------------------------------------------

  const handleSubmit = useCallback(async () => {
    const trimmed = content.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    setError(null);

    // Optimistic note
    const optimisticNote: InternalNote = {
      id: `temp-${Date.now()}`,
      client_id: clientId,
      expert_id: expertId,
      author_name: expertName,
      content: trimmed,
      created_at: new Date().toISOString(),
    };

    setNotes((prev) => [...prev, optimisticNote]);
    setContent("");

    try {
      // Persist to Supabase
      const { data, error: insertError } = await supabase
        .from("internal_notes")
        .insert({
          client_id: clientId,
          expert_id: expertId,
          author_name: expertName,
          content: trimmed,
        })
        .select()
        .single();

      if (insertError) {
        // Remove optimistic note and restore content
        setNotes((prev) => prev.filter((n) => n.id !== optimisticNote.id));
        setContent(trimmed);
        setError(insertError.message);
      } else if (data) {
        // Replace optimistic note with the real one
        setNotes((prev) =>
          prev.map((n) => (n.id === optimisticNote.id ? (data as InternalNote) : n))
        );
      }
    } catch (err) {
      setNotes((prev) => prev.filter((n) => n.id !== optimisticNote.id));
      setContent(trimmed);
      setError(err instanceof Error ? err.message : "Failed to add note");
    }

    setSubmitting(false);
    textareaRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, submitting, clientId, expertId, expertName]);

  // Handle Ctrl/Cmd+Enter to submit
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="bg-amber-900/5 rounded-xl p-4">
      <div className="flex flex-col h-[calc(100vh-280px)]">
        {/* Header */}
        <div className="mb-3">
          <h2 className="text-base font-semibold text-amber-400 mb-2">
            <span className="mr-1.5">&#x1F512;</span>
            Internal Notes &mdash; not visible to clients
          </h2>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
            <p className="text-amber-400 text-xs leading-relaxed">
              These notes are private and only visible to experts on this case.
              Notes cannot be edited or deleted after creation to maintain an
              audit trail.
            </p>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-between">
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300 text-xs ml-3"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Scrollable notes area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto min-h-0 pr-1"
        >
          {loading ? (
            <div className="flex-1 flex items-center justify-center py-16">
              <div className="flex items-center gap-2 text-gray-500">
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span className="text-sm">Loading notes...</span>
              </div>
            </div>
          ) : notes.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="py-1">
              {notes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          )}
        </div>

        {/* Add note form — sticky at bottom */}
        <div className="pt-3 mt-3 border-t border-amber-500/10">
          <div className="flex gap-3">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add an internal note..."
              rows={3}
              className="flex-1 bg-navy border border-gray-700 rounded-lg p-3 text-sm text-white placeholder-gray-500 outline-none focus:border-amber-500/50 transition-colors resize-none"
            />
            <div className="flex flex-col justify-end">
              <button
                onClick={handleSubmit}
                disabled={!content.trim() || submitting}
                className="px-4 py-2 rounded-lg bg-amber-500/80 text-navy font-semibold text-sm hover:bg-amber-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {submitting ? "Adding..." : "Add Note"}
              </button>
              <span className="text-[10px] text-gray-600 mt-1 text-center">
                Ctrl+Enter
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
