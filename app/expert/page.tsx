"use client";

/* ═══════════════════════ DATA ═══════════════════════ */

interface ActionCard {
  border: string;
  flag: string;
  title: string;
  description: string;
  actionLabel: string;
  time: string;
}

const URGENT_ACTIONS: ActionCard[] = [
  {
    border: "border-red-500/40",
    flag: "🇬🇧",
    title: "Michael Thompson — UK Filing OVERDUE",
    description:
      "SA100 awaiting client approval for 2 days. Deadline was Jan 31.",
    actionLabel: "Follow up with client",
    time: "Last activity: 2 hours ago",
  },
  {
    border: "border-amber-500/40",
    flag: "🇬🇧",
    title: "Emma Chen — UK Filing",
    description:
      "255 flagged transactions need manual review. Client has 15-30 wallets, DeFi activity detected.",
    actionLabel: "Review flagged transactions",
    time: "Assigned yesterday",
  },
  {
    border: "border-blue-500/40",
    flag: "🔄",
    title: "Cross-jurisdiction coordination request",
    description:
      "Pierre Dubois (France) needs UK departure date confirmation for Michael Thompson's split-year treatment",
    actionLabel: "Respond to Pierre",
    time: "Requested 3 hours ago",
  },
];

interface MatchCard {
  name: string;
  flags: string;
  complexity: string;
  complexityColor: string;
  assetTypes: string;
  taxYears: string;
  effort: string;
  description: string;
}

const NEW_MATCHES: MatchCard[] = [
  {
    name: "James Wilson",
    flags: "🇬🇧 UK",
    complexity: "Moderate",
    complexityColor: "text-yellow-400",
    assetTypes: "Crypto (5-15 exchanges), Stocks",
    taxYears: "2024/25 only",
    effort: "4-6 hours",
    description:
      "This client needs a UK specialist for crypto + stock capital gains. No multi-jurisdiction.",
  },
  {
    name: "Sofia Rodriguez",
    flags: "🇬🇧 UK + 🇪🇸 Spain",
    complexity: "Multi-Jurisdiction Complex",
    complexityColor: "text-red-400",
    assetTypes: "Crypto (30+ wallets), Employment income, Rental property",
    taxYears: "2023/24, 2024/25",
    effort: "8-12 hours",
    description:
      "Multi-jurisdiction case. You'd handle UK side. Spanish expert already assigned. Coordination required.",
  },
];

const MONTHLY_EARNINGS = [
  { month: "Sep", amount: 1800 },
  { month: "Oct", amount: 2400 },
  { month: "Nov", amount: 2100 },
  { month: "Dec", amount: 1600 },
  { month: "Jan", amount: 2800 },
  { month: "Feb", amount: 3200 },
];

/* ═══════════════════════ PAGE ═══════════════════════ */

export default function ExpertDashboard() {
  const maxEarning = Math.max(...MONTHLY_EARNINGS.map((m) => m.amount));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Good afternoon, Sarah
        </h1>
        <p className="text-gray-400 mt-1">
          You have 3 pending actions and 2 new client matches
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Active Clients", value: "12" },
          { label: "Jurisdictions Covered", value: "4" },
          { label: "Rating", value: "4.9 ★" },
          { label: "Earned This Quarter", value: "£8,400" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-navy-light border border-gray-700 rounded-xl px-4 py-3.5"
          >
            <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
            <p className="text-lg font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Urgent Actions */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold mb-4">
          Requires Your Attention
        </h2>
        <div className="grid lg:grid-cols-3 gap-4">
          {URGENT_ACTIONS.map((action, i) => (
            <div
              key={i}
              className={`bg-navy-light border-l-4 ${action.border} border border-gray-700 rounded-xl p-5 flex flex-col`}
            >
              <div className="flex items-start gap-2 mb-3">
                <span className="text-lg flex-shrink-0">{action.flag}</span>
                <h3 className="font-semibold text-sm leading-tight">
                  {action.title}
                </h3>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed mb-4 flex-1">
                {action.description}
              </p>
              <button className="w-full py-2.5 rounded-lg bg-gold/10 border border-gold/30 text-sm font-medium text-gold hover:bg-gold/20 transition-colors mb-3">
                {action.actionLabel}
              </button>
              <p className="text-xs text-gray-500">{action.time}</p>
            </div>
          ))}
        </div>
      </div>

      {/* New Client Matches */}
      <div className="mb-10">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">New Client Matches</h2>
          <p className="text-sm text-gray-500">
            Based on your specializations and availability
          </p>
        </div>
        <div className="space-y-4">
          {NEW_MATCHES.map((match, i) => (
            <div
              key={i}
              className="bg-navy-light border border-gray-700 rounded-xl p-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-base">{match.name}</h3>
                    <span className="text-sm text-gray-400">
                      — {match.flags}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-medium ${match.complexityColor}`}
                  >
                    {match.complexity}
                  </span>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button className="px-4 py-2 rounded-lg bg-gold/10 border border-gold/30 text-sm font-medium text-gold hover:bg-gold/20 transition-colors">
                    Accept Client
                  </button>
                  <button className="px-4 py-2 rounded-lg border border-gray-700 text-sm font-medium text-gray-400 hover:border-gray-600 hover:text-gray-300 transition-colors">
                    Decline
                  </button>
                  <button className="px-4 py-2 rounded-lg border border-gray-700 text-sm font-medium text-gray-400 hover:border-gray-600 hover:text-gray-300 transition-colors hidden sm:block">
                    View Profile
                  </button>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-3 mb-3">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Asset types</p>
                  <p className="text-sm text-gray-300">{match.assetTypes}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Tax years</p>
                  <p className="text-sm text-gray-300">{match.taxYears}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">
                    Estimated effort
                  </p>
                  <p className="text-sm text-gray-300">{match.effort}</p>
                </div>
              </div>

              <p className="text-sm text-gray-500 italic">
                {match.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Snapshot */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Performance Snapshot</h2>
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-navy-light border border-gray-700 rounded-xl px-4 py-4">
              <p className="text-xs text-gray-500 mb-1">Avg response time</p>
              <p className="text-xl font-bold text-teal">3.8 hours</p>
              <p className="text-[11px] text-teal/70 mt-0.5">
                Under 4hr target
              </p>
            </div>
            <div className="bg-navy-light border border-gray-700 rounded-xl px-4 py-4">
              <p className="text-xs text-gray-500 mb-1">
                Client satisfaction
              </p>
              <p className="text-xl font-bold text-white">4.9 / 5.0</p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Based on 28 reviews
              </p>
            </div>
            <div className="bg-navy-light border border-gray-700 rounded-xl px-4 py-4">
              <p className="text-xs text-gray-500 mb-1">Completed this month</p>
              <p className="text-xl font-bold text-white">4</p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                cases filed & submitted
              </p>
            </div>
            <div className="bg-navy-light border border-gray-700 rounded-xl px-4 py-4">
              <p className="text-xs text-gray-500 mb-1">Earnings this month</p>
              <p className="text-xl font-bold text-gold">£3,200</p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                +14% vs last month
              </p>
            </div>
          </div>

          {/* Earnings Chart */}
          <div className="bg-navy-light border border-gray-700 rounded-xl p-5">
            <p className="text-xs text-gray-500 mb-4">
              Monthly Earnings (Last 6 Months)
            </p>
            <div className="flex items-end gap-3 h-32">
              {MONTHLY_EARNINGS.map((m) => (
                <div
                  key={m.month}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <span className="text-[10px] text-gray-400 font-medium">
                    £{(m.amount / 1000).toFixed(1)}k
                  </span>
                  <div
                    className="w-full rounded-t-md bg-gold/30 hover:bg-gold/50 transition-colors"
                    style={{
                      height: `${(m.amount / maxEarning) * 100}%`,
                      minHeight: "8px",
                    }}
                  />
                  <span className="text-[10px] text-gray-500">{m.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
