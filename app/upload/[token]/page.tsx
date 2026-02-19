"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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
const MAX_FILES = 20;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FileStatus = "pending" | "uploading" | "done" | "failed";

interface UploadFile {
  id: string;
  file: File;
  status: FileStatus;
  progress: number;
  error?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getFileExtension(fileName: string): string {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return `File exceeds 10 MB limit (${formatFileSize(file.size)})`;
  }
  const ext = getFileExtension(file.name);
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    return `File type ".${ext || "unknown"}" is not supported`;
  }
  return null;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

// ---------------------------------------------------------------------------
// SVG Icons
// ---------------------------------------------------------------------------

function HandyLogo() {
  return (
    <div className="flex items-center gap-0 select-none">
      <span className="text-2xl font-bold tracking-tight text-[#0a0b2e]">
        Handy
      </span>
      <span className="text-2xl font-bold text-[#00d4aa]">.</span>
    </div>
  );
}

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

function ShieldIcon({ className }: { className?: string }) {
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
        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
      />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
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
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
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
        d="M6 18L18 6M6 6l12 12"
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

function CheckIcon({ className }: { className?: string }) {
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
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

function ExclamationIcon({ className }: { className?: string }) {
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
        d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Error Page (invalid/expired token)
// ---------------------------------------------------------------------------

function ErrorPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="px-6 py-5 sm:px-8">
        <HandyLogo />
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-6">
            <ShieldIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-xl font-semibold text-[#1a1a2e] mb-3">
            This link has expired or is invalid
          </h1>
          <p className="text-[#6b7280] text-sm leading-relaxed">
            Please contact your tax expert for a new link.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 py-6 text-center">
        <p className="text-xs text-gray-400">
          Secured by Handy &mdash; Global Tax Compliance
        </p>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading Page
// ---------------------------------------------------------------------------

function LoadingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="px-6 py-5 sm:px-8">
        <HandyLogo />
      </header>
      <div className="flex-1 flex items-center justify-center">
        <SpinnerIcon className="w-8 h-8 text-[#00d4aa]" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Success Page
// ---------------------------------------------------------------------------

function SuccessPage({
  uploadedFiles,
  onUploadMore,
}: {
  uploadedFiles: UploadFile[];
  onUploadMore: () => void;
}) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="px-6 py-5 sm:px-8">
        <HandyLogo />
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg text-center">
          {/* Animated checkmark */}
          <div className="mx-auto w-20 h-20 rounded-full bg-[#10b981]/10 flex items-center justify-center mb-6 animate-[scaleIn_0.4s_ease-out]">
            <CheckCircleIcon className="w-12 h-12 text-[#10b981]" />
          </div>

          <h1 className="text-2xl font-semibold text-[#1a1a2e] mb-2">
            Files uploaded successfully!
          </h1>
          <p className="text-[#6b7280] text-sm mb-8">
            Your tax expert will review them shortly.
          </p>

          {/* File list */}
          <div className="bg-[#f9fafb] rounded-xl border border-[#e5e7eb] p-4 mb-8 text-left">
            <ul className="space-y-3">
              {uploadedFiles.map((f) => (
                <li key={f.id} className="flex items-center gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-[#10b981] shrink-0" />
                  <span className="text-sm text-[#1a1a2e] truncate flex-1">
                    {f.file.name}
                  </span>
                  <span className="text-xs text-[#6b7280] shrink-0">
                    {formatFileSize(f.file.size)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={onUploadMore}
            className="bg-[#00d4aa] text-white font-semibold px-8 py-3 rounded-xl text-base hover:bg-[#00b894] transition-colors"
          >
            Upload More
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 py-6 text-center">
        <p className="text-xs text-gray-400">
          Secured by Handy &mdash; Global Tax Compliance
        </p>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Upload Page Component
// ---------------------------------------------------------------------------

export default function UploadPage() {
  const params = useParams();
  const token = params.token as string;
  const supabase = getSupabase();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------

  const [pageState, setPageState] = useState<
    "loading" | "error" | "upload" | "success"
  >("loading");
  const [clientId, setClientId] = useState<string>("");
  const [clientName, setClientName] = useState<string>("");
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [note, setNote] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Token Validation
  // -------------------------------------------------------------------------

  useEffect(() => {
    async function validateToken() {
      try {
        // Query client_upload_tokens
        const { data: tokenData, error: tokenError } = await supabase
          .from("client_upload_tokens")
          .select("*")
          .eq("token", token)
          .eq("is_active", true)
          .single();

        if (tokenError || !tokenData) {
          setPageState("error");
          return;
        }

        // Check expiration client-side
        if (new Date(tokenData.expires_at) <= new Date()) {
          setPageState("error");
          return;
        }

        // Fetch client name
        const { data: clientData, error: clientError } = await supabase
          .from("clients")
          .select("id, full_name")
          .eq("id", tokenData.client_id)
          .single();

        if (clientError || !clientData) {
          setPageState("error");
          return;
        }

        setClientId(clientData.id);
        setClientName(clientData.full_name);
        setPageState("upload");
      } catch {
        setPageState("error");
      }
    }

    if (token) {
      validateToken();
    } else {
      setPageState("error");
    }
  }, [token, supabase]);

  // -------------------------------------------------------------------------
  // File Management
  // -------------------------------------------------------------------------

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles);

      setFiles((prev) => {
        const remaining = MAX_FILES - prev.length;
        if (remaining <= 0) {
          setUploadError(`Maximum ${MAX_FILES} files allowed per session.`);
          return prev;
        }

        const toAdd = fileArray.slice(0, remaining);
        if (fileArray.length > remaining) {
          setUploadError(
            `Only ${remaining} more file${remaining === 1 ? "" : "s"} can be added (max ${MAX_FILES}).`
          );
        }

        const newUploadFiles: UploadFile[] = toAdd.map((file) => {
          const validationError = validateFile(file);
          return {
            id: generateId(),
            file,
            status: validationError ? ("failed" as FileStatus) : ("pending" as FileStatus),
            progress: 0,
            error: validationError ?? undefined,
          };
        });

        return [...prev, ...newUploadFiles];
      });
    },
    []
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setUploadError(null);
  }, []);

  // -------------------------------------------------------------------------
  // Drag & Drop
  // -------------------------------------------------------------------------

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set isDragging false if we're leaving the drop zone itself
    if (
      dropZoneRef.current &&
      !dropZoneRef.current.contains(e.relatedTarget as Node)
    ) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files?.length) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
        addFiles(e.target.files);
      }
      // Reset input so the same files can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [addFiles]
  );

  // -------------------------------------------------------------------------
  // Upload Handler
  // -------------------------------------------------------------------------

  const handleSubmit = useCallback(async () => {
    // Only upload files that are pending (valid)
    const toUpload = files.filter((f) => f.status === "pending");

    if (toUpload.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    let successCount = 0;

    // Upload files sequentially
    for (const uploadFile of toUpload) {
      // Set file status to uploading
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id ? { ...f, status: "uploading" as FileStatus, progress: 10 } : f
        )
      );

      try {
        const timestamp = Date.now();
        const storagePath = `documents/${clientId}/uploads/${timestamp}_${uploadFile.file.name}`;

        // Simulate progress at 30%
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id ? { ...f, progress: 30 } : f
          )
        );

        // Upload to Supabase Storage
        const { error: storageError } = await supabase.storage
          .from("documents")
          .upload(storagePath, uploadFile.file);

        if (storageError) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id
                ? {
                    ...f,
                    status: "failed" as FileStatus,
                    progress: 0,
                    error: `Upload failed: ${storageError.message}`,
                  }
                : f
            )
          );
          continue;
        }

        // Progress at 70%
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id ? { ...f, progress: 70 } : f
          )
        );

        // Create record in documents table
        const { error: dbError } = await supabase.from("documents").insert({
          client_id: clientId,
          uploaded_by_type: "client",
          uploaded_by_name: clientName,
          doc_category: "Source Data",
          file_name: uploadFile.file.name,
          file_path: storagePath,
          file_size: uploadFile.file.size,
          file_type:
            uploadFile.file.type || getFileExtension(uploadFile.file.name),
        });

        if (dbError) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id
                ? {
                    ...f,
                    status: "failed" as FileStatus,
                    progress: 0,
                    error: `Failed to save record: ${dbError.message}`,
                  }
                : f
            )
          );
          continue;
        }

        // Mark as done
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? { ...f, status: "done" as FileStatus, progress: 100 }
              : f
          )
        );
        successCount++;
      } catch (err) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? {
                  ...f,
                  status: "failed" as FileStatus,
                  progress: 0,
                  error: `Unexpected error: ${err instanceof Error ? err.message : "Unknown error"}`,
                }
              : f
          )
        );
      }
    }

    // After ALL files are uploaded
    if (successCount > 0) {
      // Send note as message if provided
      if (note.trim()) {
        await supabase.from("messages").insert({
          client_id: clientId,
          sender_type: "client",
          sender_name: clientName,
          content: note.trim(),
        });
      }

      // Log activity
      await supabase.from("activity_log").insert({
        client_id: clientId,
        action: "client_upload",
        details: `Client uploaded ${successCount} file${successCount === 1 ? "" : "s"} via upload link`,
      });

      // Transition to success
      setIsUploading(false);

      // Small delay so the user sees 100% progress on the last file
      setTimeout(() => {
        setPageState("success");
      }, 600);
    } else {
      setIsUploading(false);
      setUploadError("No files were uploaded successfully. Please try again.");
    }
  }, [files, clientId, clientName, note, supabase]);

  // -------------------------------------------------------------------------
  // Reset for "Upload More"
  // -------------------------------------------------------------------------

  const handleUploadMore = useCallback(() => {
    setFiles([]);
    setNote("");
    setUploadError(null);
    setIsUploading(false);
    setPageState("upload");
  }, []);

  // -------------------------------------------------------------------------
  // Derived
  // -------------------------------------------------------------------------

  const pendingFiles = files.filter((f) => f.status === "pending");
  const hasValidFiles = pendingFiles.length > 0;
  const isSubmitDisabled = !hasValidFiles || isUploading;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (pageState === "loading") {
    return <LoadingPage />;
  }

  if (pageState === "error") {
    return <ErrorPage />;
  }

  if (pageState === "success") {
    return (
      <SuccessPage
        uploadedFiles={files.filter((f) => f.status === "done")}
        onUploadMore={handleUploadMore}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="px-6 py-5 sm:px-8">
        <HandyLogo />
      </header>

      {/* Main Content */}
      <main className="px-6 sm:px-8 pb-16">
        <div className="max-w-[640px] mx-auto">
          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#1a1a2e] mb-2">
              Upload Documents for {clientName}
            </h1>
            <p className="text-[#6b7280] text-sm sm:text-base leading-relaxed">
              Your tax expert has requested documents from you. Upload your files
              securely below.
            </p>
          </div>

          {/* Drag-and-Drop Zone */}
          <div
            ref={dropZoneRef}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? "border-[#00d4aa] bg-[#00d4aa]/5"
                : "border-gray-300 hover:border-[#00d4aa]/50 hover:bg-gray-50"
            }`}
          >
            <CloudUploadIcon
              className={`w-12 h-12 mx-auto mb-4 transition-colors ${
                isDragging ? "text-[#00d4aa]" : "text-[#00d4aa]/70"
              }`}
            />
            <p className="text-base font-medium text-[#1a1a2e] mb-1">
              Drag &amp; drop files here
            </p>
            <p className="text-sm text-[#6b7280] mb-3">or click to browse</p>
            <p className="text-xs text-gray-400">
              PDF, CSV, XLSX, XLS, JPG, PNG, TXT, JSON, ZIP &middot; Max 10 MB
              per file &middot; Up to 20 files
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleInputChange}
            accept={ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(",")}
            multiple
            className="hidden"
          />

          {/* Upload error banner */}
          {uploadError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <ExclamationIcon className="w-5 h-5 text-[#ef4444] shrink-0 mt-0.5" />
              <p className="text-sm text-[#ef4444]">{uploadError}</p>
            </div>
          )}

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[#1a1a2e]">
                  Files ({files.length})
                </h2>
                {files.length > 1 && !isUploading && (
                  <button
                    onClick={() => {
                      setFiles([]);
                      setUploadError(null);
                    }}
                    className="text-xs text-[#6b7280] hover:text-[#ef4444] transition-colors"
                  >
                    Remove all
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {files.map((f) => (
                  <div
                    key={f.id}
                    className={`bg-[#f9fafb] border rounded-xl p-4 ${
                      f.error
                        ? "border-red-200"
                        : f.status === "done"
                          ? "border-[#10b981]/30"
                          : "border-[#e5e7eb]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Icon */}
                      <div className="shrink-0">
                        {f.status === "done" ? (
                          <div className="w-8 h-8 rounded-lg bg-[#10b981]/10 flex items-center justify-center">
                            <CheckIcon className="w-4 h-4 text-[#10b981]" />
                          </div>
                        ) : f.status === "failed" || f.error ? (
                          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                            <ExclamationIcon className="w-4 h-4 text-[#ef4444]" />
                          </div>
                        ) : f.status === "uploading" ? (
                          <div className="w-8 h-8 rounded-lg bg-[#00d4aa]/10 flex items-center justify-center">
                            <SpinnerIcon className="w-4 h-4 text-[#00d4aa]" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                            <DocumentIcon className="w-4 h-4 text-[#6b7280]" />
                          </div>
                        )}
                      </div>

                      {/* File info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#1a1a2e] truncate font-medium">
                          {f.file.name}
                        </p>
                        <p className="text-xs text-[#6b7280]">
                          {formatFileSize(f.file.size)}
                          {f.status === "done" && (
                            <span className="ml-2 text-[#10b981]">
                              Uploaded
                            </span>
                          )}
                          {f.status === "uploading" && (
                            <span className="ml-2 text-[#00d4aa]">
                              Uploading...
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Remove button */}
                      {(f.status === "pending" || f.status === "failed") &&
                        !isUploading && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(f.id);
                            }}
                            className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-[#ef4444] hover:bg-red-50 transition-colors"
                            title="Remove file"
                          >
                            <XIcon className="w-4 h-4" />
                          </button>
                        )}
                    </div>

                    {/* Error message */}
                    {f.error && (
                      <p className="mt-2 text-xs text-[#ef4444] pl-11">
                        {f.error}
                      </p>
                    )}

                    {/* Progress bar */}
                    {(f.status === "uploading" || f.status === "done") && (
                      <div className="mt-3 pl-11">
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ease-out ${
                              f.status === "done"
                                ? "bg-[#10b981]"
                                : "bg-[#00d4aa]"
                            }`}
                            style={{ width: `${f.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optional Note */}
          {files.length > 0 && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-[#1a1a2e] mb-2">
                Add a note for your tax expert{" "}
                <span className="font-normal text-[#6b7280]">(optional)</span>
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g., These are my 2025 exchange statements..."
                rows={3}
                disabled={isUploading}
                className="w-full border border-gray-300 rounded-xl p-4 text-sm text-gray-700 placeholder-gray-400 focus:border-[#00d4aa] focus:ring-1 focus:ring-[#00d4aa] outline-none resize-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          )}

          {/* Submit Button */}
          {files.length > 0 && (
            <div className="mt-6">
              <button
                onClick={handleSubmit}
                disabled={isSubmitDisabled}
                className="w-full sm:w-auto bg-[#00d4aa] text-white font-semibold px-8 py-3 rounded-xl text-base hover:bg-[#00b894] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUploading && <SpinnerIcon className="w-5 h-5" />}
                {isUploading
                  ? "Uploading..."
                  : `Upload ${pendingFiles.length} File${pendingFiles.length === 1 ? "" : "s"}`}
              </button>
            </div>
          )}

          {/* Security note */}
          <div className="mt-10 flex items-center justify-center gap-2 text-gray-400">
            <ShieldIcon className="w-4 h-4" />
            <p className="text-xs">
              Your files are encrypted and securely transmitted
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 text-center border-t border-[#e5e7eb]">
        <p className="text-xs text-gray-400">
          Secured by Handy &mdash; Global Tax Compliance
        </p>
      </footer>

      {/* Global animation keyframes */}
      <style jsx global>{`
        @keyframes scaleIn {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
