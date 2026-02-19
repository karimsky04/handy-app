"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  status: string;
}

interface TableCount {
  name: string;
  count: number;
}

const DB_TABLES = [
  "clients",
  "experts",
  "tasks",
  "documents",
  "invoices",
  "messages",
  "internal_notes",
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function SettingsTab() {
  const supabase = createClient();

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [tableCounts, setTableCounts] = useState<TableCount[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [loadingCounts, setLoadingCounts] = useState(true);

  // Fetch admin users
  useEffect(() => {
    async function fetchAdmins() {
      setLoadingAdmins(true);
      const { data, error } = await supabase
        .from("experts")
        .select("id, full_name, email, created_at, status")
        .eq("role", "admin");

      if (!error && data) {
        setAdmins(data as AdminUser[]);
      }
      setLoadingAdmins(false);
    }

    fetchAdmins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch table counts in parallel
  useEffect(() => {
    async function fetchCounts() {
      setLoadingCounts(true);

      const results = await Promise.all(
        DB_TABLES.map((table) =>
          supabase.from(table).select("*", { count: "exact", head: true })
        )
      );

      const counts: TableCount[] = DB_TABLES.map((table, i) => ({
        name: table,
        count: results[i].error ? 0 : (results[i].count ?? 0),
      }));

      setTableCounts(counts);
      setLoadingCounts(false);
    }

    fetchCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      {/* ── Platform Configuration ──────────────────────────────────── */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">
          Platform Configuration
        </h2>
        <div className="bg-navy-light border border-gray-700 rounded-xl p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div>
              <p className="text-xs text-gray-500 mb-1">Platform Name</p>
              <p className="text-sm text-white font-medium">Handy</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Default Currency</p>
              <p className="text-sm text-white font-medium">GBP</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Platform Version</p>
              <p className="text-sm text-white font-medium">1.0.0</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Environment</p>
              <p className="text-sm text-white font-medium">
                {process.env.NODE_ENV || "Production"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Admin Users ────────────────────────────────────────────── */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Admin Users</h2>
        <div className="bg-navy-light border border-gray-700 rounded-xl p-5">
          {loadingAdmins ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-3 w-28 bg-gray-700 rounded animate-pulse" />
                  <div className="h-3 w-44 bg-gray-700 rounded animate-pulse" />
                  <div className="h-3 w-16 bg-gray-700 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-gray-700 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : admins.length === 0 ? (
            <p className="text-sm text-gray-500">No admin users found</p>
          ) : (
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
                        <span className="text-sm text-white font-medium">
                          {admin.full_name}
                        </span>
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
                              ? "bg-green-500/10 text-green-400 border border-green-500/30"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              admin.status === "active"
                                ? "bg-green-400"
                                : "bg-amber-400"
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
          )}
        </div>
      </div>

      {/* ── Database Stats ─────────────────────────────────────────── */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">
          Database Stats
        </h2>
        <div className="bg-navy-light border border-gray-700 rounded-xl p-5">
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
                  <p className="text-xs text-gray-500 font-medium mb-1 capitalize">
                    {tc.name.replace(/_/g, " ")}
                  </p>
                  <p className="text-xl font-bold text-white">
                    {tc.count.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
