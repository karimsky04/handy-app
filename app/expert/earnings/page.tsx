"use client";

/* ═══════════════════════ DATA ═══════════════════════ */

interface EarningRow {
  client: string;
  flag: string;
  jurisdiction: string;
  service: string;
  amount: string;
  status: "in_progress" | "pending_payment" | "paid";
  date: string;
}

const EARNINGS: EarningRow[] = [
  {
    client: "Michael Thompson",
    flag: "🇬🇧",
    jurisdiction: "UK",
    service: "Multi-asset filing (complex)",
    amount: "£1,200",
    status: "in_progress",
    date: "Started Feb 1",
  },
  {
    client: "Emma Chen",
    flag: "🇬🇧",
    jurisdiction: "UK",
    service: "Crypto + stocks filing",
    amount: "£800",
    status: "in_progress",
    date: "Started Feb 8",
  },
  {
    client: "David Park",
    flag: "🇬🇧",
    jurisdiction: "UK",
    service: "Crypto + employment",
    amount: "£600",
    status: "pending_payment",
    date: "Completed Feb 12",
  },
  {
    client: "Priya Sharma",
    flag: "🇬🇧",
    jurisdiction: "UK",
    service: "Crypto only (simple)",
    amount: "£350",
    status: "paid",
    date: "Feb 10",
  },
  {
    client: "Tom Williams",
    flag: "🇬🇧",
    jurisdiction: "UK",
    service: "Stocks + employment",
    amount: "£450",
    status: "paid",
    date: "Feb 5",
  },
  {
    client: "Lisa Morgan",
    flag: "🇬🇧",
    jurisdiction: "UK",
    service: "Crypto (moderate)",
    amount: "£500",
    status: "paid",
    date: "Jan 28",
  },
];

const STATUS_CONFIG: Record<
  EarningRow["status"],
  { label: string; icon: string; class: string }
> = {
  in_progress: {
    label: "In progress",
    icon: "🔄",
    class: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  },
  pending_payment: {
    label: "Pending payment",
    icon: "⏳",
    class: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  },
  paid: {
    label: "Paid",
    icon: "✅",
    class: "bg-teal/10 text-teal border-teal/30",
  },
};

/* ═══════════════════════ PAGE ═══════════════════════ */

export default function ExpertEarningsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Earnings</h1>
        <p className="text-gray-400 mt-1">
          Track your income from Handy clients
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { label: "This Month", value: "£3,200", highlight: true },
          { label: "Last Month", value: "£2,800", highlight: false },
          { label: "This Quarter", value: "£8,400", highlight: true },
          { label: "Pending Payments", value: "£2,000", highlight: false },
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

      {/* Earnings Table */}
      <div className="bg-navy-light border border-gray-700 rounded-xl overflow-hidden mb-8">
        {/* Desktop Header */}
        <div className="hidden md:grid grid-cols-[1fr_100px_1fr_90px_140px_120px] gap-3 px-5 py-3 border-b border-gray-700/50 text-xs text-gray-500 uppercase tracking-wider">
          <span>Client</span>
          <span>Jurisdiction</span>
          <span>Service</span>
          <span>Amount</span>
          <span>Status</span>
          <span>Date</span>
        </div>

        {/* Rows */}
        {EARNINGS.map((row, i) => {
          const statusCfg = STATUS_CONFIG[row.status];
          return (
            <div
              key={i}
              className="border-b border-gray-700/30 last:border-b-0 hover:bg-white/[0.02] transition-colors"
            >
              {/* Desktop */}
              <div className="hidden md:grid grid-cols-[1fr_100px_1fr_90px_140px_120px] gap-3 items-center px-5 py-4">
                <span className="text-sm text-gray-200 font-medium">
                  {row.client}
                </span>
                <span className="text-sm text-gray-400">
                  {row.flag} {row.jurisdiction}
                </span>
                <span className="text-sm text-gray-400">{row.service}</span>
                <span className="text-sm font-semibold text-gold">
                  {row.amount}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border w-fit ${statusCfg.class}`}
                >
                  <span className="text-xs">{statusCfg.icon}</span>
                  {statusCfg.label}
                </span>
                <span className="text-xs text-gray-500">{row.date}</span>
              </div>

              {/* Mobile */}
              <div className="md:hidden px-5 py-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="text-sm text-gray-200 font-medium">
                      {row.client}
                    </p>
                    <p className="text-xs text-gray-500">
                      {row.flag} {row.jurisdiction} — {row.service}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gold flex-shrink-0">
                    {row.amount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${statusCfg.class}`}
                  >
                    <span className="text-xs">{statusCfg.icon}</span>
                    {statusCfg.label}
                  </span>
                  <span className="text-xs text-gray-500">{row.date}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment Settings */}
      <div className="bg-navy-light border border-gray-700 rounded-xl p-5">
        <h3 className="font-semibold text-base mb-4">Payment Settings</h3>
        <div className="grid sm:grid-cols-2 gap-4 mb-5">
          <div>
            <p className="text-xs text-gray-500 mb-1">Payment method</p>
            <p className="text-sm text-gray-200">
              Bank transfer to Barclays ****7823
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Payment schedule</p>
            <p className="text-sm text-gray-200">
              Monthly, processed on the 1st
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Next payment</p>
            <p className="text-sm text-gray-200">
              March 1, 2026 — estimated{" "}
              <span className="text-gold font-medium">£2,000</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Tax year to date</p>
            <p className="text-sm text-gray-200">
              Total earned:{" "}
              <span className="text-gold font-medium">£14,200</span>
            </p>
          </div>
        </div>
        <button className="px-5 py-2.5 rounded-lg border border-gray-700 text-sm font-medium text-gray-300 hover:border-gold/40 hover:text-gold transition-colors">
          Update payment details
        </button>
      </div>
    </div>
  );
}
