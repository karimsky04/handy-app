"use client";

import { useState } from "react";

/* ═══════════════════════ TYPES ═══════════════════════ */

type TaskStatus = "complete" | "warning" | "in_progress" | "pending";

interface TaskItem {
  status: TaskStatus;
  label: string;
  expandable?: boolean;
  expandedText?: string;
  downloads?: { label: string; filename: string }[];
  note?: string;
  infoBox?: string;
}

interface TaskSection {
  title: string;
  status: TaskStatus;
  statusLabel: string;
  items: TaskItem[];
}

interface InternalNote {
  date: string;
  text: string;
}

interface Message {
  sender: string;
  initials?: string;
  isSystem?: boolean;
  isClient?: boolean;
  time: string;
  text: string;
}

/* ═══════════════════════ DATA ═══════════════════════ */

const CLIENTS = [
  "Michael Thompson",
  "Emma Chen",
  "David Park",
  "Priya Sharma",
  "Alex Petrov",
  "Nina Johansson",
  "Omar Hassan",
  "Rachel Kim",
];

const SECTIONS: TaskSection[] = [
  {
    title: "Data Collection",
    status: "complete",
    statusLabel: "Complete",
    items: [
      { status: "complete", label: "Crypto exchange data imported (Binance, Coinbase, Kraken + 28 others)" },
      { status: "complete", label: "Crypto wallet addresses verified (31 wallets)" },
      { status: "complete", label: "Brokerage accounts connected (Interactive Brokers, Trading 212, Hargreaves Lansdown)" },
      { status: "complete", label: "Employment payslips uploaded (UK employer — 4 months)" },
      { status: "complete", label: "Self-employment records imported (HandyTax OÜ — Estonian e-Residency)" },
    ],
  },
  {
    title: "Reconciliation & Classification",
    status: "complete",
    statusLabel: "Complete",
    items: [
      { status: "complete", label: "Crypto transaction matching: 24,847 of 25,102 matched (98.9%)" },
      {
        status: "warning",
        label: "255 crypto transactions flagged for manual review",
        expandable: true,
        expandedText:
          "Inter-wallet transfers misidentified as disposals. Confirmed as non-taxable transfers after manual review. No tax impact.",
      },
      { status: "complete", label: "Stock trades reconciled: 342 trades across 3 brokerages" },
      { status: "complete", label: "Dividend income classified: £1,240 (UK allowance: £1,000 — £240 taxable)" },
      { status: "complete", label: "Employment income split: UK (Jan-Apr), France (May-Oct), Portugal (Nov-Dec)" },
      { status: "complete", label: "Self-employment income: €18,400 from HandyTax OÜ" },
    ],
  },
  {
    title: "Tax Report Generation",
    status: "complete",
    statusLabel: "Complete",
    items: [
      { status: "complete", label: "Crypto capital gains summary: £6,847 gains" },
      { status: "complete", label: "Stock capital gains summary: £4,230 gains" },
      { status: "complete", label: "Combined CGT calculation: £11,077 total gains, £3,000 allowance = £8,077 taxable" },
      { status: "complete", label: "Employment income summary: £28,450 (UK portion)" },
      { status: "complete", label: "Self-employment income summary: £15,870 (converted from EUR)" },
      { status: "complete", label: "SA108 (Capital Gains) prepared" },
      { status: "complete", label: "SA103 (Self-Employment) prepared" },
      {
        status: "complete",
        label: "",
        downloads: [
          { label: "Crypto Gains Report", filename: "Crypto_Gains_Summary_2024-25.pdf" },
          { label: "Stock Gains Report", filename: "Stock_Gains_Summary_2024-25.pdf" },
          { label: "Combined CGT Summary", filename: "Combined_CGT_Summary_2024-25.pdf" },
          { label: "Employment Income Summary", filename: "Employment_Income_Summary_2024-25.pdf" },
          { label: "Self-Employment Accounts", filename: "Self_Employment_Accounts_2024-25.pdf" },
        ],
      },
    ],
  },
  {
    title: "Filing & Submission",
    status: "in_progress",
    statusLabel: "In Progress",
    items: [
      { status: "in_progress", label: "SA100 being compiled — all income streams incorporated" },
      { status: "pending", label: "HMRC submission — awaiting client approval" },
      {
        status: "complete",
        label: "",
        note: "Michael, I've compiled your SA100 incorporating all income streams: crypto gains (£6,847), stock gains (£4,230), UK employment (£28,450), and self-employment (£15,870). Combined CGT after allowance is £8,077. I'm coordinating with Pierre on the split-year treatment for your employment income — we need to confirm exactly which months' salary is UK-taxable vs French-taxable. I'll have the final figures by Thursday.",
      },
    ],
  },
  {
    title: "Cross-Jurisdiction Coordination",
    status: "in_progress",
    statusLabel: "Active",
    items: [
      { status: "in_progress", label: "UK-France split-year employment allocation — coordinating with Pierre Dubois" },
      { status: "in_progress", label: "UK-France capital gains treaty analysis — determining primary taxing rights on stocks sold during transition" },
      { status: "pending", label: "UK-Portugal self-employment — Ana reviewing NHR implications for Estonian company distributions" },
      {
        status: "pending",
        label: "",
        infoBox:
          "Three active coordination threads. You are lead coordinator. Current focus: exact employment income split between UK and France.",
      },
    ],
  },
];

const INTERNAL_NOTES: InternalNote[] = [
  {
    date: "Yesterday",
    text: "Client's DeFi activity includes Uniswap and Aave. Need to verify if liquidity pool exits trigger CGT events. Checking HMRC guidance on this.",
  },
  {
    date: "3 days ago",
    text: "Spoke with Pierre re: split-year. He confirms French employment contract was May-Oct. UK source employment is Jan-Apr only. Self-employment (Estonian co) needs separate analysis per jurisdiction.",
  },
  {
    date: "1 week ago",
    text: "Initial review — this is a complex multi-asset, multi-jurisdiction case. Estimating 10+ hours. Will need to coordinate closely with Pierre (FR) and Ana (PT) on treaty positions.",
  },
];

const MESSAGES: Message[] = [
  {
    sender: "Sarah Mitchell (You)",
    initials: "SM",
    time: "2 hours ago",
    text: "Hi Michael, I've combined your crypto and stock gains into a single CGT calculation. Total taxable gains are £8,077 after the annual allowance. I'm now working on the employment income split — I need Pierre to confirm the French tax year dates for your employment contract.",
  },
  {
    sender: "Michael Thompson",
    isClient: true,
    time: "1 hour ago",
    text: "Thanks Sarah! My French contract started May 1st. Does the self-employment income from my Estonian company complicate things?",
  },
  {
    sender: "Sarah Mitchell (You)",
    initials: "SM",
    time: "45 min ago",
    text: "Good question. The Estonian company income is interesting — since you're now Portuguese tax resident with NHR status, Ana thinks it may be exempt from Portuguese tax entirely. I've looped her in. For UK purposes, I'm treating it as self-employment income for the months you were UK resident. I've prepared the SA103 accordingly.",
  },
  {
    sender: "System",
    isSystem: true,
    time: "30 min ago",
    text: "You uploaded: Combined_CGT_Summary_2024-25.pdf",
  },
  {
    sender: "System",
    isSystem: true,
    time: "20 min ago",
    text: "🔄 Cross-jurisdiction update: Pierre Dubois confirmed French employment period as May 1 - October 31, 2024",
  },
];

/* ═══════════════════════ SUB-COMPONENTS ═══════════════════════ */

function StatusIcon({ status }: { status: TaskStatus }) {
  switch (status) {
    case "complete":
      return (
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-teal/20 text-teal text-xs flex-shrink-0">
          &#10003;
        </span>
      );
    case "warning":
      return (
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs flex-shrink-0">
          !
        </span>
      );
    case "in_progress":
      return (
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs flex-shrink-0">
          &#8635;
        </span>
      );
    case "pending":
      return (
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-700 text-gray-400 text-xs flex-shrink-0">
          &#9203;
        </span>
      );
  }
}

function SectionBadge({ status, label }: { status: TaskStatus; label: string }) {
  const styles: Record<TaskStatus, string> = {
    complete: "bg-teal/10 text-teal border-teal/30",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    in_progress: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    pending: "bg-gray-700/50 text-gray-400 border-gray-600",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${styles[status]}`}>
      {label}
    </span>
  );
}

/* ═══════════════════════ PAGE ═══════════════════════ */

export default function ExpertWorkspacePage() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showProfile, setShowProfile] = useState(true);

  function toggleExpand(key: string) {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Top Bar */}
      <div className="border-b border-gray-800 bg-navy-dark/50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-3 py-3">
          {/* Client selector */}
          <select className="bg-navy-light border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold/50 transition-colors">
            {CLIENTS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <div className="h-5 w-px bg-gray-700" />

          <span className="text-sm text-gray-400">
            🇬🇧 United Kingdom — 2024/25
          </span>

          <div className="h-5 w-px bg-gray-700 hidden sm:block" />

          {/* Risk tags */}
          <div className="flex gap-1.5">
            {["Multi-Jurisdiction", "High Complexity", "Overdue Filing"].map(
              (tag) => (
                <span
                  key={tag}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                    tag === "Overdue Filing"
                      ? "bg-red-500/10 text-red-400 border-red-500/30"
                      : tag === "High Complexity"
                        ? "bg-orange-500/10 text-orange-400 border-orange-500/30"
                        : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                  }`}
                >
                  {tag}
                </span>
              )
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        {/* LEFT — Expert Tools + Task Board + Internal Notes */}
        <div className="lg:w-[60%] overflow-y-auto border-r border-gray-800 p-4 sm:p-6">
          <div className="max-w-2xl">
            {/* Expert Actions Panel */}
            <div className="bg-gold/5 border border-gold/20 rounded-xl p-4 mb-5">
              <h3 className="text-sm font-semibold text-gold mb-3">
                Expert Actions
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: "📝", label: "Add Internal Note" },
                  { icon: "📎", label: "Upload Document" },
                  { icon: "✅", label: "Mark Task Complete" },
                  { icon: "🔄", label: "Request Info from Client" },
                  { icon: "👥", label: "Coordinate with Expert" },
                ].map((action) => (
                  <button
                    key={action.label}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-navy border border-gray-700 text-xs text-gray-300 hover:border-gold/40 hover:text-gold transition-colors"
                  >
                    <span>{action.icon}</span>
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Header */}
            <div className="mb-5">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                United Kingdom — 2024/25 Filing
              </h2>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-sm text-gray-400">
                  In Progress — 65% Complete
                </span>
                <div className="flex-1 max-w-[200px] h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gold rounded-full"
                    style={{ width: "65%" }}
                  />
                </div>
              </div>
            </div>

            {/* Task Sections */}
            <div className="space-y-4">
              {SECTIONS.map((section, si) => (
                <div
                  key={si}
                  className="bg-navy-light border border-gray-700 rounded-xl overflow-hidden"
                >
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-700/50">
                    <h4 className="font-medium text-sm sm:text-base">
                      {section.title}
                    </h4>
                    <SectionBadge
                      status={section.status}
                      label={section.statusLabel}
                    />
                  </div>
                  <div className="px-5 py-3 space-y-2.5">
                    {section.items.map((item, ii) => {
                      const key = `${si}-${ii}`;

                      if (item.downloads) {
                        return (
                          <div key={key} className="flex flex-wrap gap-2 py-1">
                            {item.downloads.map((dl) => (
                              <button
                                key={dl.filename}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy border border-gray-700 text-xs text-gray-300 hover:border-gold/40 hover:text-gold transition-colors"
                              >
                                <span>📄</span>
                                {dl.label}
                              </button>
                            ))}
                          </div>
                        );
                      }

                      if (item.note) {
                        return (
                          <div
                            key={key}
                            className="flex gap-3 px-3 py-3 bg-gold/5 border border-gold/15 rounded-lg mt-1"
                          >
                            <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center text-[10px] font-bold text-gold flex-shrink-0 mt-0.5">
                              SM
                            </div>
                            <p className="text-sm text-gray-300 leading-relaxed">
                              {item.note}
                            </p>
                          </div>
                        );
                      }

                      if (item.infoBox) {
                        return (
                          <div
                            key={key}
                            className="flex items-start gap-2.5 px-3 py-3 bg-blue-500/5 border border-blue-500/15 rounded-lg mt-1"
                          >
                            <svg
                              className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <p className="text-sm text-gray-400 leading-relaxed">
                              {item.infoBox}
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div key={key}>
                          <div
                            className={`flex items-start gap-2.5 py-1 ${item.expandable ? "cursor-pointer group" : ""}`}
                            onClick={
                              item.expandable
                                ? () => toggleExpand(key)
                                : undefined
                            }
                          >
                            <div className="mt-px">
                              <StatusIcon status={item.status} />
                            </div>
                            <span className="text-sm text-gray-300 leading-relaxed">
                              {item.label}
                            </span>
                            {item.expandable && (
                              <svg
                                className={`w-4 h-4 text-gray-500 flex-shrink-0 ml-auto mt-0.5 transition-transform ${expanded[key] ? "rotate-180" : ""}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            )}
                          </div>
                          {item.expandable &&
                            expanded[key] &&
                            item.expandedText && (
                              <div className="ml-[30px] mt-1 px-3 py-2 bg-amber-500/5 border-l-2 border-amber-500/30 rounded-r-lg">
                                <p className="text-xs text-gray-400 leading-relaxed">
                                  {item.expandedText}
                                </p>
                              </div>
                            )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Internal Notes (Expert-only) */}
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm">🔒</span>
                <h3 className="text-sm font-semibold text-gray-300">
                  Internal Notes
                </h3>
                <span className="text-[10px] text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
                  Not visible to client
                </span>
              </div>
              <div className="space-y-3">
                {INTERNAL_NOTES.map((note, i) => (
                  <div
                    key={i}
                    className="bg-navy-dark/60 border border-gray-700/60 border-l-4 border-l-gold/30 rounded-lg px-4 py-3"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs text-gold/70">🔒</span>
                      <span className="text-xs text-gray-500">
                        {note.date}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {note.text}
                    </p>
                  </div>
                ))}
              </div>
              <button className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-gray-700 text-sm text-gray-500 hover:border-gold/30 hover:text-gold transition-colors w-full justify-center">
                📝 Add new internal note
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT — Client Profile + Chat */}
        <div className="lg:w-[40%] flex flex-col overflow-hidden border-t lg:border-t-0 border-gray-800">
          {/* Client Profile Summary (collapsible) */}
          <div className="border-b border-gray-800">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-gold">👤</span>
                <span className="text-sm font-medium text-gray-300">
                  Client Profile Summary
                </span>
              </div>
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform ${showProfile ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {showProfile && (
              <div className="px-4 pb-4 space-y-2">
                <div className="bg-navy border border-gray-700 rounded-lg p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-200 font-medium">
                      Michael Thompson
                    </span>
                    <span className="text-gray-500">British</span>
                  </div>
                  <p className="text-gray-400">
                    UK → France → Portugal
                  </p>
                  <div className="border-t border-gray-700/50 pt-2 space-y-1.5">
                    <div>
                      <span className="text-gray-500">Assets: </span>
                      <span className="text-gray-300">
                        Crypto (31 wallets, 25k+ txns), Stocks (3 brokerages),
                        Employment (3 countries), Self-employed (Estonian
                        e-Residency)
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Tax years: </span>
                      <span className="text-gray-300">
                        2022/23, 2023/24, 2024/25
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">
                        Accountant status:{" "}
                      </span>
                      <span className="text-gray-300">
                        Has local accountants but they don&apos;t understand
                        crypto
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Complexity: </span>
                      <span className="text-red-400 font-medium">
                        Multi-Jurisdiction Complex
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Fee agreed: </span>
                      <span className="text-gold font-medium">
                        £1,200 (UK jurisdiction)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">
              {MESSAGES.map((msg, i) => {
                if (msg.isSystem) {
                  return (
                    <div key={i} className="flex justify-center">
                      <span className="px-3 py-1.5 bg-navy border border-gray-700 rounded-full text-xs text-gray-500">
                        📎 {msg.text}
                      </span>
                    </div>
                  );
                }

                const isClient = msg.isClient;
                const isYou = !isClient && !msg.isSystem;
                return (
                  <div
                    key={i}
                    className={`flex gap-2.5 ${isClient ? "flex-row-reverse" : ""}`}
                  >
                    {!isClient && (
                      <div
                        className={`w-8 h-8 rounded-full border flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                          isYou
                            ? "bg-gold/20 border-gold/30 text-gold"
                            : "bg-gradient-to-br from-teal/30 to-teal/10 border-gray-600 text-white"
                        }`}
                      >
                        {msg.initials}
                      </div>
                    )}
                    <div className={`max-w-[80%] ${isClient ? "items-end" : ""}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs font-medium ${
                            isClient
                              ? "text-teal ml-auto"
                              : isYou
                                ? "text-gold"
                                : "text-gray-300"
                          }`}
                        >
                          {msg.sender}
                        </span>
                        <span className="text-xs text-gray-600">
                          {msg.time}
                        </span>
                      </div>
                      <div
                        className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isClient
                            ? "bg-teal/15 text-gray-200 rounded-br-md"
                            : isYou
                              ? "bg-gold/10 text-gray-300 rounded-bl-md"
                              : "bg-gray-800 text-gray-300 rounded-bl-md"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-700/50">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type a message to client..."
                className="flex-1 bg-navy border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold/50 transition-colors"
              />
              <button className="px-4 py-2.5 bg-gold text-navy rounded-xl font-medium text-sm hover:bg-gold-light transition-colors flex-shrink-0">
                Send
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800 bg-navy-dark/50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto py-3 flex items-start gap-2.5">
          <svg
            className="w-4 h-4 text-gold flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          <p className="text-xs text-gray-500 leading-relaxed">
            <span className="text-gray-400 font-medium">
              Cross-jurisdiction sync:
            </span>{" "}
            Coordinating with Pierre Dubois (France) and Ana Santos (Portugal).
            Employment income split and NHR treatment pending. Changes propagate
            to all linked workspaces automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
