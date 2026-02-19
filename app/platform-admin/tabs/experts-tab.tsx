"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import type { Expert } from "@/lib/types/expert";

/* ====================== TYPES ====================== */

interface ClientAssignment {
  id: string;
  client_id: string;
  status: string;
  jurisdiction: string;
  client: {
    id: string;
    full_name: string;
    email: string;
    overall_status: string;
  } | null;
}

/* ====================== HELPERS ====================== */

function renderStars(rating: number | null): string {
  if (!rating) return "\u2014";
  return `${rating.toFixed(1)} \u2605`;
}

function formatCurrency(amount: number): string {
  return "$" + amount.toLocaleString();
}

function statusBadgeClasses(status: string): string {
  switch (status) {
    case "active":
      return "bg-green-500/10 text-green-400 border border-green-500/30";
    case "pending":
      return "bg-amber-500/10 text-amber-400 border border-amber-500/30";
    case "inactive":
      return "bg-gray-500/10 text-gray-400 border border-gray-600";
    default:
      return "bg-gray-500/10 text-gray-400 border border-gray-600";
  }
}

/* ====================== SKELETON ====================== */

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-gray-700/50 rounded animate-pulse ${className}`} />
  );
}

/* ====================== MAIN COMPONENT ====================== */

export default function ExpertsTab() {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [clientCounts, setClientCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailClients, setDetailClients] = useState<ClientAssignment[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchExperts();
  }, []);

  async function fetchExperts() {
    setLoading(true);
    try {
      const supabase = createClient();

      // Fetch all experts
      const { data: expertsData } = await supabase
        .from("experts")
        .select("*")
        .order("created_at", { ascending: false });

      // Fetch client counts per expert
      const { data: clientExpertsData } = await supabase
        .from("client_experts")
        .select("expert_id");

      setExperts((expertsData as Expert[]) || []);

      // Count clients per expert
      const counts: Record<string, number> = {};
      if (clientExpertsData) {
        for (const row of clientExpertsData) {
          counts[row.expert_id] = (counts[row.expert_id] || 0) + 1;
        }
      }
      setClientCounts(counts);
    } catch (err) {
      console.error("Failed to fetch experts:", err);
      setExperts([]);
      setClientCounts({});
    } finally {
      setLoading(false);
    }
  }

  async function fetchExpertClients(expertId: string) {
    setDetailLoading(true);
    setDetailClients([]);

    const supabase = createClient();

    const { data: clientAssignments } = await supabase
      .from("client_experts")
      .select(
        "id, client_id, status, jurisdiction, client:clients(id, full_name, email, overall_status)"
      )
      .eq("expert_id", expertId);

    setDetailClients(
      (clientAssignments as unknown as ClientAssignment[]) || []
    );
    setDetailLoading(false);
  }

  function handleRowClick(expertId: string) {
    if (expandedId === expertId) {
      setExpandedId(null);
    } else {
      setExpandedId(expertId);
      fetchExpertClients(expertId);
    }
  }

  /* ====================== LOADING STATE ====================== */

  if (loading) {
    return (
      <div className="bg-navy-light border border-gray-700 rounded-xl overflow-hidden">
        {/* Header skeleton */}
        <div className="bg-navy-dark/50 px-6 py-3 flex gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-20" />
          ))}
        </div>
        {/* Row skeletons */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-6 px-6 py-4 border-t border-gray-700/50"
          >
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    );
  }

  /* ====================== EMPTY STATE ====================== */

  if (experts.length === 0) {
    return (
      <div className="bg-navy-light border border-gray-700 rounded-xl p-16 text-center">
        <svg
          className="w-12 h-12 text-gray-600 mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"
          />
        </svg>
        <p className="text-gray-400 text-sm">No experts registered yet</p>
      </div>
    );
  }

  /* ====================== TABLE ====================== */

  return (
    <div className="bg-navy-light border border-gray-700 rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-navy-dark/50">
            <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">
              Name
            </th>
            <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">
              Company
            </th>
            <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">
              Email
            </th>
            <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">
              Jurisdictions
            </th>
            <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">
              Client Count
            </th>
            <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">
              Rating
            </th>
            <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">
              Total Earned
            </th>
            <th className="text-left px-6 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {experts.map((expert) => (
            <ExpertRow
              key={expert.id}
              expert={expert}
              clientCount={clientCounts[expert.id] || 0}
              isExpanded={expandedId === expert.id}
              onToggle={() => handleRowClick(expert.id)}
              detailClients={detailClients}
              detailLoading={detailLoading}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ====================== EXPERT ROW ====================== */

interface ExpertRowProps {
  expert: Expert;
  clientCount: number;
  isExpanded: boolean;
  onToggle: () => void;
  detailClients: ClientAssignment[];
  detailLoading: boolean;
}

function ExpertRow({
  expert,
  clientCount,
  isExpanded,
  onToggle,
  detailClients,
  detailLoading,
}: ExpertRowProps) {
  return (
    <>
      {/* Main row */}
      <tr
        onClick={onToggle}
        className={`border-t border-gray-700/50 hover:bg-white/5 cursor-pointer transition-colors ${
          isExpanded ? "bg-white/5" : ""
        }`}
      >
        {/* Name */}
        <td className="px-6 py-4">
          <span className="text-sm font-semibold text-white">
            {expert.full_name}
          </span>
        </td>

        {/* Company */}
        <td className="px-6 py-4">
          <span className="text-sm text-gray-400">
            {expert.company_name || "\u2014"}
          </span>
        </td>

        {/* Email */}
        <td className="px-6 py-4">
          <span className="text-sm text-gray-400">{expert.email}</span>
        </td>

        {/* Jurisdictions */}
        <td className="px-6 py-4">
          {expert.jurisdictions && expert.jurisdictions.length > 0 ? (
            <span className="text-sm text-gray-300">
              {expert.jurisdictions.join(", ")}
            </span>
          ) : (
            <span className="text-sm text-gray-500">{"\u2014"}</span>
          )}
        </td>

        {/* Client Count */}
        <td className="px-6 py-4">
          <span className="text-sm text-white">{clientCount}</span>
        </td>

        {/* Rating */}
        <td className="px-6 py-4">
          <span className="text-sm text-amber-400">
            {renderStars(expert.rating)}
          </span>
        </td>

        {/* Total Earned */}
        <td className="px-6 py-4">
          <span className="text-sm text-white font-medium">
            {expert.total_earned != null
              ? formatCurrency(expert.total_earned)
              : "\u2014"}
          </span>
        </td>

        {/* Status */}
        <td className="px-6 py-4">
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadgeClasses(
              expert.status
            )}`}
          >
            {expert.status}
          </span>
        </td>
      </tr>

      {/* Expanded detail panel */}
      {isExpanded && (
        <tr>
          <td colSpan={8} className="p-0">
            <div className="bg-white/5 border-t border-gray-700/50 px-6 py-5">
              {detailLoading ? (
                <div className="flex items-center gap-3 py-4">
                  <div className="w-4 h-4 border-2 border-[#7C3AED]/30 border-t-[#7C3AED] rounded-full animate-spin" />
                  <span className="text-sm text-gray-400">
                    Loading expert details...
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Column 1: Expert details */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Expert Details
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Phone */}
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Phone</p>
                        <p className="text-sm text-gray-300">
                          {expert.phone || "\u2014"}
                        </p>
                      </div>

                      {/* Professional Title */}
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          Professional Title
                        </p>
                        <p className="text-sm text-gray-300">
                          {expert.professional_title || "\u2014"}
                        </p>
                      </div>

                      {/* License Number */}
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          License Number
                        </p>
                        <p className="text-sm text-gray-300">
                          {expert.license_number || "\u2014"}
                        </p>
                      </div>

                      {/* Max Clients */}
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          Max Clients
                        </p>
                        <p className="text-sm text-gray-300">
                          {expert.max_clients != null
                            ? expert.max_clients
                            : "\u2014"}
                        </p>
                      </div>

                      {/* Languages */}
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500 mb-1">Languages</p>
                        {expert.languages && expert.languages.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {expert.languages.map((lang) => (
                              <span
                                key={lang}
                                className="px-2 py-0.5 rounded text-xs bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/20"
                              >
                                {lang}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">{"\u2014"}</p>
                        )}
                      </div>

                      {/* Specializations */}
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500 mb-1">
                          Specializations
                        </p>
                        {expert.specializations &&
                        expert.specializations.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {expert.specializations.map((spec) => (
                              <span
                                key={spec}
                                className="px-2 py-0.5 rounded text-xs bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/20"
                              >
                                {spec}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">{"\u2014"}</p>
                        )}
                      </div>
                    </div>

                    {/* Bio */}
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Bio</p>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        {expert.bio || "\u2014"}
                      </p>
                    </div>
                  </div>

                  {/* Column 2: Assigned clients */}
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Assigned Clients ({detailClients.length})
                    </h3>
                    {detailClients.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        No clients assigned
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {detailClients.map((assignment) => (
                          <div
                            key={assignment.id}
                            className="flex items-center justify-between bg-navy-dark/50 rounded-lg px-3 py-2"
                          >
                            <div className="min-w-0">
                              <p className="text-sm text-white truncate">
                                {assignment.client?.full_name || "Unknown"}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {assignment.client?.email || ""}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              {assignment.jurisdiction && (
                                <span className="text-xs text-gray-400">
                                  {assignment.jurisdiction}
                                </span>
                              )}
                              <span
                                className={`px-1.5 py-0.5 rounded text-xs capitalize ${
                                  assignment.status === "active"
                                    ? "bg-green-500/10 text-green-400"
                                    : "bg-gray-500/10 text-gray-400"
                                }`}
                              >
                                {assignment.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
