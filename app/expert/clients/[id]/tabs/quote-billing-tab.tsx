"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import type { Quote, Invoice } from "@/lib/types/expert";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface QuoteBillingTabProps {
  clientId: string;
  clientCountries: string[];
  expertId: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CURRENCIES = ["EUR", "GBP", "USD", "AUD", "CAD"] as const;

const PAYMENT_METHODS = [
  "Bank Transfer",
  "Stripe",
  "Revolut",
  "Coingate",
  "PayPal",
  "Crypto",
  "Other",
] as const;

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: "\u20AC",
  GBP: "\u00A3",
  USD: "$",
  AUD: "A$",
  CAD: "C$",
};

function fmtMoney(amount: number, currency: string): string {
  const sym = CURRENCY_SYMBOLS[currency] ?? currency + " ";
  return `${sym}${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Sub-components: Status badges
// ---------------------------------------------------------------------------

function QuoteStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "bg-gray-700/50 text-gray-400 border-gray-600",
    sent: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    viewed: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    accepted: "bg-teal/10 text-teal border-teal/30",
    declined: "bg-red-500/10 text-red-400 border-red-500/30",
  };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded border font-medium capitalize ${map[status] ?? map.draft}`}
    >
      {status}
    </span>
  );
}

function InvoiceStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "bg-gray-700/50 text-gray-400 border-gray-600",
    sent: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    overdue: "bg-red-500/10 text-red-400 border-red-500/30",
    paid: "bg-teal/10 text-teal border-teal/30",
  };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded border font-medium capitalize ${map[status] ?? map.draft}`}
    >
      {status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Input class constants
// ---------------------------------------------------------------------------

const INPUT =
  "bg-navy border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold/50 w-full";
const BTN_PRIMARY =
  "px-4 py-2 rounded-lg bg-gold text-navy font-semibold text-sm hover:bg-gold/90 disabled:opacity-40 disabled:cursor-not-allowed";
const BTN_SECONDARY =
  "px-4 py-2 rounded-lg border border-gray-700 text-sm text-gray-300 hover:border-gold/40 hover:text-gold disabled:opacity-40 disabled:cursor-not-allowed";

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function QuoteBillingTab({
  clientId,
  clientCountries,
  expertId,
}: QuoteBillingTabProps) {
  const supabase = createClient();

  // Data -------------------------------------------------------------------
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // UI toggles -------------------------------------------------------------
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [expandedQuoteId, setExpandedQuoteId] = useState<string | null>(null);
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);
  const [markingPaidInvoiceId, setMarkingPaidInvoiceId] = useState<string | null>(null);

  // Quote form state -------------------------------------------------------
  const [qAmount, setQAmount] = useState<number>(0);
  const [qCurrency, setQCurrency] = useState<string>("EUR");
  const [qScope, setQScope] = useState("");
  const [qJurisdictions, setQJurisdictions] = useState<string[]>([]);
  const [qTimeline, setQTimeline] = useState("");
  const [qValidUntil, setQValidUntil] = useState("");
  const [qPaymentLink, setQPaymentLink] = useState("");
  const [qSaving, setQSaving] = useState(false);

  // Invoice form state -----------------------------------------------------
  const [iNumber, setINumber] = useState("");
  const [iAmount, setIAmount] = useState<number>(0);
  const [iCurrency, setICurrency] = useState<string>("EUR");
  const [iDescription, setIDescription] = useState("");
  const [iDueDate, setIDueDate] = useState("");
  const [iPaymentMethod, setIPaymentMethod] = useState<string>("");
  const [iPaymentLink, setIPaymentLink] = useState("");
  const [iSaving, setISaving] = useState(false);

  // Mark-as-paid form state ------------------------------------------------
  const [paidDate, setPaidDate] = useState("");
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paidMethod, setPaidMethod] = useState<string>("");
  const [paidExtId, setPaidExtId] = useState("");
  const [paidSaving, setPaidSaving] = useState(false);

  // -----------------------------------------------------------------------
  // Data fetching
  // -----------------------------------------------------------------------

  const fetchData = useCallback(async () => {
    const [{ data: quoteRows }, { data: invoiceRows }] = await Promise.all([
      supabase
        .from("quotes")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false }),
      supabase
        .from("invoices")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false }),
    ]);
    setQuotes((quoteRows ?? []) as Quote[]);
    setInvoices((invoiceRows ?? []) as Invoice[]);
    setLoading(false);
  }, [clientId, supabase]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  // -----------------------------------------------------------------------
  // Auto-generate invoice number
  // -----------------------------------------------------------------------

  function generateInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const nextNum = invoices.length + 1;
    return `HT-${year}-${nextNum.toString().padStart(3, "0")}`;
  }

  // -----------------------------------------------------------------------
  // Quote form helpers
  // -----------------------------------------------------------------------

  function resetQuoteForm() {
    setQAmount(0);
    setQCurrency("EUR");
    setQScope("");
    setQJurisdictions([]);
    setQTimeline("");
    setQValidUntil("");
    setQPaymentLink("");
  }

  function toggleJurisdiction(j: string) {
    setQJurisdictions((prev) =>
      prev.includes(j) ? prev.filter((x) => x !== j) : [...prev, j]
    );
  }

  async function saveQuote(send: boolean) {
    setQSaving(true);
    const now = new Date().toISOString();
    const payload = {
      client_id: clientId,
      expert_id: expertId,
      amount: qAmount,
      currency: qCurrency,
      scope_description: qScope || null,
      jurisdictions: qJurisdictions,
      estimated_timeline: qTimeline || null,
      valid_until: qValidUntil || null,
      payment_link: qPaymentLink || null,
      status: send ? "sent" : "draft",
      sent_at: send ? now : null,
    };

    await supabase.from("quotes").insert(payload);
    resetQuoteForm();
    setShowQuoteForm(false);
    setQSaving(false);
    await fetchData();
  }

  // -----------------------------------------------------------------------
  // Quote status update
  // -----------------------------------------------------------------------

  async function updateQuoteStatus(quoteId: string, status: string) {
    await supabase.from("quotes").update({ status, updated_at: new Date().toISOString() }).eq("id", quoteId);
    await fetchData();
  }

  // -----------------------------------------------------------------------
  // Invoice form helpers
  // -----------------------------------------------------------------------

  function resetInvoiceForm() {
    setINumber("");
    setIAmount(0);
    setICurrency("EUR");
    setIDescription("");
    setIDueDate("");
    setIPaymentMethod("");
    setIPaymentLink("");
  }

  function prefillFromQuote() {
    const accepted = quotes.find((q) => q.status === "accepted");
    if (!accepted) return;
    setIAmount(accepted.amount);
    setICurrency(accepted.currency);
    setIDescription(accepted.scope_description ?? "");
    setIPaymentLink(accepted.payment_link ?? "");
    if (accepted.jurisdictions?.length) {
      setIDescription(
        `${accepted.scope_description ?? ""}\nJurisdictions: ${accepted.jurisdictions.join(", ")}`.trim()
      );
    }
  }

  async function saveInvoice(send: boolean) {
    setISaving(true);
    const now = new Date().toISOString();
    const number = iNumber || generateInvoiceNumber();
    const acceptedQuote = quotes.find((q) => q.status === "accepted");

    const payload = {
      client_id: clientId,
      expert_id: expertId,
      quote_id: acceptedQuote?.id ?? null,
      invoice_number: number,
      amount: iAmount,
      currency: iCurrency,
      description: iDescription || null,
      due_date: iDueDate || null,
      payment_method: iPaymentMethod || null,
      payment_link: iPaymentLink || null,
      status: send ? "sent" : "draft",
      sent_at: send ? now : null,
    };

    await supabase.from("invoices").insert(payload);
    resetInvoiceForm();
    setShowInvoiceForm(false);
    setISaving(false);
    await fetchData();
  }

  // -----------------------------------------------------------------------
  // Mark invoice as paid
  // -----------------------------------------------------------------------

  async function confirmPaid(invoiceId: string) {
    setPaidSaving(true);
    await supabase
      .from("invoices")
      .update({
        status: "paid",
        paid_at: paidDate || new Date().toISOString(),
        paid_amount: paidAmount,
        payment_method: paidMethod || null,
        external_payment_id: paidExtId || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoiceId);
    setPaidSaving(false);
    setMarkingPaidInvoiceId(null);
    setPaidDate("");
    setPaidAmount(0);
    setPaidMethod("");
    setPaidExtId("");
    await fetchData();
  }

  // -----------------------------------------------------------------------
  // Payment summary computations
  // -----------------------------------------------------------------------

  const totalQuoted = quotes
    .filter((q) => q.status === "accepted")
    .reduce((sum, q) => sum + q.amount, 0);
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalPaid = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + (inv.paid_amount ?? 0), 0);
  const outstanding = totalInvoiced - totalPaid;

  // Determine the dominant currency (most used across quotes + invoices)
  const currencyCounts: Record<string, number> = {};
  [...quotes, ...invoices].forEach((item) => {
    currencyCounts[item.currency] = (currencyCounts[item.currency] ?? 0) + 1;
  });
  const dominantCurrency =
    Object.entries(currencyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "EUR";

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-navy-light border border-gray-700 rounded-xl p-5 h-24 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ================================================================
          PAYMENT SUMMARY
      ================================================================ */}
      <div className="bg-navy-light border border-gray-700 rounded-xl p-5 mb-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Payment Summary
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Total Quoted</p>
            <p className="text-lg font-semibold text-white">
              {fmtMoney(totalQuoted, dominantCurrency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Total Invoiced</p>
            <p className="text-lg font-semibold text-white">
              {fmtMoney(totalInvoiced, dominantCurrency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Total Paid</p>
            <p className="text-lg font-semibold text-teal">
              {fmtMoney(totalPaid, dominantCurrency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Outstanding</p>
            <p
              className={`text-lg font-semibold ${outstanding > 0 ? "text-gold" : "text-white"}`}
            >
              {fmtMoney(outstanding, dominantCurrency)}
            </p>
          </div>
        </div>
      </div>

      {/* ================================================================
          CREATE QUOTE
      ================================================================ */}
      <div className="bg-navy-light border border-gray-700 rounded-xl p-5 mb-4">
        <button
          onClick={() => setShowQuoteForm(!showQuoteForm)}
          className="flex items-center justify-between w-full text-left"
        >
          <h3 className="text-base font-semibold text-white">New Quote</h3>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${showQuoteForm ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showQuoteForm && (
          <div className="mt-5 space-y-4">
            {/* Amount + Currency */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Amount</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  className={INPUT}
                  placeholder="0.00"
                  value={qAmount || ""}
                  onChange={(e) => setQAmount(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Currency</label>
                <select
                  className={INPUT}
                  value={qCurrency}
                  onChange={(e) => setQCurrency(e.target.value)}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Scope */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Scope</label>
              <textarea
                className={`${INPUT} min-h-[80px]`}
                placeholder="Describe the scope of work..."
                value={qScope}
                onChange={(e) => setQScope(e.target.value)}
              />
            </div>

            {/* Jurisdictions */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Jurisdictions</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {clientCountries.map((country) => (
                  <button
                    key={country}
                    type="button"
                    onClick={() => toggleJurisdiction(country)}
                    className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                      qJurisdictions.includes(country)
                        ? "bg-gold/10 text-gold border-gold/30"
                        : "bg-navy border-gray-700 text-gray-400 hover:border-gray-600"
                    }`}
                  >
                    {country}
                  </button>
                ))}
                {clientCountries.length === 0 && (
                  <p className="text-xs text-gray-500">No countries on file</p>
                )}
              </div>
            </div>

            {/* Timeline + Valid until */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Estimated Timeline</label>
                <input
                  type="text"
                  className={INPUT}
                  placeholder="e.g. 2-3 weeks"
                  value={qTimeline}
                  onChange={(e) => setQTimeline(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Valid Until</label>
                <input
                  type="date"
                  className={INPUT}
                  value={qValidUntil}
                  onChange={(e) => setQValidUntil(e.target.value)}
                />
              </div>
            </div>

            {/* Payment link */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Payment Link <span className="text-gray-600">(optional)</span>
              </label>
              <input
                type="text"
                className={INPUT}
                placeholder="https://pay.stripe.com/..."
                value={qPaymentLink}
                onChange={(e) => setQPaymentLink(e.target.value)}
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                disabled={qSaving || qAmount <= 0}
                className={BTN_SECONDARY}
                onClick={() => saveQuote(false)}
              >
                {qSaving ? "Saving..." : "Save Draft"}
              </button>
              <button
                disabled={qSaving || qAmount <= 0}
                className={BTN_PRIMARY}
                onClick={() => saveQuote(true)}
              >
                {qSaving ? "Sending..." : "Send to Client"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================
          QUOTE HISTORY
      ================================================================ */}
      <div className="bg-navy-light border border-gray-700 rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white">Quotes</h3>
          <span className="text-xs text-gray-500 bg-navy px-2 py-0.5 rounded-full">
            {quotes.length}
          </span>
        </div>

        {quotes.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No quotes yet</p>
        ) : (
          <div className="space-y-2">
            {quotes.map((q) => {
              const isExpanded = expandedQuoteId === q.id;
              return (
                <div key={q.id} className="border border-gray-700/50 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedQuoteId(isExpanded ? null : q.id)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-navy/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm font-medium text-white whitespace-nowrap">
                        {fmtMoney(q.amount, q.currency)}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {q.jurisdictions?.map((j) => (
                          <span
                            key={j}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-navy border border-gray-700 text-gray-400"
                          >
                            {j}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <QuoteStatusBadge status={q.status} />
                      <span className="text-xs text-gray-500 hidden sm:inline">
                        {fmtDate(q.created_at)}
                      </span>
                      <svg
                        className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-gray-700/50 space-y-3">
                      {q.scope_description && (
                        <div>
                          <p className="text-xs text-gray-500 mb-0.5">Scope</p>
                          <p className="text-sm text-gray-300 whitespace-pre-wrap">
                            {q.scope_description}
                          </p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {q.estimated_timeline && (
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">Timeline</p>
                            <p className="text-sm text-gray-300">{q.estimated_timeline}</p>
                          </div>
                        )}
                        {q.valid_until && (
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">Valid Until</p>
                            <p className="text-sm text-gray-300">{fmtDate(q.valid_until)}</p>
                          </div>
                        )}
                        {q.sent_at && (
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">Sent</p>
                            <p className="text-sm text-gray-300">{fmtDate(q.sent_at)}</p>
                          </div>
                        )}
                      </div>
                      {q.payment_link && (
                        <div>
                          <p className="text-xs text-gray-500 mb-0.5">Payment Link</p>
                          <a
                            href={q.payment_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-gold hover:text-gold/80 underline break-all"
                          >
                            {q.payment_link}
                          </a>
                        </div>
                      )}

                      {/* Action buttons (only for sent / viewed) */}
                      {(q.status === "sent" || q.status === "viewed") && (
                        <div className="flex items-center gap-3 pt-2">
                          <button
                            className="px-4 py-2 rounded-lg bg-teal/10 border border-teal/30 text-sm font-medium text-teal hover:bg-teal/20 transition-colors"
                            onClick={() => updateQuoteStatus(q.id, "accepted")}
                          >
                            Mark as Accepted
                          </button>
                          <button
                            className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors"
                            onClick={() => updateQuoteStatus(q.id, "declined")}
                          >
                            Mark as Declined
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================================================================
          CREATE INVOICE
      ================================================================ */}
      <div className="bg-navy-light border border-gray-700 rounded-xl p-5 mb-4">
        <button
          onClick={() => {
            if (!showInvoiceForm) {
              setINumber(generateInvoiceNumber());
            }
            setShowInvoiceForm(!showInvoiceForm);
          }}
          className="flex items-center justify-between w-full text-left"
        >
          <h3 className="text-base font-semibold text-white">New Invoice</h3>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${showInvoiceForm ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showInvoiceForm && (
          <div className="mt-5 space-y-4">
            {/* Pre-fill from quote */}
            {quotes.some((q) => q.status === "accepted") && (
              <button
                type="button"
                onClick={prefillFromQuote}
                className={`${BTN_SECONDARY} text-xs`}
              >
                Pre-fill from Accepted Quote
              </button>
            )}

            {/* Invoice number */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Invoice Number</label>
              <input
                type="text"
                className={INPUT}
                value={iNumber}
                onChange={(e) => setINumber(e.target.value)}
              />
            </div>

            {/* Amount + Currency */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Amount</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  className={INPUT}
                  placeholder="0.00"
                  value={iAmount || ""}
                  onChange={(e) => setIAmount(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Currency</label>
                <select
                  className={INPUT}
                  value={iCurrency}
                  onChange={(e) => setICurrency(e.target.value)}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Description</label>
              <textarea
                className={`${INPUT} min-h-[80px]`}
                placeholder="Invoice description..."
                value={iDescription}
                onChange={(e) => setIDescription(e.target.value)}
              />
            </div>

            {/* Due date */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Due Date</label>
              <input
                type="date"
                className={INPUT}
                value={iDueDate}
                onChange={(e) => setIDueDate(e.target.value)}
              />
            </div>

            {/* Payment method + link */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Payment Method</label>
                <select
                  className={INPUT}
                  value={iPaymentMethod}
                  onChange={(e) => setIPaymentMethod(e.target.value)}
                >
                  <option value="">Select...</option>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Payment Link</label>
                <input
                  type="text"
                  className={INPUT}
                  placeholder="https://..."
                  value={iPaymentLink}
                  onChange={(e) => setIPaymentLink(e.target.value)}
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                disabled={iSaving || iAmount <= 0}
                className={BTN_SECONDARY}
                onClick={() => saveInvoice(false)}
              >
                {iSaving ? "Saving..." : "Save Draft"}
              </button>
              <button
                disabled={iSaving || iAmount <= 0}
                className={BTN_PRIMARY}
                onClick={() => saveInvoice(true)}
              >
                {iSaving ? "Saving..." : "Mark as Sent"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================
          INVOICE HISTORY
      ================================================================ */}
      <div className="bg-navy-light border border-gray-700 rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white">Invoices</h3>
          <span className="text-xs text-gray-500 bg-navy px-2 py-0.5 rounded-full">
            {invoices.length}
          </span>
        </div>

        {invoices.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No invoices yet</p>
        ) : (
          <div className="space-y-2">
            {invoices.map((inv) => {
              const isExpanded = expandedInvoiceId === inv.id;
              const isMarkingPaid = markingPaidInvoiceId === inv.id;

              return (
                <div key={inv.id} className="border border-gray-700/50 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedInvoiceId(isExpanded ? null : inv.id)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-navy/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs text-gray-500 font-mono">
                        {inv.invoice_number}
                      </span>
                      <span className="text-sm font-medium text-white whitespace-nowrap">
                        {fmtMoney(inv.amount, inv.currency)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <InvoiceStatusBadge status={inv.status} />
                      <span className="text-xs text-gray-500 hidden sm:inline">
                        {fmtDate(inv.created_at)}
                      </span>
                      <svg
                        className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-gray-700/50 space-y-3">
                      {inv.description && (
                        <div>
                          <p className="text-xs text-gray-500 mb-0.5">Description</p>
                          <p className="text-sm text-gray-300 whitespace-pre-wrap">
                            {inv.description}
                          </p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {inv.due_date && (
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">Due Date</p>
                            <p className="text-sm text-gray-300">{fmtDate(inv.due_date)}</p>
                          </div>
                        )}
                        {inv.payment_method && (
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">Payment Method</p>
                            <p className="text-sm text-gray-300">{inv.payment_method}</p>
                          </div>
                        )}
                        {inv.sent_at && (
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">Sent</p>
                            <p className="text-sm text-gray-300">{fmtDate(inv.sent_at)}</p>
                          </div>
                        )}
                        {inv.paid_at && (
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">Paid</p>
                            <p className="text-sm text-gray-300">{fmtDate(inv.paid_at)}</p>
                          </div>
                        )}
                        {inv.paid_amount != null && inv.status === "paid" && (
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">Paid Amount</p>
                            <p className="text-sm text-teal font-medium">
                              {fmtMoney(inv.paid_amount, inv.currency)}
                            </p>
                          </div>
                        )}
                        {inv.external_payment_id && (
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">Payment ID</p>
                            <p className="text-sm text-gray-300 font-mono text-xs break-all">
                              {inv.external_payment_id}
                            </p>
                          </div>
                        )}
                      </div>
                      {inv.payment_link && (
                        <div>
                          <p className="text-xs text-gray-500 mb-0.5">Payment Link</p>
                          <a
                            href={inv.payment_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-gold hover:text-gold/80 underline break-all"
                          >
                            {inv.payment_link}
                          </a>
                        </div>
                      )}

                      {/* Mark as Paid */}
                      {inv.status === "sent" && !isMarkingPaid && (
                        <div className="pt-2">
                          <button
                            className="px-4 py-2 rounded-lg bg-teal/10 border border-teal/30 text-sm font-medium text-teal hover:bg-teal/20 transition-colors"
                            onClick={() => {
                              setMarkingPaidInvoiceId(inv.id);
                              setPaidAmount(inv.amount);
                              setPaidDate(new Date().toISOString().split("T")[0]);
                              setPaidMethod(inv.payment_method ?? "");
                              setPaidExtId("");
                            }}
                          >
                            Mark as Paid
                          </button>
                        </div>
                      )}

                      {/* Inline paid form */}
                      {isMarkingPaid && (
                        <div className="mt-3 bg-navy border border-gray-700 rounded-lg p-4 space-y-3">
                          <p className="text-sm font-semibold text-white">Confirm Payment</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">
                                Paid Date
                              </label>
                              <input
                                type="date"
                                className={INPUT}
                                value={paidDate}
                                onChange={(e) => setPaidDate(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">
                                Paid Amount
                              </label>
                              <input
                                type="number"
                                min={0}
                                step={0.01}
                                className={INPUT}
                                value={paidAmount || ""}
                                onChange={(e) =>
                                  setPaidAmount(parseFloat(e.target.value) || 0)
                                }
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">
                                Payment Method
                              </label>
                              <select
                                className={INPUT}
                                value={paidMethod}
                                onChange={(e) => setPaidMethod(e.target.value)}
                              >
                                <option value="">Select...</option>
                                {PAYMENT_METHODS.map((m) => (
                                  <option key={m} value={m}>
                                    {m}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">
                                External Payment ID{" "}
                                <span className="text-gray-600">(optional)</span>
                              </label>
                              <input
                                type="text"
                                className={INPUT}
                                placeholder="tx_abc123..."
                                value={paidExtId}
                                onChange={(e) => setPaidExtId(e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-3 pt-1">
                            <button
                              disabled={paidSaving || paidAmount <= 0}
                              className={BTN_PRIMARY}
                              onClick={() => confirmPaid(inv.id)}
                            >
                              {paidSaving ? "Saving..." : "Confirm Payment"}
                            </button>
                            <button
                              className={BTN_SECONDARY}
                              onClick={() => setMarkingPaidInvoiceId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
