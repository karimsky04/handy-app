"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useExpert } from "@/lib/context/expert-auth-context";

interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  status: string;
  created_at: string;
}

interface TableCount {
  name: string;
  count: number;
}

const CURRENCIES = ["EUR", "GBP", "USD", "AUD", "CAD"];

const DB_TABLES = [
  "clients",
  "experts",
  "tasks",
  "invoices",
  "documents",
  "messages",
  "internal_notes",
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Icons ────────────────────────────────────────────────────────────────────

function DatabaseIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
      />
    </svg>
  );
}

function InfoIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
      />
    </svg>
  );
}

function ShieldIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
      />
    </svg>
  );
}

function ExclamationIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
      />
    </svg>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function PlatformAdminSettingsPage() {
  const { expert, loading: authLoading } = useExpert();
  const supabase = createClient();

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [tableCounts, setTableCounts] = useState<TableCount[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState("EUR");
  const [editingCurrency, setEditingCurrency] = useState(false);

  // Fetch admin users
  useEffect(() => {
    async function fetchAdmins() {
      setLoadingAdmins(true);
      const { data, error } = await supabase
        .from("experts")
        .select("id, full_name, email, status, created_at")
        .eq("role", "admin")
        .order("created_at", { ascending: true });

      if (!error && data) {
        setAdmins(data as AdminUser[]);
      }
      setLoadingAdmins(false);
    }

    fetchAdmins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch table counts
  useEffect(() => {
    async function fetchCounts() {
      setLoadingCounts(true);
      const counts: TableCount[] = [];

      for (const table of DB_TABLES) {
        const { count, error } = await supabase
          .from(table)
          .select("*", { count: "exact", head: true });

        counts.push({
          name: table,
          count: error ? 0 : (count ?? 0),
        });
      }

      setTableCounts(counts);
      setLoadingCounts(false);
    }

    fetchCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen bg-navy">
        <div className="w-6 h-6 border-2 border-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy p-6 lg:p-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Platform Settings</h1>
        <p className="text-sm text-gray-400 mt-1">
          Manage your platform configuration and preferences
        </p>
      </div>

      <div className="max-w-4xl">
        {/* ── Platform Information ─────────────────────────────────────── */}
        <div className="bg-navy-light border border-gray-700 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <InfoIcon className="w-5 h-5 text-purple-light" />
            <h2 className="text-lg font-semibold text-white">
              Platform Information
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400 mb-1">Platform Name</p>
              <p className="text-sm text-white font-medium">
                Handy<span className="text-teal">.</span>
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Platform URL</p>
              <p className="text-sm text-white font-medium">app.handytax.io</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Version</p>
              <p className="text-sm text-white font-medium">1.0.0</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Environment</p>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Production
              </span>
            </div>
          </div>
        </div>

        {/* ── Default Settings ────────────────────────────────────────── */}
        <div className="bg-navy-light border border-gray-700 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Default Settings
          </h2>

          <div className="space-y-5">
            {/* Default Currency */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-400 mb-1">Default Currency</p>
                {editingCurrency ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedCurrency}
                      onChange={(e) => setSelectedCurrency(e.target.value)}
                      className="bg-navy border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple/50 transition-colors"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => setEditingCurrency(false)}
                      className="px-3 py-1.5 rounded-lg bg-purple text-white font-semibold text-xs hover:bg-purple-dark transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingCurrency(false)}
                      className="px-3 py-1.5 rounded-lg text-gray-400 text-xs hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-white font-medium">
                      {selectedCurrency}
                    </p>
                    <button
                      onClick={() => setEditingCurrency(true)}
                      className="text-xs text-purple-light hover:text-purple transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Commission / Platform Fee */}
            <div>
              <p className="text-sm text-gray-400 mb-1">
                Commission / Platform Fee
              </p>
              <div className="flex items-center gap-2">
                <p className="text-sm text-white font-medium">0%</p>
                <span className="text-xs text-gray-500 italic">
                  Marketplace fee — coming soon
                </span>
              </div>
            </div>

            {/* Default Token Expiry */}
            <div>
              <p className="text-sm text-gray-400 mb-1">
                Default Token Expiry
              </p>
              <p className="text-sm text-white font-medium">30 days</p>
            </div>
          </div>
        </div>

        {/* ── Admin Users ─────────────────────────────────────────────── */}
        <div className="bg-navy-light border border-gray-700 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldIcon className="w-5 h-5 text-purple-light" />
              <h2 className="text-lg font-semibold text-white">Admin Users</h2>
            </div>
            <div className="relative group">
              <button
                disabled
                className="px-4 py-2 rounded-lg bg-purple text-white font-semibold text-sm opacity-50 cursor-not-allowed"
              >
                Add Admin
              </button>
              <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-gray-800 text-xs text-gray-300 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                Coming soon
              </div>
            </div>
          </div>

          {loadingAdmins ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-700 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-32 bg-gray-700 rounded animate-pulse" />
                    <div className="h-3 w-48 bg-gray-700 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : admins.length === 0 ? (
            <p className="text-sm text-gray-500">No admin users found.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700/50">
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">
                        Name
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">
                        Email
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 pr-4">
                        Status
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">
                        Added
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/30">
                    {admins.map((admin) => (
                      <tr key={admin.id}>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-purple/20 border border-purple/30 flex items-center justify-center text-purple-light text-xs font-bold shrink-0">
                              {getInitials(admin.full_name)}
                            </div>
                            <span className="text-sm text-white font-medium">
                              {admin.full_name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-sm text-gray-400">
                            {admin.email}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              admin.status === "active"
                                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                admin.status === "active"
                                  ? "bg-green-400"
                                  : "bg-gray-400"
                              }`}
                            />
                            {admin.status.charAt(0).toUpperCase() +
                              admin.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className="text-sm text-gray-400">
                            {formatDate(admin.created_at)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {admins.length === 1 && (
                <div className="mt-4 flex items-center gap-2 px-3 py-2.5 bg-purple/5 border border-purple/15 rounded-lg">
                  <InfoIcon className="w-4 h-4 text-purple-light shrink-0" />
                  <p className="text-xs text-gray-400">
                    You are the only platform administrator
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Database Health ──────────────────────────────────────────── */}
        <div className="bg-navy-light border border-gray-700 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <DatabaseIcon className="w-5 h-5 text-purple-light" />
            <h2 className="text-lg font-semibold text-white">
              Database Health
            </h2>
          </div>

          {loadingCounts ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {DB_TABLES.map((t) => (
                <div
                  key={t}
                  className="bg-navy border border-gray-700/50 rounded-lg p-4"
                >
                  <div className="h-3 w-16 bg-gray-700 rounded animate-pulse mb-2" />
                  <div className="h-6 w-10 bg-gray-700 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {tableCounts.map((tc) => (
                <div
                  key={tc.name}
                  className="bg-navy border border-gray-700/50 rounded-lg p-4 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <DatabaseIcon className="w-3.5 h-3.5 text-gray-500" />
                    <p className="text-xs text-gray-400 font-medium">
                      {tc.name.replace(/_/g, " ")}
                    </p>
                  </div>
                  <p className="text-xl font-bold text-white">
                    {tc.count.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Danger Zone ──────────────────────────────────────────────── */}
        <div className="bg-navy-light border border-red-500/30 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <ExclamationIcon className="w-5 h-5 text-red-400" />
            <h2 className="text-lg font-semibold text-white">Danger Zone</h2>
          </div>

          <p className="text-sm text-gray-400 mb-5">
            These actions are irreversible. Proceed with extreme caution.
          </p>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-navy border border-gray-700/50 rounded-lg">
              <div>
                <p className="text-sm text-white font-medium">
                  Export All Data
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Download a full export of all platform data
                </p>
              </div>
              <div className="relative group">
                <button
                  disabled
                  className="px-4 py-2 rounded-lg bg-gray-700 text-white font-semibold text-sm opacity-50 cursor-not-allowed"
                >
                  Export
                </button>
                <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-gray-800 text-xs text-gray-300 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                  Coming soon
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-navy border border-gray-700/50 rounded-lg">
              <div>
                <p className="text-sm text-white font-medium">
                  Reset Demo Data
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Clear all data and restore factory defaults
                </p>
              </div>
              <div className="relative group">
                <button
                  disabled
                  className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold text-sm opacity-50 cursor-not-allowed"
                >
                  Reset
                </button>
                <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-gray-800 text-xs text-gray-300 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                  Coming soon
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
