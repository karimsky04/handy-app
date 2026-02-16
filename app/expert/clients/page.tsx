"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

/* ═══════════════════════ TYPES ═══════════════════════ */

interface ExpertRef {
  name: string;
  jurisdiction: string;
  flag: string;
  isYou?: boolean;
}

interface ClientCard {
  name: string;
  experts: ExpertRef[];
  status: string;
  statusColor: string;
  complexity: string;
  complexityColor: string;
  assetTypes: string;
  progress: number;
  earnings: string;
  completedDate?: string;
  category: "active" | "pending_review" | "completed";
}

/* ═══════════════════════ DATA ═══════════════════════ */

const CLIENTS: ClientCard[] = [
  {
    name: "Michael Thompson",
    experts: [
      { name: "You", jurisdiction: "UK", flag: "🇬🇧", isYou: true },
      { name: "Pierre Dubois", jurisdiction: "France", flag: "🇫🇷" },
      { name: "Ana Santos", jurisdiction: "Portugal", flag: "🇵🇹" },
    ],
    status: "In Progress — SA100 pending approval",
    statusColor: "text-amber-400",
    complexity: "Multi-Jurisdiction Complex",
    complexityColor: "text-red-400",
    assetTypes: "Crypto, Stocks, Employment, Self-Employment",
    progress: 65,
    earnings: "£1,200",
    category: "active",
  },
  {
    name: "Emma Chen",
    experts: [{ name: "You", jurisdiction: "UK", flag: "🇬🇧", isYou: true }],
    status: "In Progress — Transaction review needed",
    statusColor: "text-amber-400",
    complexity: "Complex",
    complexityColor: "text-orange-400",
    assetTypes: "Crypto (DeFi heavy), Stocks",
    progress: 35,
    earnings: "£800",
    category: "active",
  },
  {
    name: "David Park",
    experts: [
      { name: "You", jurisdiction: "UK", flag: "🇬🇧", isYou: true },
      { name: "Rachel Adams", jurisdiction: "US", flag: "🇺🇸" },
    ],
    status: "Under Review",
    statusColor: "text-blue-400",
    complexity: "Multi-Jurisdiction",
    complexityColor: "text-orange-400",
    assetTypes: "Crypto, Employment",
    progress: 80,
    earnings: "£600",
    category: "pending_review",
  },
  {
    name: "Priya Sharma",
    experts: [{ name: "You", jurisdiction: "UK", flag: "🇬🇧", isYou: true }],
    status: "Completed",
    statusColor: "text-teal",
    complexity: "Simple",
    complexityColor: "text-teal",
    assetTypes: "Crypto only",
    progress: 100,
    earnings: "£350",
    completedDate: "Feb 10, 2026",
    category: "completed",
  },
  {
    name: "Tom Williams",
    experts: [{ name: "You", jurisdiction: "UK", flag: "🇬🇧", isYou: true }],
    status: "Completed",
    statusColor: "text-teal",
    complexity: "Moderate",
    complexityColor: "text-yellow-400",
    assetTypes: "Stocks, Employment",
    progress: 100,
    earnings: "£450",
    completedDate: "Feb 5, 2026",
    category: "completed",
  },
  {
    name: "Lisa Morgan",
    experts: [{ name: "You", jurisdiction: "UK", flag: "🇬🇧", isYou: true }],
    status: "Completed",
    statusColor: "text-teal",
    complexity: "Moderate",
    complexityColor: "text-yellow-400",
    assetTypes: "Crypto (moderate)",
    progress: 100,
    earnings: "£500",
    completedDate: "Jan 28, 2026",
    category: "completed",
  },
  {
    name: "Alex Petrov",
    experts: [
      { name: "You", jurisdiction: "UK", flag: "🇬🇧", isYou: true },
      { name: "Klaus Fischer", jurisdiction: "Germany", flag: "🇩🇪" },
    ],
    status: "In Progress — Data collection",
    statusColor: "text-amber-400",
    complexity: "Multi-Jurisdiction",
    complexityColor: "text-orange-400",
    assetTypes: "Crypto, Stocks, Employment",
    progress: 20,
    earnings: "£900",
    category: "active",
  },
  {
    name: "Nina Johansson",
    experts: [{ name: "You", jurisdiction: "UK", flag: "🇬🇧", isYou: true }],
    status: "In Progress — Report generation",
    statusColor: "text-amber-400",
    complexity: "Moderate",
    complexityColor: "text-yellow-400",
    assetTypes: "Crypto, Stocks",
    progress: 55,
    earnings: "£550",
    category: "active",
  },
  {
    name: "Omar Hassan",
    experts: [{ name: "You", jurisdiction: "UK", flag: "🇬🇧", isYou: true }],
    status: "Pending Review — SA100 ready",
    statusColor: "text-blue-400",
    complexity: "Simple",
    complexityColor: "text-teal",
    assetTypes: "Crypto only",
    progress: 90,
    earnings: "£300",
    category: "pending_review",
  },
  {
    name: "Rachel Kim",
    experts: [
      { name: "You", jurisdiction: "UK", flag: "🇬🇧", isYou: true },
      { name: "Pierre Dubois", jurisdiction: "France", flag: "🇫🇷" },
    ],
    status: "In Progress — Treaty analysis",
    statusColor: "text-amber-400",
    complexity: "Multi-Jurisdiction",
    complexityColor: "text-orange-400",
    assetTypes: "Employment, Property, Stocks",
    progress: 40,
    earnings: "£700",
    category: "active",
  },
  {
    name: "Ben Taylor",
    experts: [{ name: "You", jurisdiction: "UK", flag: "🇬🇧", isYou: true }],
    status: "Completed",
    statusColor: "text-teal",
    complexity: "Simple",
    complexityColor: "text-teal",
    assetTypes: "Crypto only",
    progress: 100,
    earnings: "£300",
    completedDate: "Jan 20, 2026",
    category: "completed",
  },
  {
    name: "Yuki Tanaka",
    experts: [{ name: "You", jurisdiction: "UK", flag: "🇬🇧", isYou: true }],
    status: "Pending Review — Final checks",
    statusColor: "text-blue-400",
    complexity: "Moderate",
    complexityColor: "text-yellow-400",
    assetTypes: "Crypto, Stocks, Employment",
    progress: 85,
    earnings: "£650",
    category: "pending_review",
  },
];

/* ═══════════════════════ PAGE ═══════════════════════ */

export default function ExpertClientsPage() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const counts = useMemo(() => {
    return {
      all: CLIENTS.length,
      active: CLIENTS.filter((c) => c.category === "active").length,
      pending_review: CLIENTS.filter((c) => c.category === "pending_review")
        .length,
      completed: CLIENTS.filter((c) => c.category === "completed").length,
    };
  }, []);

  const filtered = useMemo(() => {
    let list = [...CLIENTS];
    if (filter !== "all") {
      list = list.filter((c) => c.category === filter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.assetTypes.toLowerCase().includes(q)
      );
    }
    return list;
  }, [filter, search]);

  const pills = [
    { id: "all", label: "All", count: counts.all },
    { id: "active", label: "Active", count: counts.active },
    {
      id: "pending_review",
      label: "Pending Review",
      count: counts.pending_review,
    },
    { id: "completed", label: "Completed", count: counts.completed },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <h1 className="text-3xl font-bold tracking-tight mb-6">My Clients</h1>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-1.5 overflow-x-auto">
          {pills.map((p) => (
            <button
              key={p.id}
              onClick={() => setFilter(p.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors border ${
                filter === p.id
                  ? "bg-gold/10 border-gold/30 text-gold"
                  : "border-gray-700 text-gray-400 hover:border-gray-600"
              }`}
            >
              {p.label}
              <span
                className={`text-xs ${filter === p.id ? "text-gold/60" : "text-gray-600"}`}
              >
                ({p.count})
              </span>
            </button>
          ))}
        </div>
        <div className="relative flex-1 sm:max-w-xs">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
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
            placeholder="Search clients..."
            className="w-full bg-navy-light border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold/50 transition-colors"
          />
        </div>
      </div>

      {/* Client Cards */}
      <div className="space-y-4">
        {filtered.map((client) => (
          <div
            key={client.name}
            className="bg-navy-light border border-gray-700 rounded-xl p-5 hover:border-gray-600 transition-colors"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Left */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-base">{client.name}</h3>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                      client.complexityColor === "text-red-400"
                        ? "bg-red-500/10 text-red-400 border-red-500/30"
                        : client.complexityColor === "text-orange-400"
                          ? "bg-orange-500/10 text-orange-400 border-orange-500/30"
                          : client.complexityColor === "text-yellow-400"
                            ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                            : "bg-teal/10 text-teal border-teal/30"
                    }`}
                  >
                    {client.complexity}
                  </span>
                </div>

                {/* Experts row */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {client.experts.map((exp) => (
                    <span
                      key={exp.jurisdiction}
                      className={`text-xs px-2 py-1 rounded-md border ${
                        exp.isYou
                          ? "bg-gold/10 border-gold/30 text-gold"
                          : "bg-navy border-gray-700 text-gray-400"
                      }`}
                    >
                      {exp.flag} {exp.jurisdiction}{" "}
                      {exp.isYou ? "(you)" : `(${exp.name})`}
                    </span>
                  ))}
                </div>

                <p className={`text-sm font-medium ${client.statusColor} mb-1`}>
                  {client.status}
                  {client.category === "completed" && " ✅"}
                </p>
                <p className="text-xs text-gray-500">{client.assetTypes}</p>
                {client.completedDate && (
                  <p className="text-xs text-gray-500 mt-1">
                    Completed: {client.completedDate}
                  </p>
                )}
              </div>

              {/* Right — progress, earnings, button */}
              <div className="flex items-center gap-5 flex-shrink-0">
                {/* Progress */}
                <div className="hidden sm:block w-24">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{client.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${client.progress === 100 ? "bg-teal" : "bg-gold"}`}
                      style={{ width: `${client.progress}%` }}
                    />
                  </div>
                </div>

                {/* Earnings */}
                <div className="text-right">
                  <p className="text-xs text-gray-500">Your earnings</p>
                  <p className="text-sm font-semibold text-gold">
                    {client.earnings}
                  </p>
                </div>

                {/* Button */}
                <Link
                  href="/expert/workspace"
                  className="px-4 py-2.5 rounded-lg border border-gray-700 text-sm font-medium text-gray-300 hover:border-gold/40 hover:text-gold transition-colors whitespace-nowrap"
                >
                  {client.category === "completed"
                    ? "View Summary"
                    : "Open Workspace"}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No clients match your search</p>
        </div>
      )}
    </div>
  );
}
