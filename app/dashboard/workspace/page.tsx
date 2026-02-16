"use client";

import { useState } from "react";

/* ═══════════════════════ TYPES ═══════════════════════ */

type TaskStatus = "complete" | "warning" | "in_progress" | "pending";

interface TaskItem {
  status: TaskStatus;
  label: string;
  detail?: string;
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

interface Message {
  sender: string;
  initials?: string;
  isSystem?: boolean;
  isClient?: boolean;
  time: string;
  text: string;
}

interface DocFile {
  name: string;
  source: string;
  date: string;
}

interface JurisdictionData {
  code: string;
  flag: string;
  country: string;
  expert: string;
  filingTitle: string;
  statusLabel: string;
  progress: number;
  sections: TaskSection[];
  messages: Message[];
  documents: DocFile[];
  approval: {
    title: string;
    description: string;
    summary: { label: string; value: string }[];
  } | null;
  crossNote: string;
}

/* ═══════════════════════ DATA ═══════════════════════ */

const JURISDICTIONS: JurisdictionData[] = [
  {
    code: "GB",
    flag: "🇬🇧",
    country: "United Kingdom",
    expert: "Sarah Mitchell",
    filingTitle: "United Kingdom — 2024/25 Filing",
    statusLabel: "In Progress — 65% Complete",
    progress: 65,
    sections: [
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
              "Inter-wallet transfers misidentified as disposals. Sarah is reviewing these to confirm they are non-taxable transfers, not sales.",
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
          { status: "in_progress", label: "SA100 being compiled by Sarah Mitchell" },
          { status: "pending", label: "HMRC submission — awaiting final review" },
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
          { status: "in_progress", label: "UK-France split-year employment allocation — Sarah & Pierre coordinating" },
          { status: "in_progress", label: "UK-France capital gains treaty analysis — determining primary taxing rights on stocks sold during transition" },
          { status: "pending", label: "UK-Portugal self-employment — Ana reviewing NHR implications for Estonian company distributions" },
          {
            status: "pending",
            label: "",
            infoBox:
              "Three active coordination threads between your experts. Sarah is lead coordinator for your case. Current focus: determining the exact split of your employment income between UK and France, which affects both jurisdictions' tax calculations.",
          },
        ],
      },
    ],
    messages: [
      {
        sender: "Sarah Mitchell",
        initials: "SM",
        time: "2 hours ago",
        text: "Hi Michael, I've combined your crypto and stock gains into a single CGT calculation. Total taxable gains are £8,077 after the annual allowance. I'm now working on the employment income split — I need Pierre to confirm the French tax year dates for your employment contract.",
      },
      {
        sender: "Michael",
        isClient: true,
        time: "1 hour ago",
        text: "Thanks Sarah! My French contract started May 1st. Does the self-employment income from my Estonian company complicate things?",
      },
      {
        sender: "Sarah Mitchell",
        initials: "SM",
        time: "45 min ago",
        text: "Good question. The Estonian company income is interesting — since you're now Portuguese tax resident with NHR status, Ana thinks it may be exempt from Portuguese tax entirely. I've looped her in. For UK purposes, I'm treating it as self-employment income for the months you were UK resident. I've prepared the SA103 accordingly.",
      },
      {
        sender: "System",
        isSystem: true,
        time: "30 min ago",
        text: "Sarah Mitchell uploaded: Combined_CGT_Summary_2024-25.pdf",
      },
      {
        sender: "System",
        isSystem: true,
        time: "20 min ago",
        text: "🔄 Cross-jurisdiction update: Pierre Dubois confirmed French employment period as May 1 - October 31, 2024",
      },
    ],
    documents: [
      {
        name: "Crypto_Gains_Summary_2024-25.pdf",
        source: "Generated by Handy",
        date: "Feb 14",
      },
      {
        name: "Stock_Gains_Summary_2024-25.pdf",
        source: "Generated by Handy",
        date: "Feb 13",
      },
      {
        name: "Combined_CGT_Summary_2024-25.pdf",
        source: "Uploaded by Sarah Mitchell",
        date: "Today",
      },
      {
        name: "Self_Employment_Accounts_2024-25.pdf",
        source: "Generated by Handy",
        date: "Feb 14",
      },
      {
        name: "Employment_Income_Summary_2024-25.pdf",
        source: "Generated by Handy",
        date: "Feb 12",
      },
      {
        name: "Full_Transaction_Log.csv",
        source: "Generated by Handy",
        date: "Feb 10",
      },
    ],
    approval: {
      title: "SA100 Tax Return — Ready for your review",
      description:
        "Sarah Mitchell has prepared your Self Assessment return incorporating all income streams. Review the summary and approve for submission to HMRC.",
      summary: [
        { label: "Total income", value: "£44,320" },
        { label: "Capital gains (crypto + stocks)", value: "£11,077" },
        { label: "CGT after allowance", value: "£8,077" },
        { label: "Self-employment", value: "£15,870" },
      ],
    },
    crossNote:
      "This workspace syncs relevant data with your France and Portugal workspaces. Sarah is coordinating the employment income split with Pierre, and the self-employment NHR treatment with Ana. Changes propagate automatically.",
  },
  {
    code: "FR",
    flag: "🇫🇷",
    country: "France",
    expert: "Pierre Dubois",
    filingTitle: "France — 2024/25 Filing",
    statusLabel: "Not Started — 10% Complete",
    progress: 10,
    sections: [
      {
        title: "Data Collection",
        status: "in_progress",
        statusLabel: "In Progress",
        items: [
          {
            status: "pending",
            label: "Awaiting UK workspace data sync for split-year residency dates",
          },
          {
            status: "pending",
            label: "French exchange account declarations (Form 3916-bis)",
          },
          {
            status: "complete",
            label: "French tax residency period confirmed: March 2024 — present",
          },
        ],
      },
      {
        title: "Cerfa 2086 Preparation",
        status: "pending",
        statusLabel: "Not Started",
        items: [
          { status: "pending", label: "Crypto disposal summary for French tax period" },
          { status: "pending", label: "PFU (flat tax 30%) calculation" },
          { status: "pending", label: "Cost basis conversion to EUR" },
        ],
      },
      {
        title: "Treaty Relief",
        status: "pending",
        statusLabel: "Pending",
        items: [
          {
            status: "pending",
            label: "UK-France treaty Article 13 — capital gains allocation",
          },
          {
            status: "pending",
            label: "",
            infoBox:
              "Pierre is waiting for Sarah to confirm the exact UK departure date and split-year treatment before proceeding with the French filing. This determines which gains fall under French jurisdiction.",
          },
        ],
      },
    ],
    messages: [
      {
        sender: "Pierre Dubois",
        initials: "PD",
        time: "3 days ago",
        text: "Bonjour Michael, I've accepted your case and reviewed the initial compliance map. I'll need the UK departure date from Sarah before I can begin the Cerfa 2086. I'll coordinate directly with her.",
      },
      {
        sender: "Michael",
        isClient: true,
        time: "3 days ago",
        text: "Thanks Pierre! Happy to provide any documents you need. I have all my French bank statements ready.",
      },
    ],
    documents: [
      {
        name: "French_Residency_Confirmation.pdf",
        source: "Uploaded by Michael",
        date: "Feb 10",
      },
      {
        name: "Compliance_Map_France.pdf",
        source: "Generated by Handy",
        date: "Feb 8",
      },
    ],
    approval: null,
    crossNote:
      "This workspace receives data from your UK workspace. When Sarah confirms the split-year departure date, Pierre's calculations will automatically use the correct residency period.",
  },
  {
    code: "PT",
    flag: "🇵🇹",
    country: "Portugal",
    expert: "Ana Santos",
    filingTitle: "Portugal — 2024/25 Filing",
    statusLabel: "Under Review — 35% Complete",
    progress: 35,
    sections: [
      {
        title: "Residency & Status",
        status: "complete",
        statusLabel: "Complete",
        items: [
          { status: "complete", label: "NHR status verification — Confirmed active" },
          {
            status: "complete",
            label: "Portuguese tax residency established: September 2022",
          },
        ],
      },
      {
        title: "Modelo 3 Preparation",
        status: "in_progress",
        statusLabel: "In Progress",
        items: [
          {
            status: "in_progress",
            label: "Annexo G — capital gains from crypto disposals",
          },
          {
            status: "in_progress",
            label: "Crypto classification review — short-term vs long-term holdings",
          },
          {
            status: "pending",
            label: "Foreign income declaration (Annexo J)",
          },
        ],
      },
      {
        title: "Tax Optimization",
        status: "pending",
        statusLabel: "Pending",
        items: [
          {
            status: "pending",
            label: "NHR benefit application — foreign source income exemption analysis",
          },
          {
            status: "pending",
            label: "",
            infoBox:
              "Ana is reviewing whether your UK and French income qualifies for NHR exemption under Portugal's non-habitual resident regime. This could significantly reduce your Portuguese tax liability.",
          },
        ],
      },
    ],
    messages: [
      {
        sender: "Ana Santos",
        initials: "AS",
        time: "2 days ago",
        text: "Olá Michael, I've confirmed your NHR status is still active. I'm now working through your crypto transactions to classify which fall under the 365-day exemption. I should have an update by end of week.",
      },
      {
        sender: "Michael",
        isClient: true,
        time: "2 days ago",
        text: "Great, thanks Ana! Let me know if you need the wallet connection data — I have everything in Handy already.",
      },
    ],
    documents: [
      {
        name: "NHR_Status_Confirmation.pdf",
        source: "Uploaded by Ana Santos",
        date: "Feb 11",
      },
      {
        name: "Compliance_Map_Portugal.pdf",
        source: "Generated by Handy",
        date: "Feb 8",
      },
    ],
    approval: null,
    crossNote:
      "This workspace receives data from your UK and France workspaces. Treaty relief decisions in those jurisdictions may affect your Portuguese Annexo J foreign income declaration.",
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

function SectionStatusBadge({ status, label }: { status: TaskStatus; label: string }) {
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

function TaskBoard({ sections }: { sections: TaskSection[] }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  function toggleExpand(key: string) {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="space-y-4">
      {sections.map((section, si) => (
        <div
          key={si}
          className="bg-navy-light border border-gray-700 rounded-xl overflow-hidden"
        >
          {/* Section header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-700/50">
            <h4 className="font-medium text-sm sm:text-base">{section.title}</h4>
            <SectionStatusBadge status={section.status} label={section.statusLabel} />
          </div>

          {/* Items */}
          <div className="px-5 py-3 space-y-2.5">
            {section.items.map((item, ii) => {
              const key = `${si}-${ii}`;

              /* Download row */
              if (item.downloads) {
                return (
                  <div key={key} className="flex flex-wrap gap-2 py-1">
                    {item.downloads.map((dl) => (
                      <button
                        key={dl.filename}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy border border-gray-700 text-xs text-gray-300 hover:border-teal/40 hover:text-teal transition-colors"
                      >
                        <span>&#128196;</span>
                        {dl.label}
                      </button>
                    ))}
                  </div>
                );
              }

              /* Expert note */
              if (item.note) {
                return (
                  <div
                    key={key}
                    className="flex gap-3 px-3 py-3 bg-teal/5 border border-teal/15 rounded-lg mt-1"
                  >
                    <div className="w-6 h-6 rounded-full bg-teal/20 flex items-center justify-center text-[10px] font-bold text-teal flex-shrink-0 mt-0.5">
                      SM
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {item.note}
                    </p>
                  </div>
                );
              }

              /* Info box */
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

              /* Standard task item */
              return (
                <div key={key}>
                  <div
                    className={`flex items-start gap-2.5 py-1 ${item.expandable ? "cursor-pointer group" : ""}`}
                    onClick={item.expandable ? () => toggleExpand(key) : undefined}
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
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </div>
                  {item.expandable && expanded[key] && item.expandedText && (
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
  );
}

function MessagesPanel({ messages }: { messages: Message[] }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.map((msg, i) => {
          if (msg.isSystem) {
            return (
              <div key={i} className="flex justify-center">
                <span className="px-3 py-1.5 bg-navy border border-gray-700 rounded-full text-xs text-gray-500">
                  &#128206; {msg.text}
                </span>
              </div>
            );
          }

          const isClient = msg.isClient;
          return (
            <div
              key={i}
              className={`flex gap-2.5 ${isClient ? "flex-row-reverse" : ""}`}
            >
              {!isClient && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal/30 to-teal/10 border border-gray-600 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                  {msg.initials}
                </div>
              )}
              <div className={`max-w-[80%] ${isClient ? "items-end" : ""}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs font-medium ${isClient ? "text-teal ml-auto" : "text-gray-300"}`}
                  >
                    {msg.sender}
                  </span>
                  <span className="text-xs text-gray-600">{msg.time}</span>
                </div>
                <div
                  className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isClient
                      ? "bg-teal/15 text-gray-200 rounded-br-md"
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
      {/* Input */}
      <div className="p-3 border-t border-gray-700/50">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 bg-navy border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal/50 transition-colors"
          />
          <button className="px-4 py-2.5 bg-teal text-navy rounded-xl font-medium text-sm hover:bg-teal-light transition-colors flex-shrink-0">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function DocumentsPanel({ documents }: { documents: DocFile[] }) {
  return (
    <div className="p-4 space-y-2">
      {documents.map((doc, i) => (
        <button
          key={i}
          className="w-full flex items-start gap-3 px-3 py-3 rounded-lg bg-navy border border-gray-700 hover:border-gray-600 transition-colors text-left group"
        >
          <span className="text-lg flex-shrink-0 mt-px">
            {doc.name.endsWith(".csv") ? "&#128202;" : "&#128196;"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-gray-200 font-medium truncate group-hover:text-white transition-colors">
              {doc.name}
            </p>
            <p className="text-xs text-gray-500">
              {doc.source} &middot; {doc.date}
            </p>
          </div>
          <svg
            className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors flex-shrink-0 mt-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        </button>
      ))}
      <button className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-lg border border-dashed border-gray-700 text-sm text-gray-500 hover:border-gray-600 hover:text-gray-400 transition-colors mt-2">
        &#128206; Upload Document
      </button>
    </div>
  );
}

function ApprovalsPanel({
  approval,
}: {
  approval: JurisdictionData["approval"];
}) {
  if (!approval) {
    return (
      <div className="p-4 flex flex-col items-center justify-center h-48 text-center">
        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mb-3">
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm text-gray-500">No approvals pending</p>
        <p className="text-xs text-gray-600 mt-1">
          Your expert will notify you when something needs your sign-off.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="bg-navy border border-amber-500/20 rounded-xl p-5">
        <div className="flex items-start gap-3 mb-4">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 text-sm flex-shrink-0">
            !
          </span>
          <div>
            <h4 className="font-semibold text-sm">{approval.title}</h4>
            <p className="text-xs text-gray-400 mt-1">{approval.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-5">
          {approval.summary.map((row) => (
            <div
              key={row.label}
              className="px-3 py-2.5 bg-navy-light rounded-lg border border-gray-700"
            >
              <span className="text-xs text-gray-500 block">{row.label}</span>
              <span className="text-sm font-semibold text-white">
                {row.value}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button className="py-2.5 rounded-lg bg-teal/15 border border-teal/30 text-sm font-medium text-teal hover:bg-teal/25 transition-colors">
            &#10003; Approve &amp; Submit
          </button>
          <button className="py-2.5 rounded-lg border border-gray-700 text-sm font-medium text-gray-400 hover:border-gray-600 hover:text-gray-300 transition-colors">
            &#10005; Request Changes
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════ PAGE ═══════════════════════ */

export default function WorkspacePage() {
  const [activeJurisdiction, setActiveJurisdiction] = useState(0);
  const [activeRightTab, setActiveRightTab] = useState<
    "messages" | "documents" | "approvals"
  >("messages");

  const j = JURISDICTIONS[activeJurisdiction];

  const rightTabs: { id: "messages" | "documents" | "approvals"; label: string; count?: number }[] = [
    { id: "messages", label: "Messages", count: j.messages.length },
    { id: "documents", label: "Documents", count: j.documents.length },
    { id: "approvals", label: "Approvals", count: j.approval ? 1 : 0 },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Jurisdiction Tabs */}
      <div className="border-b border-gray-800 bg-navy-dark/50 px-4 sm:px-6 lg:px-8 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex gap-1 py-2">
          {JURISDICTIONS.map((jur, i) => (
            <button
              key={jur.code}
              onClick={() => {
                setActiveJurisdiction(i);
                setActiveRightTab("messages");
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                i === activeJurisdiction
                  ? "bg-teal/10 text-teal border border-teal/30"
                  : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              <span>{jur.flag}</span>
              <span className="hidden sm:inline">{jur.country}</span>
              <span className="text-xs text-gray-500 hidden md:inline">
                with {jur.expert}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        {/* LEFT — Task Board */}
        <div className="lg:w-[60%] overflow-y-auto border-r border-gray-800 p-4 sm:p-6">
          <div className="max-w-2xl">
            {/* Header */}
            <div className="mb-5">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                {j.filingTitle}
              </h2>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-sm text-gray-400">{j.statusLabel}</span>
                <div className="flex-1 max-w-[200px] h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal rounded-full transition-all"
                    style={{ width: `${j.progress}%` }}
                  />
                </div>
              </div>
            </div>

            <TaskBoard sections={j.sections} />
          </div>
        </div>

        {/* RIGHT — Comms & Docs */}
        <div className="lg:w-[40%] flex flex-col overflow-hidden border-t lg:border-t-0 border-gray-800">
          {/* Right tabs */}
          <div className="flex border-b border-gray-800 px-2 bg-navy-dark/30">
            {rightTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveRightTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors relative ${
                  activeRightTab === tab.id
                    ? "text-teal"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      activeRightTab === tab.id
                        ? "bg-teal/15 text-teal"
                        : "bg-gray-800 text-gray-500"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
                {activeRightTab === tab.id && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-teal rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {activeRightTab === "messages" && (
              <MessagesPanel messages={j.messages} />
            )}
            {activeRightTab === "documents" && (
              <DocumentsPanel documents={j.documents} />
            )}
            {activeRightTab === "approvals" && (
              <ApprovalsPanel approval={j.approval} />
            )}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800 bg-navy-dark/50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto py-3 flex items-start gap-2.5">
          <svg
            className="w-4 h-4 text-teal flex-shrink-0 mt-0.5"
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
            <span className="text-gray-400 font-medium">Cross-jurisdiction sync:</span>{" "}
            {j.crossNote}
          </p>
        </div>
      </div>
    </div>
  );
}
