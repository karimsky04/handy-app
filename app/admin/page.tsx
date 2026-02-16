"use client";

import { useState, useEffect, useCallback } from "react";

/* ═══════════════════════ TYPES ═══════════════════════ */

interface Lead {
  id: string;
  created_at: string;
  email: string;
  full_name: string;
  current_country: string;
  previous_countries: unknown;
  asset_types: unknown;
  crypto_exchanges_count: string | null;
  has_defi: boolean | null;
  tax_years: unknown;
  filed_before: boolean | null;
  accountant_status: string;
  complexity_score: string;
  estimated_price_range: string;
  phone: string | null;
  status: string;
}

interface CARFLead {
  id: string;
  created_at: string;
  email: string;
  country: string;
  exchanges: unknown;
  risk_factors: unknown;
  risk_level: string;
  status: string;
}

interface ExpertApplication {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  phone: string | null;
  country: string;
  professional_title: string;
  license_number: string;
  years_experience: string;
  specializations: string[];
  cross_border_experience: boolean;
  annual_clients: string | null;
  languages: string[];
  website: string | null;
  practice_description: string | null;
  referral_source: string | null;
  status: string;
}

const STATUS_OPTIONS = ["new", "contacted", "in_progress", "converted", "lost"];
const EXPERT_STATUS_OPTIONS = ["new", "under_review", "interview_scheduled", "approved", "rejected"];

const STATUS_COLORS: Record<string, string> = {
  new: "bg-teal/10 text-teal border-teal/30",
  contacted: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  in_progress: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  converted: "bg-green-500/10 text-green-400 border-green-500/30",
  lost: "bg-gray-700/50 text-gray-400 border-gray-600",
  under_review: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  interview_scheduled: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  approved: "bg-green-500/10 text-green-400 border-green-500/30",
  rejected: "bg-red-500/10 text-red-400 border-red-500/30",
};

/* ═══════════════════════ HELPERS ═══════════════════════ */

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function exportCSV(
  headers: string[],
  rows: string[][],
  filename: string
) {
  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ═══════════════════════ PAGE ═══════════════════════ */

const ADMIN_PASSWORD = "handy2026";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [carfLeads, setCARFLeads] = useState<CARFLead[]>([]);
  const [expertApps, setExpertApps] = useState<ExpertApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"onboarding" | "carf" | "experts">(
    "onboarding"
  );
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [leadsRes, carfRes, expertRes] = await Promise.all([
        fetch("/api/admin/leads"),
        fetch("/api/admin/carf-leads"),
        fetch("/api/admin/expert-applications"),
      ]);
      if (leadsRes.ok) {
        const data = await leadsRes.json();
        setLeads(data.leads || []);
      }
      if (carfRes.ok) {
        const data = await carfRes.json();
        setCARFLeads(data.leads || []);
      }
      if (expertRes.ok) {
        const data = await expertRes.json();
        setExpertApps(data.leads || []);
      }
    } catch (err) {
      console.error("Failed to fetch:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authed) fetchData();
  }, [authed, fetchData]);

  async function updateStatus(
    table: "leads" | "carf_leads" | "expert_applications",
    id: string,
    status: string
  ) {
    await fetch("/api/admin/update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table, id, status }),
    });

    if (table === "leads") {
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status } : l))
      );
    } else if (table === "carf_leads") {
      setCARFLeads((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status } : l))
      );
    } else {
      setExpertApps((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status } : l))
      );
    }
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthed(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  }

  /* ── Auth gate ── */
  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-1 text-center">Admin Access</h1>
          <p className="text-sm text-gray-400 text-center mb-6">
            Enter the admin password to continue
          </p>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError(false);
              }}
              placeholder="Password"
              className={`w-full bg-navy-light border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none transition-colors mb-3 ${
                passwordError
                  ? "border-red-500 focus:border-red-500"
                  : "border-gray-700 focus:border-teal"
              }`}
            />
            {passwordError && (
              <p className="text-sm text-red-400 mb-3">Incorrect password</p>
            )}
            <button
              type="submit"
              className="w-full py-3 bg-teal text-navy font-semibold rounded-lg hover:bg-teal-light transition-colors"
            >
              Log In
            </button>
          </form>
        </div>
      </main>
    );
  }

  /* ── Dashboard ── */
  const totalLeads = leads.length + carfLeads.length;

  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Lead Dashboard</h1>
            <p className="text-sm text-gray-400 mt-1">
              <span className="text-white font-medium">{totalLeads}</span>{" "}
              total leads &middot;{" "}
              <span className="text-white font-medium">{leads.length}</span>{" "}
              onboarding &middot;{" "}
              <span className="text-white font-medium">
                {carfLeads.length}
              </span>{" "}
              CARF &middot;{" "}
              <span className="text-white font-medium">
                {expertApps.length}
              </span>{" "}
              expert applications
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-2 text-sm border border-gray-700 rounded-lg text-gray-400 hover:text-white hover:border-gray-600 transition-colors disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-800 pb-px">
          <button
            onClick={() => setActiveTab("onboarding")}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === "onboarding"
                ? "bg-navy-light text-teal border-b-2 border-teal"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Onboarding Leads ({leads.length})
          </button>
          <button
            onClick={() => setActiveTab("carf")}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === "carf"
                ? "bg-navy-light text-teal border-b-2 border-teal"
                : "text-gray-400 hover:text-white"
            }`}
          >
            CARF Leads ({carfLeads.length})
          </button>
          <button
            onClick={() => setActiveTab("experts")}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === "experts"
                ? "bg-navy-light text-teal border-b-2 border-teal"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Expert Applications ({expertApps.length})
          </button>
        </div>

        {/* ── Onboarding Leads ── */}
        {activeTab === "onboarding" && (
          <div>
            <div className="flex justify-end mb-3">
              <button
                onClick={() =>
                  exportCSV(
                    [
                      "Date",
                      "Name",
                      "Email",
                      "Phone",
                      "Country",
                      "Complexity",
                      "Price Range",
                      "Status",
                    ],
                    leads.map((l) => [
                      formatDate(l.created_at),
                      l.full_name,
                      l.email,
                      l.phone || "",
                      l.current_country,
                      l.complexity_score,
                      l.estimated_price_range,
                      l.status,
                    ]),
                    "onboarding_leads.csv"
                  )
                }
                className="text-xs text-gray-400 hover:text-teal transition-colors"
              >
                Export CSV
              </button>
            </div>

            {leads.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <p>No onboarding leads yet</p>
                <p className="text-xs mt-1">
                  Leads will appear here once users complete the onboarding
                  wizard
                </p>
              </div>
            ) : (
              <div className="bg-navy-light border border-gray-700 rounded-xl overflow-hidden">
                {/* Header */}
                <div className="hidden md:grid grid-cols-[140px_1fr_1fr_120px_120px_120px] gap-2 px-4 py-2.5 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-700/50">
                  <span>Date</span>
                  <span>Name</span>
                  <span>Email</span>
                  <span>Countries</span>
                  <span>Complexity</span>
                  <span>Status</span>
                </div>

                {leads.map((l) => (
                  <div key={l.id} className="border-b border-gray-700/30 last:border-b-0">
                    <div
                      onClick={() =>
                        setExpandedRow(expandedRow === l.id ? null : l.id)
                      }
                      className="grid md:grid-cols-[140px_1fr_1fr_120px_120px_120px] gap-2 items-center px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
                    >
                      <span className="text-xs text-gray-500">
                        {formatDate(l.created_at)}
                      </span>
                      <span className="text-sm text-gray-200 font-medium">
                        {l.full_name}
                      </span>
                      <span className="text-sm text-gray-400">{l.email}</span>
                      <span className="text-xs text-gray-400">
                        {l.current_country}
                        {Array.isArray(l.previous_countries) &&
                          l.previous_countries.length > 0 &&
                          ` +${(l.previous_countries as unknown[]).length}`}
                      </span>
                      <span className="text-xs text-gray-300">
                        {l.complexity_score}
                      </span>
                      <select
                        value={l.status}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateStatus("leads", l.id, e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className={`text-xs px-2 py-1 rounded border appearance-none cursor-pointer bg-transparent ${STATUS_COLORS[l.status] || STATUS_COLORS.new}`}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s} className="bg-navy text-white">
                            {s.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Expanded details */}
                    {expandedRow === l.id && (
                      <div className="px-4 pb-4 grid sm:grid-cols-2 gap-3 text-xs">
                        <div className="bg-navy rounded-lg p-3 border border-gray-700/50">
                          <span className="text-gray-500 block mb-1">Phone</span>
                          <span className="text-gray-300">{l.phone || "—"}</span>
                        </div>
                        <div className="bg-navy rounded-lg p-3 border border-gray-700/50">
                          <span className="text-gray-500 block mb-1">Price Range</span>
                          <span className="text-gray-300">{l.estimated_price_range}</span>
                        </div>
                        <div className="bg-navy rounded-lg p-3 border border-gray-700/50">
                          <span className="text-gray-500 block mb-1">Asset Types</span>
                          <span className="text-gray-300">
                            {Array.isArray(l.asset_types)
                              ? (l.asset_types as string[]).join(", ")
                              : "—"}
                          </span>
                        </div>
                        <div className="bg-navy rounded-lg p-3 border border-gray-700/50">
                          <span className="text-gray-500 block mb-1">Tax Years</span>
                          <span className="text-gray-300">
                            {Array.isArray(l.tax_years)
                              ? (l.tax_years as string[]).join(", ")
                              : "—"}
                          </span>
                        </div>
                        <div className="bg-navy rounded-lg p-3 border border-gray-700/50">
                          <span className="text-gray-500 block mb-1">Exchanges Count</span>
                          <span className="text-gray-300">{l.crypto_exchanges_count || "—"}</span>
                        </div>
                        <div className="bg-navy rounded-lg p-3 border border-gray-700/50">
                          <span className="text-gray-500 block mb-1">DeFi</span>
                          <span className="text-gray-300">{l.has_defi === true ? "Yes" : l.has_defi === false ? "No" : "—"}</span>
                        </div>
                        <div className="bg-navy rounded-lg p-3 border border-gray-700/50">
                          <span className="text-gray-500 block mb-1">Filed Before</span>
                          <span className="text-gray-300">{l.filed_before === true ? "Yes" : l.filed_before === false ? "No" : "—"}</span>
                        </div>
                        <div className="bg-navy rounded-lg p-3 border border-gray-700/50">
                          <span className="text-gray-500 block mb-1">Accountant</span>
                          <span className="text-gray-300">{l.accountant_status || "—"}</span>
                        </div>
                        {Array.isArray(l.previous_countries) && (l.previous_countries as unknown[]).length > 0 && (
                          <div className="bg-navy rounded-lg p-3 border border-gray-700/50 sm:col-span-2">
                            <span className="text-gray-500 block mb-1">Previous Countries</span>
                            <span className="text-gray-300">
                              {JSON.stringify(l.previous_countries)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── CARF Leads ── */}
        {activeTab === "carf" && (
          <div>
            <div className="flex justify-end mb-3">
              <button
                onClick={() =>
                  exportCSV(
                    ["Date", "Email", "Country", "Risk Level", "Exchanges", "Status"],
                    carfLeads.map((l) => [
                      formatDate(l.created_at),
                      l.email,
                      l.country,
                      l.risk_level,
                      Array.isArray(l.exchanges) ? (l.exchanges as string[]).join(", ") : "",
                      l.status,
                    ]),
                    "carf_leads.csv"
                  )
                }
                className="text-xs text-gray-400 hover:text-teal transition-colors"
              >
                Export CSV
              </button>
            </div>

            {carfLeads.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <p>No CARF leads yet</p>
                <p className="text-xs mt-1">
                  Leads will appear here once users submit the CARF checker
                </p>
              </div>
            ) : (
              <div className="bg-navy-light border border-gray-700 rounded-xl overflow-hidden">
                <div className="hidden md:grid grid-cols-[140px_1fr_100px_100px_120px_120px] gap-2 px-4 py-2.5 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-700/50">
                  <span>Date</span>
                  <span>Email</span>
                  <span>Country</span>
                  <span>Risk Level</span>
                  <span>Exchanges</span>
                  <span>Status</span>
                </div>

                {carfLeads.map((l) => (
                  <div
                    key={l.id}
                    className="grid md:grid-cols-[140px_1fr_100px_100px_120px_120px] gap-2 items-center px-4 py-3 border-b border-gray-700/30 last:border-b-0 hover:bg-white/[0.02] transition-colors"
                  >
                    <span className="text-xs text-gray-500">
                      {formatDate(l.created_at)}
                    </span>
                    <span className="text-sm text-gray-300">{l.email}</span>
                    <span className="text-xs text-gray-400">{l.country}</span>
                    <span
                      className={`text-xs font-medium ${
                        l.risk_level === "critical"
                          ? "text-red-400"
                          : l.risk_level === "high"
                            ? "text-orange-400"
                            : l.risk_level === "medium"
                              ? "text-amber-400"
                              : "text-teal"
                      }`}
                    >
                      {l.risk_level}
                    </span>
                    <span className="text-xs text-gray-500 truncate">
                      {Array.isArray(l.exchanges) ? (l.exchanges as string[]).length : 0} selected
                    </span>
                    <select
                      value={l.status}
                      onChange={(e) =>
                        updateStatus("carf_leads", l.id, e.target.value)
                      }
                      className={`text-xs px-2 py-1 rounded border appearance-none cursor-pointer bg-transparent ${STATUS_COLORS[l.status] || STATUS_COLORS.new}`}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s} className="bg-navy text-white">
                          {s.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Expert Applications ── */}
        {activeTab === "experts" && (
          <div>
            <div className="flex justify-end mb-3">
              <button
                onClick={() =>
                  exportCSV(
                    ["Date", "Name", "Email", "Country", "Title", "Years Exp", "Specializations", "Cross-Border", "Status"],
                    expertApps.map((l) => [
                      formatDate(l.created_at),
                      l.full_name,
                      l.email,
                      l.country,
                      l.professional_title,
                      l.years_experience,
                      Array.isArray(l.specializations) ? l.specializations.join(", ") : "",
                      l.cross_border_experience ? "Yes" : "No",
                      l.status,
                    ]),
                    "expert_applications.csv"
                  )
                }
                className="text-xs text-gray-400 hover:text-teal transition-colors"
              >
                Export CSV
              </button>
            </div>

            {expertApps.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <p>No expert applications yet</p>
                <p className="text-xs mt-1">
                  Applications will appear here when tax professionals apply via /experts/join
                </p>
              </div>
            ) : (
              <div className="bg-navy-light border border-gray-700 rounded-xl overflow-hidden">
                {/* Header */}
                <div className="hidden md:grid grid-cols-[120px_1fr_1fr_80px_120px_80px_140px] gap-2 px-4 py-2.5 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-700/50">
                  <span>Date</span>
                  <span>Name</span>
                  <span>Email</span>
                  <span>Country</span>
                  <span>Title</span>
                  <span>Exp</span>
                  <span>Status</span>
                </div>

                {expertApps.map((l) => (
                  <div key={l.id} className="border-b border-gray-700/30 last:border-b-0">
                    <div
                      onClick={() =>
                        setExpandedRow(expandedRow === l.id ? null : l.id)
                      }
                      className="grid md:grid-cols-[120px_1fr_1fr_80px_120px_80px_140px] gap-2 items-center px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
                    >
                      <span className="text-xs text-gray-500">
                        {formatDate(l.created_at)}
                      </span>
                      <span className="text-sm text-gray-200 font-medium">
                        {l.full_name}
                      </span>
                      <span className="text-sm text-gray-400">{l.email}</span>
                      <span className="text-xs text-gray-400">{l.country}</span>
                      <span className="text-xs text-gray-300 truncate">
                        {l.professional_title}
                      </span>
                      <span className="text-xs text-gray-400">
                        {l.years_experience}
                      </span>
                      <select
                        value={l.status}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateStatus("expert_applications", l.id, e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className={`text-xs px-2 py-1 rounded border appearance-none cursor-pointer bg-transparent ${STATUS_COLORS[l.status] || STATUS_COLORS.new}`}
                      >
                        {EXPERT_STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s} className="bg-navy text-white">
                            {s.replace(/_/g, " ")}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Expanded details */}
                    {expandedRow === l.id && (
                      <div className="px-4 pb-4 grid sm:grid-cols-2 gap-3 text-xs">
                        <div className="bg-navy rounded-lg p-3 border border-gray-700/50">
                          <span className="text-gray-500 block mb-1">Phone</span>
                          <span className="text-gray-300">{l.phone || "—"}</span>
                        </div>
                        <div className="bg-navy rounded-lg p-3 border border-gray-700/50">
                          <span className="text-gray-500 block mb-1">License / Registration</span>
                          <span className="text-gray-300">{l.license_number}</span>
                        </div>
                        <div className="bg-navy rounded-lg p-3 border border-gray-700/50">
                          <span className="text-gray-500 block mb-1">Cross-Border Experience</span>
                          <span className="text-gray-300">{l.cross_border_experience ? "Yes" : "No"}</span>
                        </div>
                        <div className="bg-navy rounded-lg p-3 border border-gray-700/50">
                          <span className="text-gray-500 block mb-1">Annual Clients</span>
                          <span className="text-gray-300">{l.annual_clients || "—"}</span>
                        </div>
                        <div className="bg-navy rounded-lg p-3 border border-gray-700/50">
                          <span className="text-gray-500 block mb-1">Specializations</span>
                          <span className="text-gray-300">
                            {Array.isArray(l.specializations) && l.specializations.length > 0
                              ? l.specializations.join(", ")
                              : "—"}
                          </span>
                        </div>
                        <div className="bg-navy rounded-lg p-3 border border-gray-700/50">
                          <span className="text-gray-500 block mb-1">Languages</span>
                          <span className="text-gray-300">
                            {Array.isArray(l.languages) && l.languages.length > 0
                              ? l.languages.join(", ")
                              : "—"}
                          </span>
                        </div>
                        {l.website && (
                          <div className="bg-navy rounded-lg p-3 border border-gray-700/50">
                            <span className="text-gray-500 block mb-1">Website / LinkedIn</span>
                            <span className="text-gray-300 break-all">{l.website}</span>
                          </div>
                        )}
                        {l.referral_source && (
                          <div className="bg-navy rounded-lg p-3 border border-gray-700/50">
                            <span className="text-gray-500 block mb-1">Referral Source</span>
                            <span className="text-gray-300">{l.referral_source}</span>
                          </div>
                        )}
                        {l.practice_description && (
                          <div className="bg-navy rounded-lg p-3 border border-gray-700/50 sm:col-span-2">
                            <span className="text-gray-500 block mb-1">Practice Description</span>
                            <span className="text-gray-300">{l.practice_description}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
