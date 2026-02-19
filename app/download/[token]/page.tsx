"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { getFlag } from "@/lib/country-flags";
import type { ClientDownloadToken, Document } from "@/lib/types/expert";

/* ─── Helpers ─────────────────────────────────────────────────────── */

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function getFileIcon(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  switch (ext) {
    case "pdf":
      return "\u{1F4C4}";
    case "csv":
    case "xlsx":
    case "xls":
      return "\u{1F4CA}";
    case "jpg":
    case "jpeg":
    case "png":
      return "\u{1F5BC}\uFE0F";
    case "txt":
    case "json":
      return "\u{1F4DD}";
    case "zip":
      return "\u{1F4E6}";
    default:
      return "\u{1F4C4}";
  }
}

/* ─── Logo ────────────────────────────────────────────────────────── */

function HandyLogo() {
  return (
    <span className="text-2xl font-bold tracking-tight" style={{ color: "#0a0b2e" }}>
      Handy<span style={{ color: "#00d4aa" }}>.</span>
    </span>
  );
}

/* ─── Spinner (inline on button) ──────────────────────────────────── */

function Spinner() {
  return (
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
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

/* ─── Page Component ──────────────────────────────────────────────── */

export default function DownloadPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);

  /* ── Validate token & fetch documents ─────────────────────────── */

  useEffect(() => {
    async function init() {
      try {
        const supabase = getSupabase();

        // 1. Validate token
        const { data: tokenData, error: tokenErr } = await supabase
          .from("client_download_tokens")
          .select("*")
          .eq("token", token)
          .eq("is_active", true)
          .single();

        if (tokenErr || !tokenData) {
          setError("expired");
          setLoading(false);
          return;
        }

        const downloadToken = tokenData as ClientDownloadToken;

        // Check expiry
        if (new Date(downloadToken.expires_at) <= new Date()) {
          setError("expired");
          setLoading(false);
          return;
        }

        // 2. Fetch client name
        const { data: clientData } = await supabase
          .from("clients")
          .select("full_name")
          .eq("id", downloadToken.client_id)
          .single();

        setClientName(clientData?.full_name ?? "you");

        // 3. Fetch documents
        let docs: Document[] = [];

        if (downloadToken.document_ids && downloadToken.document_ids.length > 0) {
          const { data: docData } = await supabase
            .from("documents")
            .select("*")
            .in("id", downloadToken.document_ids)
            .order("created_at", { ascending: false });
          docs = (docData as Document[]) ?? [];
        } else {
          const { data: docData } = await supabase
            .from("documents")
            .select("*")
            .eq("client_id", downloadToken.client_id)
            .eq("doc_category", "Tax Report")
            .order("created_at", { ascending: false });
          docs = (docData as Document[]) ?? [];
        }

        setDocuments(docs);
      } catch {
        setError("expired");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [token]);

  /* ── Download a single file ───────────────────────────────────── */

  const handleDownload = useCallback(
    async (doc: Document) => {
      setDownloadingId(doc.id);
      try {
        const supabase = getSupabase();

        // Generate signed URL (5 min)
        const { data, error: urlErr } = await supabase.storage
          .from("documents")
          .createSignedUrl(doc.file_path, 300);

        if (urlErr || !data?.signedUrl) {
          alert("Failed to generate download link. Please try again.");
          return;
        }

        // Open download
        window.open(data.signedUrl, "_blank");

        // Log activity
        await supabase.from("activity_log").insert({
          client_id: doc.client_id,
          action: "client_download",
          details: `Client downloaded ${doc.file_name} via download link`,
        });
      } catch {
        alert("Download failed. Please try again.");
      } finally {
        setDownloadingId(null);
      }
    },
    []
  );

  /* ── Download all files ───────────────────────────────────────── */

  const handleDownloadAll = useCallback(async () => {
    setDownloadingAll(true);
    try {
      const supabase = getSupabase();

      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];

        const { data, error: urlErr } = await supabase.storage
          .from("documents")
          .createSignedUrl(doc.file_path, 300);

        if (urlErr || !data?.signedUrl) continue;

        window.open(data.signedUrl, "_blank");

        // Log activity
        await supabase.from("activity_log").insert({
          client_id: doc.client_id,
          action: "client_download",
          details: `Client downloaded ${doc.file_name} via download link`,
        });

        // Small delay between downloads to avoid popup blockers
        if (i < documents.length - 1) {
          await new Promise((r) => setTimeout(r, 500));
        }
      }
    } catch {
      alert("Some downloads may have failed. Please try again.");
    } finally {
      setDownloadingAll(false);
    }
  }, [documents]);

  /* ── Loading state ────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <HandyLogo />
          <p className="text-gray-400 text-sm">Loading your documents...</p>
        </div>
      </div>
    );
  }

  /* ── Error / expired state ────────────────────────────────────── */

  if (error) {
    return (
      <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="mb-8">
            <HandyLogo />
          </div>
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>
          <h1
            className="text-xl font-semibold mb-2"
            style={{ color: "#1a1a2e" }}
          >
            This link has expired or is invalid
          </h1>
          <p className="text-gray-500 text-sm">
            Please contact your tax expert for a new link.
          </p>
        </div>
      </div>
    );
  }

  /* ── Empty state ──────────────────────────────────────────────── */

  if (documents.length === 0) {
    return (
      <div className="min-h-screen bg-white text-gray-900 flex flex-col">
        {/* Header */}
        <header className="w-full border-b border-gray-200 px-4 py-4">
          <div className="max-w-[640px] mx-auto">
            <HandyLogo />
          </div>
        </header>

        {/* Empty content */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gray-50 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9.75m3 0H9.75m0 0v3.375m0-3.375h3.375M6.75 21h10.5A2.25 2.25 0 0019.5 18.75V6.108c0-.597-.237-1.17-.659-1.591l-2.858-2.858A2.25 2.25 0 0014.392 1.5H6.75A2.25 2.25 0 004.5 3.75v15A2.25 2.25 0 006.75 21z"
                />
              </svg>
            </div>
            <h2
              className="text-lg font-semibold mb-2"
              style={{ color: "#1a1a2e" }}
            >
              No documents are available for download yet.
            </h2>
            <p className="text-gray-500 text-sm">
              Your tax expert will notify you when your reports are ready.
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="w-full border-t border-gray-200 px-4 py-6">
          <div className="max-w-[640px] mx-auto text-center">
            <p className="text-gray-400 text-xs mb-1">
              Powered by <span className="font-semibold">Handy.</span>
            </p>
            <p className="text-gray-400 text-xs">
              Need help? Contact your tax expert.
            </p>
          </div>
        </footer>
      </div>
    );
  }

  /* ── Main download page ───────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-gray-200 px-4 py-4">
        <div className="max-w-[640px] mx-auto">
          <HandyLogo />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 py-8 sm:py-12">
        <div className="max-w-[640px] mx-auto">
          {/* Title section */}
          <div className="mb-8">
            <h1
              className="text-2xl sm:text-3xl font-bold mb-2"
              style={{ color: "#1a1a2e" }}
            >
              Your Tax Reports are Ready
            </h1>
            <p className="text-gray-500">
              Documents prepared for{" "}
              <span className="font-medium text-gray-700">{clientName}</span>
            </p>
          </div>

          {/* Document list header */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              {documents.length} document{documents.length !== 1 ? "s" : ""}
            </p>
            {documents.length > 1 && (
              <button
                onClick={handleDownloadAll}
                disabled={downloadingAll}
                className="bg-[#00d4aa] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#00b894] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 text-sm sm:text-base"
              >
                {downloadingAll ? (
                  <>
                    <Spinner />
                    Downloading...
                  </>
                ) : (
                  <>
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
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                        transform="rotate(180 12 12)"
                      />
                    </svg>
                    Download All
                  </>
                )}
              </button>
            )}
          </div>

          {/* Document cards */}
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="bg-[#f9fafb] border border-[#e5e7eb] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
              >
                {/* Icon */}
                <div className="hidden sm:flex w-10 h-10 rounded-lg bg-white border border-gray-200 items-center justify-center text-lg shrink-0">
                  {getFileIcon(doc.file_name)}
                </div>

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="sm:hidden text-lg">
                      {getFileIcon(doc.file_name)}
                    </span>
                    <p
                      className="font-semibold text-sm truncate"
                      style={{ color: "#1a1a2e" }}
                      title={doc.file_name}
                    >
                      {doc.file_name}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                    <span className="text-xs text-gray-400">
                      {formatFileSize(doc.file_size)}
                    </span>
                    {doc.jurisdiction && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <span>{getFlag(doc.jurisdiction)}</span>
                        {doc.jurisdiction}
                      </span>
                    )}
                    <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-teal-50 text-teal-700">
                      {doc.doc_category}
                    </span>
                  </div>
                </div>

                {/* Download button */}
                <button
                  onClick={() => handleDownload(doc)}
                  disabled={downloadingId === doc.id}
                  className="border border-[#00d4aa] text-[#00d4aa] rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#00d4aa] hover:text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0 w-full sm:w-auto"
                >
                  {downloadingId === doc.id ? (
                    <>
                      <Spinner />
                      <span>Downloading</span>
                    </>
                  ) : (
                    "Download"
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-gray-200 px-4 py-6 mt-auto">
        <div className="max-w-[640px] mx-auto text-center">
          <p className="text-gray-400 text-xs mb-1">
            Powered by <span className="font-semibold">Handy.</span>
          </p>
          <p className="text-gray-400 text-xs">
            Need help? Contact your tax expert.
          </p>
        </div>
      </footer>
    </div>
  );
}
