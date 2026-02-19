"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { getFlag } from "@/lib/country-flags";
import type { Document } from "@/lib/types/expert";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DocumentsTabProps {
  clientId: string;
  clientCountries: string[];
  expertId: string;
  expertName: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DOC_CATEGORIES = [
  "Tax Report",
  "Source Data",
  "Exchange CSV",
  "Wallet Export",
  "ID Document",
  "Contract",
  "Communication",
  "Other",
] as const;

const ALLOWED_EXTENSIONS = [
  "pdf",
  "csv",
  "xlsx",
  "xls",
  "jpg",
  "jpeg",
  "png",
  "txt",
  "json",
  "zip",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const CATEGORY_BADGE_COLORS: Record<string, string> = {
  "Tax Report": "bg-teal/10 text-teal border-teal/30",
  "Source Data": "bg-blue-500/10 text-blue-400 border-blue-500/30",
  "Exchange CSV": "bg-purple-500/10 text-purple-400 border-purple-500/30",
  "Wallet Export": "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
  "ID Document": "bg-amber-500/10 text-amber-400 border-amber-500/30",
  Contract: "bg-green-500/10 text-green-400 border-green-500/30",
  Communication: "bg-gray-500/10 text-gray-400 border-gray-600",
  Other: "bg-gray-500/10 text-gray-400 border-gray-600",
};

const SOURCE_DATA_CATEGORIES = new Set([
  "Source Data",
  "Exchange CSV",
  "Wallet Export",
]);
const REPORT_CATEGORIES = new Set(["Tax Report"]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getFileExtension(fileName: string): string {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

function truncateFileName(name: string, maxLen = 32): string {
  if (name.length <= maxLen) return name;
  const ext = getFileExtension(name);
  const base = name.slice(0, name.length - ext.length - 1);
  const truncated = base.slice(0, maxLen - ext.length - 4) + "...";
  return `${truncated}.${ext}`;
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function CloudUploadIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 3 3 0 013.438 3.42A3.75 3.75 0 0118 19.5H6.75z"
      />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
      />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      />
    </svg>
  );
}

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
      />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className ?? ""}`}
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

// ---------------------------------------------------------------------------
// Document Table Section
// ---------------------------------------------------------------------------

function DocumentSection({
  title,
  documents,
  onDownload,
  onDelete,
  deletingId,
  confirmDeleteId,
  setConfirmDeleteId,
}: {
  title: string;
  documents: Document[];
  onDownload: (doc: Document) => void;
  onDelete: (doc: Document) => void;
  deletingId: string | null;
  confirmDeleteId: string | null;
  setConfirmDeleteId: (id: string | null) => void;
}) {
  if (documents.length === 0) return null;

  return (
    <div className="bg-navy-light border border-gray-700 rounded-xl p-5 mb-4">
      <h3 className="text-sm font-semibold text-white mb-3">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="text-xs text-gray-500 uppercase tracking-wider pb-3 pr-4">
                Name
              </th>
              <th className="text-xs text-gray-500 uppercase tracking-wider pb-3 pr-4">
                Jurisdiction
              </th>
              <th className="text-xs text-gray-500 uppercase tracking-wider pb-3 pr-4">
                Category
              </th>
              <th className="text-xs text-gray-500 uppercase tracking-wider pb-3 pr-4">
                Uploaded by
              </th>
              <th className="text-xs text-gray-500 uppercase tracking-wider pb-3 pr-4">
                Date
              </th>
              <th className="text-xs text-gray-500 uppercase tracking-wider pb-3 pr-4">
                Size
              </th>
              <th className="text-xs text-gray-500 uppercase tracking-wider pb-3 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id} className="border-t border-gray-700/50">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <DocumentIcon className="h-4 w-4 text-gray-500 shrink-0" />
                    <span
                      className="text-sm text-gray-300"
                      title={doc.file_name}
                    >
                      {truncateFileName(doc.file_name)}
                    </span>
                  </div>
                </td>
                <td className="py-3 pr-4">
                  {doc.jurisdiction ? (
                    <span className="text-sm text-gray-300">
                      {getFlag(doc.jurisdiction)} {doc.jurisdiction}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-600">&mdash;</span>
                  )}
                </td>
                <td className="py-3 pr-4">
                  <span
                    className={`text-xs px-2 py-1 rounded-full border font-medium ${
                      CATEGORY_BADGE_COLORS[doc.doc_category] ??
                      CATEGORY_BADGE_COLORS.Other
                    }`}
                  >
                    {doc.doc_category}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <span className="text-sm text-gray-400">
                    {doc.uploaded_by_name ?? "Unknown"}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <span className="text-sm text-gray-400 whitespace-nowrap">
                    {formatDate(doc.created_at)}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <span className="text-sm text-gray-400 whitespace-nowrap">
                    {formatFileSize(doc.file_size)}
                  </span>
                </td>
                <td className="py-3 text-right">
                  {confirmDeleteId === doc.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-xs text-red-400">Are you sure?</span>
                      <button
                        onClick={() => onDelete(doc)}
                        disabled={deletingId === doc.id}
                        className="text-xs px-2 py-1 rounded bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-40"
                      >
                        {deletingId === doc.id ? "Deleting..." : "Yes"}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-xs px-2 py-1 rounded border border-gray-700 text-gray-400 hover:text-gray-300 transition-colors"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onDownload(doc)}
                        className="text-gray-500 hover:text-teal transition-colors"
                        title="Download"
                      >
                        <DownloadIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(doc.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function DocumentsTab({
  clientId,
  clientCountries,
  expertId,
  expertName,
}: DocumentsTabProps) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadJurisdiction, setUploadJurisdiction] = useState("");
  const [uploadCategory, setUploadCategory] = useState<string>("Other");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);

  // Delete state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Download link state
  const [downloadLink, setDownloadLink] = useState<string | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Document selection for download link
  const [showDocSelector, setShowDocSelector] = useState(false);
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [showAllDocsInSelector, setShowAllDocsInSelector] = useState(false);

  // -------------------------------------------------------------------------
  // Fetch documents
  // -------------------------------------------------------------------------

  const fetchDocuments = useCallback(async () => {
    const { data } = await supabase
      .from("documents")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (data) setDocuments(data as Document[]);
    setLoading(false);
  }, [supabase, clientId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // -------------------------------------------------------------------------
  // File validation
  // -------------------------------------------------------------------------

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File size (${formatFileSize(file.size)}) exceeds maximum of 10 MB.`;
    }
    const ext = getFileExtension(file.name);
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      return `File type ".${ext || "unknown"}" is not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}.`;
    }
    return null;
  }, []);

  // -------------------------------------------------------------------------
  // File selection
  // -------------------------------------------------------------------------

  const handleFileSelect = useCallback(
    (file: File) => {
      setUploadError(null);
      const error = validateFile(file);
      if (error) {
        setUploadError(error);
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setUploadCategory("Other");
      setUploadJurisdiction("");
    },
    [validateFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
      // Reset input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [handleFileSelect]
  );

  // -------------------------------------------------------------------------
  // Drag and drop handlers
  // -------------------------------------------------------------------------

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  // -------------------------------------------------------------------------
  // Upload handler
  // -------------------------------------------------------------------------

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadError(null);

    try {
      const timestamp = Date.now();
      const storagePath = `documents/${clientId}/${timestamp}_${selectedFile.name}`;

      // Upload to Supabase Storage
      const { error: storageError } = await supabase.storage
        .from("documents")
        .upload(storagePath, selectedFile);

      if (storageError) {
        setUploadError(`Upload failed: ${storageError.message}`);
        setUploading(false);
        return;
      }

      // Create record in documents table
      const { error: dbError } = await supabase.from("documents").insert({
        client_id: clientId,
        uploaded_by: expertId,
        uploaded_by_name: expertName,
        file_path: storagePath,
        file_name: selectedFile.name,
        file_size: selectedFile.size,
        file_type: selectedFile.type || getFileExtension(selectedFile.name),
        jurisdiction: uploadJurisdiction || null,
        doc_category: uploadCategory,
      });

      if (dbError) {
        setUploadError(`Failed to save record: ${dbError.message}`);
        setUploading(false);
        return;
      }

      // Success — refresh and clear form
      setSelectedFile(null);
      setUploadJurisdiction("");
      setUploadCategory("Other");
      await fetchDocuments();
    } catch (err) {
      setUploadError(
        `Unexpected error: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setUploading(false);
    }
  }, [
    selectedFile,
    supabase,
    clientId,
    expertId,
    expertName,
    uploadJurisdiction,
    uploadCategory,
    fetchDocuments,
  ]);

  // -------------------------------------------------------------------------
  // Download handler
  // -------------------------------------------------------------------------

  const handleDownload = useCallback(
    async (doc: Document) => {
      const { data, error } = await supabase.storage
        .from("documents")
        .createSignedUrl(doc.file_path, 300); // 5 min expiry

      if (error || !data?.signedUrl) {
        alert("Failed to generate download link.");
        return;
      }
      window.open(data.signedUrl, "_blank");
    },
    [supabase]
  );

  // -------------------------------------------------------------------------
  // Delete handler
  // -------------------------------------------------------------------------

  const handleDelete = useCallback(
    async (doc: Document) => {
      setDeletingId(doc.id);

      // Delete from storage
      await supabase.storage.from("documents").remove([doc.file_path]);

      // Delete record from table
      await supabase.from("documents").delete().eq("id", doc.id);

      setDeletingId(null);
      setConfirmDeleteId(null);
      await fetchDocuments();
    },
    [supabase, fetchDocuments]
  );

  // -------------------------------------------------------------------------
  // Generate Client Download Link
  // -------------------------------------------------------------------------

  const handleOpenDocSelector = useCallback(() => {
    // Pre-select all "Tax Report" docs by default
    const taxReportIds = new Set<string>(
      documents
        .filter((d) => d.doc_category === "Tax Report")
        .map((d) => d.id)
    );
    setSelectedDocIds(taxReportIds);
    setShowAllDocsInSelector(false);
    setShowDocSelector(true);
    setDownloadLink(null);
    setLinkCopied(false);
  }, [documents]);

  const handleToggleDocSelection = useCallback((docId: string) => {
    setSelectedDocIds((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) {
        next.delete(docId);
      } else {
        next.add(docId);
      }
      return next;
    });
  }, []);

  const handleSelectAllDocs = useCallback(() => {
    const visibleDocs = showAllDocsInSelector
      ? documents
      : documents.filter((d) => d.doc_category === "Tax Report");
    setSelectedDocIds(new Set(visibleDocs.map((d) => d.id)));
  }, [documents, showAllDocsInSelector]);

  const handleDeselectAllDocs = useCallback(() => {
    setSelectedDocIds(new Set());
  }, []);

  const handleGenerateDownloadLink = useCallback(async () => {
    if (selectedDocIds.size === 0) return;
    setGeneratingLink(true);
    setLinkCopied(false);

    try {
      const token = crypto.randomUUID();
      const expiresAt = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(); // 30 days

      await supabase.from("client_download_tokens").insert({
        client_id: clientId,
        token,
        expires_at: expiresAt,
        is_active: true,
        document_ids: Array.from(selectedDocIds),
      });

      const link = `${window.location.origin}/download/${token}`;
      setDownloadLink(link);
      setShowDocSelector(false);
    } catch {
      alert("Failed to generate download link.");
    } finally {
      setGeneratingLink(false);
    }
  }, [supabase, clientId, selectedDocIds]);

  const handleCopyLink = useCallback(async () => {
    if (!downloadLink) return;
    try {
      await navigator.clipboard.writeText(downloadLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = downloadLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  }, [downloadLink]);

  // -------------------------------------------------------------------------
  // Split documents into sections
  // -------------------------------------------------------------------------

  const sourceDataDocs = documents.filter((d) =>
    SOURCE_DATA_CATEGORIES.has(d.doc_category)
  );
  const reportDocs = documents.filter((d) =>
    REPORT_CATEGORIES.has(d.doc_category)
  );
  const otherDocs = documents.filter(
    (d) =>
      !SOURCE_DATA_CATEGORIES.has(d.doc_category) &&
      !REPORT_CATEGORIES.has(d.doc_category)
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <SpinnerIcon className="h-6 w-6 text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ------------------------------------------------------------------- */}
      {/* Upload Area                                                          */}
      {/* ------------------------------------------------------------------- */}
      <div className="bg-navy-light border border-gray-700 rounded-xl p-5 mb-4">
        <h2 className="text-base font-semibold text-white mb-4">
          Upload Document
        </h2>

        {/* Drag-and-drop zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            isDragging
              ? "border-gold bg-gold/5"
              : "border-gray-600 hover:border-gold/50"
          }`}
        >
          <CloudUploadIcon className="h-10 w-10 text-gray-500 mx-auto mb-3" />
          <p className="text-sm text-gray-400 mb-1">
            Drag &amp; drop files here or click to browse
          </p>
          <p className="text-xs text-gray-600">
            Max 10 MB &middot; PDF, CSV, XLSX, XLS, JPG, PNG, TXT, JSON, ZIP
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleInputChange}
          accept={ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(",")}
          className="hidden"
        />

        {/* Upload error */}
        {uploadError && (
          <div className="mt-3 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400">{uploadError}</p>
          </div>
        )}

        {/* Upload form (appears after file is selected) */}
        {selectedFile && (
          <div className="mt-4 p-4 bg-navy border border-gray-700 rounded-lg space-y-4">
            {/* File info */}
            <div className="flex items-center gap-3">
              <DocumentIcon className="h-5 w-5 text-gold shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setUploadError(null);
                }}
                className="text-gray-500 hover:text-gray-300 transition-colors shrink-0"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
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

            {/* Form fields */}
            <div className="grid sm:grid-cols-2 gap-3">
              {/* Jurisdiction */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Jurisdiction (optional)
                </label>
                <select
                  value={uploadJurisdiction}
                  onChange={(e) => setUploadJurisdiction(e.target.value)}
                  className="w-full bg-navy-light border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-gold/50 transition-colors"
                >
                  <option value="">None</option>
                  {clientCountries.map((c) => (
                    <option key={c} value={c}>
                      {getFlag(c)} {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Category
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full bg-navy-light border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-gold/50 transition-colors"
                >
                  {DOC_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Upload button */}
            <div className="flex justify-end">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-4 py-2 rounded-lg bg-gold text-navy font-semibold text-sm hover:bg-gold/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {uploading && <SpinnerIcon className="h-4 w-4" />}
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Generate Client Download Link                                        */}
      {/* ------------------------------------------------------------------- */}
      <div className="bg-navy-light border border-gray-700 rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <LinkIcon className="h-4 w-4 text-gold" />
            Client Download Link
          </h3>
          {!showDocSelector && (
            <button
              onClick={handleOpenDocSelector}
              disabled={documents.length === 0}
              className="px-4 py-2 rounded-lg border border-gray-700 text-sm text-gray-300 hover:border-gold/40 hover:text-gold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Generate Link
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Generate a secure link your client can use to access and download
          selected documents. Link expires in 30 days.
        </p>

        {/* Document selector */}
        {showDocSelector && (
          <div className="mt-3 space-y-3">
            {/* Controls row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSelectAllDocs}
                  className="text-xs text-gold hover:text-gold/80 transition-colors"
                >
                  Select All
                </button>
                <span className="text-gray-600 text-xs">|</span>
                <button
                  onClick={handleDeselectAllDocs}
                  className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
                >
                  Deselect All
                </button>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs text-gray-400">Show all</span>
                <button
                  onClick={() => setShowAllDocsInSelector((v) => !v)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    showAllDocsInSelector ? "bg-gold" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      showAllDocsInSelector ? "translate-x-[18px]" : "translate-x-[3px]"
                    }`}
                  />
                </button>
              </label>
            </div>

            {/* Document list */}
            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
              {(showAllDocsInSelector
                ? documents
                : documents.filter((d) => d.doc_category === "Tax Report")
              ).map((doc) => {
                const isSelected = selectedDocIds.has(doc.id);
                return (
                  <label
                    key={doc.id}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors cursor-pointer ${
                      isSelected
                        ? "border-gold/30 bg-gold/5"
                        : "border-gray-700/50 hover:border-gray-600"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleDocSelection(doc.id)}
                      className="accent-gold h-4 w-4 shrink-0"
                    />
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <span className="text-sm text-gray-300 truncate" title={doc.file_name}>
                        {truncateFileName(doc.file_name)}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium shrink-0 ${
                          CATEGORY_BADGE_COLORS[doc.doc_category] ??
                          CATEGORY_BADGE_COLORS.Other
                        }`}
                      >
                        {doc.doc_category}
                      </span>
                      {doc.jurisdiction && (
                        <span className="text-xs text-gray-500 shrink-0">
                          {getFlag(doc.jurisdiction)} {doc.jurisdiction}
                        </span>
                      )}
                    </div>
                  </label>
                );
              })}
              {!showAllDocsInSelector &&
                documents.filter((d) => d.doc_category === "Tax Report").length === 0 && (
                  <p className="text-xs text-gray-500 py-3 text-center">
                    No Tax Report documents found. Toggle &quot;Show all&quot; to see
                    all documents.
                  </p>
                )}
            </div>

            {/* Selected count & action buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-700/50">
              <span className="text-xs text-gray-400">
                {selectedDocIds.size} document{selectedDocIds.size !== 1 ? "s" : ""} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowDocSelector(false);
                    setSelectedDocIds(new Set());
                  }}
                  className="px-3 py-1.5 rounded-lg border border-gray-700 text-sm text-gray-400 hover:text-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateDownloadLink}
                  disabled={generatingLink || selectedDocIds.size === 0}
                  className="px-4 py-2 rounded-lg bg-gold text-navy font-semibold text-sm hover:bg-gold/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {generatingLink && <SpinnerIcon className="h-3 w-3" />}
                  {generatingLink ? "Generating..." : "Generate Link"}
                </button>
              </div>
            </div>
          </div>
        )}

        {downloadLink && (
          <div className="flex items-center gap-2 bg-navy border border-gray-700 rounded-lg px-3 py-2 mt-3">
            <input
              type="text"
              readOnly
              value={downloadLink}
              className="flex-1 bg-transparent text-sm text-gray-300 outline-none truncate"
            />
            <button
              onClick={handleCopyLink}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-gold text-navy font-semibold text-xs hover:bg-gold/90 transition-colors flex items-center gap-1.5"
            >
              <ClipboardIcon className="h-3.5 w-3.5" />
              {linkCopied ? "Copied!" : "Copy"}
            </button>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Document Sections                                                    */}
      {/* ------------------------------------------------------------------- */}
      {documents.length === 0 ? (
        <div className="bg-navy-light border border-gray-700 rounded-xl p-12 text-center">
          <DocumentIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-sm text-gray-500">No documents uploaded yet</p>
          <p className="text-xs text-gray-600 mt-1">
            Upload files using the area above to get started.
          </p>
        </div>
      ) : (
        <>
          <DocumentSection
            title="Source Data (from client)"
            documents={sourceDataDocs}
            onDownload={handleDownload}
            onDelete={handleDelete}
            deletingId={deletingId}
            confirmDeleteId={confirmDeleteId}
            setConfirmDeleteId={setConfirmDeleteId}
          />
          <DocumentSection
            title="Reports (from us)"
            documents={reportDocs}
            onDownload={handleDownload}
            onDelete={handleDelete}
            deletingId={deletingId}
            confirmDeleteId={confirmDeleteId}
            setConfirmDeleteId={setConfirmDeleteId}
          />
          <DocumentSection
            title="Other Documents"
            documents={otherDocs}
            onDownload={handleDownload}
            onDelete={handleDelete}
            deletingId={deletingId}
            confirmDeleteId={confirmDeleteId}
            setConfirmDeleteId={setConfirmDeleteId}
          />
        </>
      )}
    </div>
  );
}
