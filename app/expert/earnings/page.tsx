"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import { useExpert } from "@/lib/context/expert-auth-context";
import type { Invoice, Client } from "@/lib/types/expert";

/* ═══════════════════════ HELPERS ═══════════════════════ */

function formatCurrency(amount: number, currency = "GBP"): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  draft: {
    label: "Draft",
    class: "bg-gray-700/50 text-gray-400 border-gray-600",
  },
  sent: {
    label: "Sent",
    class: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  },
  overdue: {
    label: "Overdue",
    class: "bg-red-500/10 text-red-400 border-red-500/30",
  },
  paid: {
    label: "Paid",
    class: "bg-teal/10 text-teal border-teal/30",
  },
};

type InvoiceWithClient = Invoice & { client?: Pick<Client, "full_name"> };

/* ═══════════════════════ PAGE ═══════════════════════ */

export default function ExpertEarningsPage() {
  const supabase = createClient();
  const { expert, loading: authLoading } = useExpert();

  const [invoices, setInvoices] = useState<InvoiceWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  // Fetch invoices for this expert
  useEffect(() => {
    if (authLoading || !expert) return;

    let cancelled = false;

    async function fetchData() {
      try {
        const { data, error: fetchError } = await supabase
          .from("invoices")
          .select("*, client:clients(full_name)")
          .eq("expert_id", expert!.id)
          .order("created_at", { ascending: false });

        if (!cancelled) {
          if (fetchError) {
            setError(fetchError.message);
          } else {
            setInvoices((data as InvoiceWithClient[]) ?? []);
          }
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load earnings"
          );
          setLoading(false);
        }
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, expert?.id]);

  // Compute summary stats
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    let thisMonthTotal = 0;
    let lastMonthTotal = 0;
    let totalPaid = 0;
    let pendingTotal = 0;

    invoices.forEach((inv) => {
      if (inv.status === "paid" && inv.paid_at) {
        const d = new Date(inv.paid_at);
        const amt = inv.paid_amount ?? inv.amount;
        totalPaid += amt;

        if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) {
          thisMonthTotal += amt;
        }
        if (d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear) {
          lastMonthTotal += amt;
        }
      } else if (inv.status === "sent" || inv.status === "overdue") {
        pendingTotal += inv.amount;
      }
    });

    return { thisMonthTotal, lastMonthTotal, totalPaid, pendingTotal };
  }, [invoices]);

  // Filter invoices
  const filtered = useMemo(() => {
    if (filter === "all") return invoices;
    return invoices.filter((inv) => inv.status === filter);
  }, [invoices, filter]);

  const pills = [
    { id: "all", label: "All" },
    { id: "paid", label: "Paid" },
    { id: "sent", label: "Sent" },
    { id: "overdue", label: "Overdue" },
    { id: "draft", label: "Draft" },
  ];

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="h-8 w-40 bg-gray-700/50 rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-gray-700/50 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl px-5 py-4 border border-gray-700 bg-navy-light"
            >
              <div className="h-3 w-20 bg-gray-700/50 rounded animate-pulse mb-2" />
              <div className="h-7 w-24 bg-gray-700/50 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="bg-navy-light border border-gray-700 rounded-xl p-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex gap-4 py-4 border-b border-gray-700/30 last:border-b-0"
            >
              <div className="h-4 w-32 bg-gray-700/50 rounded animate-pulse" />
              <div className="h-4 w-20 bg-gray-700/50 rounded animate-pulse" />
              <div className="h-4 w-16 bg-gray-700/50 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Earnings</h1>
        <p className="text-gray-400 mt-1">
          Track your income from Handy clients
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-between">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-300 text-xs ml-3"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          {
            label: "This Month",
            value: formatCurrency(stats.thisMonthTotal),
            highlight: true,
          },
          {
            label: "Last Month",
            value: formatCurrency(stats.lastMonthTotal),
            highlight: false,
          },
          {
            label: "Total Earned",
            value: formatCurrency(stats.totalPaid),
            highlight: true,
          },
          {
            label: "Pending",
            value: formatCurrency(stats.pendingTotal),
            highlight: false,
          },
        ].map((card) => (
          <div
            key={card.label}
            className={`rounded-xl px-5 py-4 border ${
              card.highlight
                ? "bg-gold/5 border-gold/20"
                : "bg-navy-light border-gray-700"
            }`}
          >
            <p className="text-xs text-gray-500 mb-1">{card.label}</p>
            <p
              className={`text-2xl font-bold ${card.highlight ? "text-gold" : "text-white"}`}
            >
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filter pills */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto">
        {pills.map((p) => (
          <button
            key={p.id}
            onClick={() => setFilter(p.id)}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors border ${
              filter === p.id
                ? "bg-gold/10 border-gold/30 text-gold"
                : "border-gray-700 text-gray-400 hover:border-gray-600"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {invoices.length === 0 && !error ? (
        <div className="bg-navy-light border border-gray-700 rounded-xl p-12 text-center">
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
              d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
            />
          </svg>
          <p className="text-gray-400 mb-1">No earnings yet</p>
          <p className="text-sm text-gray-500">
            Your invoices and payments will appear here once you start billing
            clients.
          </p>
        </div>
      ) : (
        /* Earnings Table */
        <div className="bg-navy-light border border-gray-700 rounded-xl overflow-hidden">
          {/* Desktop Header */}
          <div className="hidden md:grid grid-cols-[1fr_120px_90px_100px_120px_120px] gap-3 px-5 py-3 border-b border-gray-700/50 text-xs text-gray-500 uppercase tracking-wider">
            <span>Client</span>
            <span>Invoice #</span>
            <span>Amount</span>
            <span>Status</span>
            <span>Issued</span>
            <span>Paid</span>
          </div>

          {filtered.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-500 text-sm">
              No invoices match this filter.
            </div>
          ) : (
            filtered.map((inv) => {
              const cfg = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.draft;
              const clientName =
                (inv.client as unknown as { full_name: string })?.full_name ??
                "Unknown client";

              return (
                <div
                  key={inv.id}
                  className="border-b border-gray-700/30 last:border-b-0 hover:bg-white/[0.02] transition-colors"
                >
                  {/* Desktop */}
                  <div className="hidden md:grid grid-cols-[1fr_120px_90px_100px_120px_120px] gap-3 items-center px-5 py-4">
                    <span className="text-sm text-gray-200 font-medium truncate">
                      {clientName}
                    </span>
                    <span className="text-sm text-gray-400 font-mono">
                      {inv.invoice_number}
                    </span>
                    <span className="text-sm font-semibold text-gold">
                      {formatCurrency(inv.amount, inv.currency)}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border w-fit ${cfg.class}`}
                    >
                      {cfg.label}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(inv.created_at)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {inv.paid_at ? formatDate(inv.paid_at) : "—"}
                    </span>
                  </div>

                  {/* Mobile */}
                  <div className="md:hidden px-5 py-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="text-sm text-gray-200 font-medium">
                          {clientName}
                        </p>
                        <p className="text-xs text-gray-500 font-mono">
                          {inv.invoice_number}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-gold flex-shrink-0">
                        {formatCurrency(inv.amount, inv.currency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${cfg.class}`}
                      >
                        {cfg.label}
                      </span>
                      <span className="text-xs text-gray-500">
                        {inv.paid_at
                          ? `Paid ${formatDate(inv.paid_at)}`
                          : formatDate(inv.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
