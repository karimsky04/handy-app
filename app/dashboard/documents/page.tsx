"use client";

import { useState, useMemo } from "react";

/* ═══════════════════════ TYPES ═══════════════════════ */

type DocStatus =
  | "final"
  | "pending_approval"
  | "draft"
  | "in_progress"
  | "processed"
  | "under_review"
  | "reviewed"
  | "archived"
  | "signed"
  | "awaiting";

type DocType =
  | "tax_report"
  | "source_data"
  | "expert_comms"
  | "compliance";

interface Document {
  name: string;
  jurisdictions: { flag: string; code: string; label: string }[];
  date: string;
  sortDate: number;
  uploadedBy: string;
  status: DocStatus;
  type: DocType;
  canView: boolean;
  canApprove: boolean;
}

/* ═══════════════════════ DATA ═══════════════════════ */

const UK = { flag: "🇬🇧", code: "GB", label: "UK" };
const FR = { flag: "🇫🇷", code: "FR", label: "France" };
const PT = { flag: "🇵🇹", code: "PT", label: "Portugal" };
const ALL = { flag: "🌐", code: "ALL", label: "All" };

const DOCUMENTS: Document[] = [
  // Tax Reports
  { name: "Capital_Gains_Summary_2024-25.pdf", jurisdictions: [UK], date: "Feb 14, 2026", sortDate: 20260214, uploadedBy: "Handy (auto-generated)", status: "final", type: "tax_report", canView: true, canApprove: false },
  { name: "SA108_Final_Review.pdf", jurisdictions: [UK], date: "Today", sortDate: 20260216, uploadedBy: "Sarah Mitchell", status: "pending_approval", type: "tax_report", canView: true, canApprove: true },
  { name: "Staking_Income_Breakdown.pdf", jurisdictions: [UK], date: "Feb 12, 2026", sortDate: 20260212, uploadedBy: "Handy (auto-generated)", status: "final", type: "tax_report", canView: true, canApprove: false },
  { name: "Full_Transaction_Log.csv", jurisdictions: [UK], date: "Feb 10, 2026", sortDate: 20260210, uploadedBy: "Handy (auto-generated)", status: "final", type: "tax_report", canView: false, canApprove: false },
  { name: "Cerfa_2086_Draft.pdf", jurisdictions: [FR], date: "Feb 15, 2026", sortDate: 20260215, uploadedBy: "Pierre Dubois", status: "draft", type: "tax_report", canView: true, canApprove: false },
  { name: "NHR_Status_Confirmation.pdf", jurisdictions: [PT], date: "Feb 8, 2026", sortDate: 20260208, uploadedBy: "Ana Santos", status: "final", type: "tax_report", canView: true, canApprove: false },

  // Source Data
  { name: "Binance_Trade_History_2024.csv", jurisdictions: [UK], date: "Feb 1, 2026", sortDate: 20260201, uploadedBy: "Michael (you)", status: "processed", type: "source_data", canView: false, canApprove: false },
  { name: "Coinbase_Transactions_2024.csv", jurisdictions: [UK], date: "Feb 1, 2026", sortDate: 20260201.1, uploadedBy: "Michael (you)", status: "processed", type: "source_data", canView: false, canApprove: false },
  { name: "Kraken_Ledger_Export.csv", jurisdictions: [UK], date: "Feb 1, 2026", sortDate: 20260201.2, uploadedBy: "Michael (you)", status: "processed", type: "source_data", canView: false, canApprove: false },
  { name: "DeFi_Wallet_0x8f3...a2b_history.json", jurisdictions: [UK], date: "Feb 2, 2026", sortDate: 20260202, uploadedBy: "Handy (auto-imported)", status: "processed", type: "source_data", canView: false, canApprove: false },
  { name: "French_Bank_Statement_2024.pdf", jurisdictions: [FR], date: "Feb 5, 2026", sortDate: 20260205, uploadedBy: "Michael (you)", status: "under_review", type: "source_data", canView: false, canApprove: false },

  // Expert Communications
  { name: "Cost_Basis_Methodology_Note.pdf", jurisdictions: [UK], date: "Feb 8, 2026", sortDate: 20260208.1, uploadedBy: "Sarah Mitchell", status: "reviewed", type: "expert_comms", canView: true, canApprove: false },
  { name: "UK_France_Treaty_Analysis.pdf", jurisdictions: [UK, FR], date: "Feb 13, 2026", sortDate: 20260213, uploadedBy: "Sarah Mitchell & Pierre Dubois", status: "in_progress", type: "expert_comms", canView: true, canApprove: false },
  { name: "Portugal_NHR_Eligibility_Review.pdf", jurisdictions: [PT], date: "Feb 6, 2026", sortDate: 20260206, uploadedBy: "Ana Santos", status: "final", type: "expert_comms", canView: true, canApprove: false },

  // Compliance Records
  { name: "Compliance_Map_Generated_Feb2026.pdf", jurisdictions: [ALL], date: "Feb 1, 2026", sortDate: 20260201.3, uploadedBy: "Handy (auto-generated)", status: "archived", type: "compliance", canView: false, canApprove: false },
  { name: "HMRC_Submission_Receipt.pdf", jurisdictions: [UK], date: "Pending", sortDate: 20260217, uploadedBy: "—", status: "awaiting", type: "compliance", canView: false, canApprove: false },
  { name: "Data_Processing_Consent.pdf", jurisdictions: [ALL], date: "Jan 30, 2026", sortDate: 20260130, uploadedBy: "Michael (you)", status: "signed", type: "compliance", canView: false, canApprove: false },
];

interface Category {
  id: DocType;
  icon: string;
  label: string;
  defaultOpen: boolean;
}

const CATEGORIES: Category[] = [
  { id: "tax_report", icon: "📋", label: "Tax Reports", defaultOpen: true },
  { id: "source_data", icon: "📎", label: "Source Data", defaultOpen: false },
  { id: "expert_comms", icon: "📑", label: "Expert Communications", defaultOpen: false },
  { id: "compliance", icon: "🔒", label: "Compliance Records", defaultOpen: false },
];

const STATUS_CONFIG: Record<DocStatus, { label: string; class: string }> = {
  final: { label: "Final", class: "bg-teal/10 text-teal border-teal/30" },
  pending_approval: { label: "Pending approval", class: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  draft: { label: "Draft", class: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  in_progress: { label: "In progress", class: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  processed: { label: "Processed", class: "bg-teal/10 text-teal border-teal/30" },
  under_review: { label: "Under review", class: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  reviewed: { label: "Reviewed", class: "bg-teal/10 text-teal border-teal/30" },
  archived: { label: "Archived", class: "bg-gray-700/50 text-gray-400 border-gray-600" },
  signed: { label: "Signed", class: "bg-teal/10 text-teal border-teal/30" },
  awaiting: { label: "Awaiting submission", class: "bg-gray-700/50 text-gray-400 border-gray-600" },
};

const TYPE_FILTER_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "tax_report", label: "Tax Reports" },
  { value: "expert_comms", label: "Expert Uploads" },
  { value: "source_data", label: "Your Uploads" },
  { value: "compliance", label: "System Generated" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "jurisdiction", label: "By jurisdiction" },
];

/* ═══════════════════════ HELPERS ═══════════════════════ */

function countByJurisdiction(docs: Document[], code: string): number {
  if (code === "all") return docs.length;
  return docs.filter((d) =>
    d.jurisdictions.some((j) => j.code === code || j.code === "ALL")
  ).length;
}

/* ═══════════════════════ PAGE ═══════════════════════ */

export default function DocumentsPage() {
  const [search, setSearch] = useState("");
  const [jurisdictionFilter, setJurisdictionFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    () => {
      const initial: Record<string, boolean> = {};
      CATEGORIES.forEach((c) => (initial[c.id] = c.defaultOpen));
      return initial;
    }
  );

  function toggleCategory(id: string) {
    setOpenCategories((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const filtered = useMemo(() => {
    let docs = [...DOCUMENTS];

    // Search
    if (search) {
      const q = search.toLowerCase();
      docs = docs.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.uploadedBy.toLowerCase().includes(q)
      );
    }

    // Jurisdiction
    if (jurisdictionFilter !== "all") {
      docs = docs.filter((d) =>
        d.jurisdictions.some(
          (j) => j.code === jurisdictionFilter || j.code === "ALL"
        )
      );
    }

    // Type
    if (typeFilter !== "all") {
      docs = docs.filter((d) => d.type === typeFilter);
    }

    // Sort
    if (sort === "newest") docs.sort((a, b) => b.sortDate - a.sortDate);
    else if (sort === "oldest") docs.sort((a, b) => a.sortDate - b.sortDate);
    else if (sort === "jurisdiction")
      docs.sort((a, b) =>
        a.jurisdictions[0].label.localeCompare(b.jurisdictions[0].label)
      );

    return docs;
  }, [search, jurisdictionFilter, typeFilter, sort]);

  const jurisdictionPills = [
    { code: "all", label: "All", flag: "" },
    { code: "GB", label: "UK", flag: "🇬🇧" },
    { code: "FR", label: "France", flag: "🇫🇷" },
    { code: "PT", label: "Portugal", flag: "🇵🇹" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-gray-400 mt-1">
            All files across your jurisdictions, organized and secure
          </p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-teal text-navy font-semibold rounded-lg hover:bg-teal-light transition-colors text-sm self-start sm:self-auto">
          <span>&#128206;</span> Upload Document
        </button>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3 mb-6">
        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="w-full bg-navy-light border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal/50 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Jurisdiction pills */}
          <div className="flex gap-1.5">
            {jurisdictionPills.map((p) => {
              const count = countByJurisdiction(DOCUMENTS, p.code);
              const active = jurisdictionFilter === p.code;
              return (
                <button
                  key={p.code}
                  onClick={() => setJurisdictionFilter(p.code)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    active
                      ? "bg-teal/10 border-teal/30 text-teal"
                      : "border-gray-700 text-gray-400 hover:border-gray-600"
                  }`}
                >
                  {p.flag && <span>{p.flag}</span>}
                  <span>{p.label}</span>
                  <span
                    className={`ml-0.5 ${active ? "text-teal/60" : "text-gray-600"}`}
                  >
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>

          <div className="h-5 w-px bg-gray-700 hidden sm:block" />

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-navy-light border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-teal/50 transition-colors appearance-none cursor-pointer pr-7"
          >
            {TYPE_FILTER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-navy-light border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-teal/50 transition-colors appearance-none cursor-pointer pr-7"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Document Categories */}
      <div className="space-y-4">
        {CATEGORIES.map((cat) => {
          const catDocs = filtered.filter((d) => d.type === cat.id);
          if (catDocs.length === 0 && (search || typeFilter !== "all" || jurisdictionFilter !== "all")) return null;

          const isOpen = openCategories[cat.id];

          return (
            <div
              key={cat.id}
              className="bg-navy-light border border-gray-700 rounded-xl overflow-hidden"
            >
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(cat.id)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{cat.icon}</span>
                  <h3 className="font-semibold text-sm sm:text-base">
                    {cat.label}
                  </h3>
                  <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
                    {catDocs.length}
                  </span>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isOpen && catDocs.length > 0 && (
                <>
                  {/* Desktop table header */}
                  <div className="hidden md:grid grid-cols-[1fr_120px_100px_160px_130px_100px] gap-2 px-5 py-2 border-t border-gray-700/50 text-xs text-gray-500 uppercase tracking-wider">
                    <span>Document</span>
                    <span>Jurisdiction</span>
                    <span>Date</span>
                    <span>Uploaded By</span>
                    <span>Status</span>
                    <span className="text-right">Actions</span>
                  </div>

                  {/* Rows */}
                  <div className="border-t border-gray-700/50">
                    {catDocs.map((doc, i) => {
                      const statusCfg = STATUS_CONFIG[doc.status];
                      const isPendingApproval = doc.status === "pending_approval";

                      return (
                        <div
                          key={i}
                          className={`group border-b border-gray-700/30 last:border-b-0 hover:bg-white/[0.02] transition-colors ${
                            isPendingApproval ? "bg-amber-500/[0.03]" : ""
                          }`}
                        >
                          {/* Desktop */}
                          <div className="hidden md:grid grid-cols-[1fr_120px_100px_160px_130px_100px] gap-2 items-center px-5 py-3">
                            {/* Name */}
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-sm flex-shrink-0">
                                {doc.name.endsWith(".csv") || doc.name.endsWith(".json")
                                  ? "📊"
                                  : "📄"}
                              </span>
                              <span className="text-sm text-gray-200 truncate group-hover:text-white transition-colors">
                                {doc.name}
                              </span>
                            </div>

                            {/* Jurisdiction */}
                            <div className="flex items-center gap-1">
                              {doc.jurisdictions.map((j, ji) => (
                                <span key={ji} className="text-sm">
                                  {j.flag}
                                </span>
                              ))}
                              <span className="text-xs text-gray-400">
                                {doc.jurisdictions.map((j) => j.label).join(" + ")}
                              </span>
                            </div>

                            {/* Date */}
                            <span className="text-xs text-gray-500">
                              {doc.date}
                            </span>

                            {/* Uploaded by */}
                            <span className="text-xs text-gray-400 truncate">
                              {doc.uploadedBy}
                            </span>

                            {/* Status */}
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border w-fit ${statusCfg.class}`}
                            >
                              {statusCfg.label}
                            </span>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-1">
                              {doc.status !== "awaiting" && (
                                <button className="p-1.5 text-gray-500 hover:text-teal transition-colors" title="Download">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                </button>
                              )}
                              {doc.canView && (
                                <button className="p-1.5 text-gray-500 hover:text-teal transition-colors" title="View">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </button>
                              )}
                              {doc.canApprove && (
                                <button className="p-1.5 text-amber-400 hover:text-amber-300 transition-colors" title="Approve">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Mobile card */}
                          <div className="md:hidden px-5 py-3.5">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-sm flex-shrink-0">
                                  {doc.name.endsWith(".csv") || doc.name.endsWith(".json")
                                    ? "📊"
                                    : "📄"}
                                </span>
                                <span className="text-sm text-gray-200 truncate font-medium">
                                  {doc.name}
                                </span>
                              </div>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border flex-shrink-0 ${statusCfg.class}`}
                              >
                                {statusCfg.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500 mb-2.5">
                              <span className="flex items-center gap-1">
                                {doc.jurisdictions.map((j, ji) => (
                                  <span key={ji}>{j.flag}</span>
                                ))}
                                {doc.jurisdictions.map((j) => j.label).join(" + ")}
                              </span>
                              <span>&middot;</span>
                              <span>{doc.date}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500 truncate">
                                {doc.uploadedBy}
                              </span>
                              <div className="flex items-center gap-1">
                                {doc.status !== "awaiting" && (
                                  <button className="p-1 text-gray-500 hover:text-teal transition-colors">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                  </button>
                                )}
                                {doc.canView && (
                                  <button className="p-1 text-gray-500 hover:text-teal transition-colors">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  </button>
                                )}
                                {doc.canApprove && (
                                  <button className="p-1 text-amber-400 hover:text-amber-300 transition-colors">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {isOpen && catDocs.length === 0 && (
                <div className="px-5 py-6 border-t border-gray-700/50 text-center">
                  <p className="text-sm text-gray-500">
                    No documents match your filters
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Section */}
      <div className="mt-8 space-y-4">
        {/* Storage */}
        <div className="bg-navy-light border border-gray-700 rounded-xl p-5">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-400">Storage used</span>
            <span className="text-gray-300">
              <span className="text-white font-medium">24.3 MB</span> of 1 GB
              included
            </span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal rounded-full"
              style={{ width: "2.4%" }}
            />
          </div>
        </div>

        {/* Security */}
        <div className="flex items-start gap-3 px-5 py-4 bg-navy-light border border-gray-700 rounded-xl">
          <svg
            className="w-5 h-5 text-teal flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <p className="text-xs text-gray-500 leading-relaxed">
            All documents are encrypted at rest and in transit. Files are stored
            in EU data centers in compliance with GDPR. Only you and your
            assigned experts can access your documents.
          </p>
        </div>
      </div>
    </div>
  );
}
