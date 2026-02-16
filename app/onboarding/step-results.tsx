"use client";

import { useState } from "react";
import Link from "next/link";
import { OnboardingData } from "./page";
import { COUNTRIES } from "./step-residence";

/* ──────────────────────────── Data ──────────────────────────── */

interface CountryInfo {
  deadline: string;
  deadlineDate: Date;
  obligations: string[];
  myth: { myth: string; reality: string } | null;
  docs: string[];
}

const COUNTRY_DATA: Record<string, CountryInfo> = {
  GB: {
    deadline: "31 January",
    deadlineDate: new Date(2026, 0, 31),
    obligations: [
      "Self Assessment tax return (SA100)",
      "Report crypto capital gains on SA108",
      "Income from staking/mining as miscellaneous income",
      "DeFi transactions may trigger separate disposals",
    ],
    myth: {
      myth: "You only pay tax when you cash out to GBP.",
      reality:
        "Every crypto-to-crypto trade is a taxable disposal in the UK.",
    },
    docs: [
      "Exchange transaction history (CSV exports)",
      "Wallet addresses for on-chain transactions",
      "DeFi protocol interaction records",
      "Records of crypto received as income (mining, staking, airdrops)",
      "Cost basis records for original purchases",
      "Previous tax returns (if amending)",
      "National Insurance number",
    ],
  },
  US: {
    deadline: "15 April",
    deadlineDate: new Date(2026, 3, 15),
    obligations: [
      "IRS Form 8949 for crypto disposals",
      "Schedule D for capital gains summary",
      "FBAR filing if foreign exchange balances exceed $10,000",
      "Form 1040 with virtual currency question",
    ],
    myth: {
      myth: "If I didn't receive a 1099, I don't need to report.",
      reality:
        "The IRS requires reporting all crypto disposals regardless of whether you received tax forms.",
    },
    docs: [
      "Exchange transaction history (CSV exports)",
      "Wallet addresses for on-chain transactions",
      "DeFi protocol interaction records",
      "Records of crypto received as income (mining, staking, airdrops)",
      "Cost basis records for original purchases",
      "Previous tax returns (if amending)",
      "Social Security Number (SSN)",
      "FBAR records if foreign accounts exceed $10,000",
    ],
  },
  AU: {
    deadline: "31 October",
    deadlineDate: new Date(2025, 9, 31),
    obligations: [
      "Capital gains on crypto reported in tax return",
      "Crypto-to-crypto swaps are taxable events",
      "Staking rewards taxed as ordinary income",
      "50% CGT discount if held over 12 months",
    ],
    myth: {
      myth: "Crypto under $10,000 is tax-free.",
      reality:
        "There is no minimum threshold — all capital gains from crypto are taxable in Australia.",
    },
    docs: [
      "Exchange transaction history (CSV exports)",
      "Wallet addresses for on-chain transactions",
      "DeFi protocol interaction records",
      "Records of crypto received as income (mining, staking, airdrops)",
      "Cost basis records for original purchases",
      "Previous tax returns (if amending)",
      "Tax File Number (TFN)",
    ],
  },
  CA: {
    deadline: "30 April",
    deadlineDate: new Date(2026, 3, 30),
    obligations: [
      "Report crypto as capital gains (50% inclusion rate)",
      "Business income rules if trading is frequent",
      "T1 General return with Schedule 3",
      "Foreign property reporting (T1135) if over $100K",
    ],
    myth: null,
    docs: [
      "Exchange transaction history (CSV exports)",
      "Wallet addresses for on-chain transactions",
      "DeFi protocol interaction records",
      "Records of crypto received as income (mining, staking, airdrops)",
      "Cost basis records for original purchases",
      "Previous tax returns (if amending)",
      "Social Insurance Number (SIN)",
    ],
  },
  DE: {
    deadline: "31 July",
    deadlineDate: new Date(2026, 6, 31),
    obligations: [
      "Crypto held over 1 year is tax-free",
      "Short-term gains taxed as private sale (§23 EStG)",
      "€600 annual exemption for private sales",
      "Staking/lending income taxed as other income",
    ],
    myth: {
      myth: "All crypto is tax-free in Germany.",
      reality:
        "Only holdings sold after 1+ year are exempt. Short-term gains are fully taxable.",
    },
    docs: [
      "Exchange transaction history (CSV exports)",
      "Wallet addresses for on-chain transactions",
      "DeFi protocol interaction records",
      "Records of crypto received as income (mining, staking, airdrops)",
      "Cost basis records for original purchases",
      "Previous tax returns (if amending)",
      "Steuer-ID (tax identification number)",
    ],
  },
  FR: {
    deadline: "Mid-May",
    deadlineDate: new Date(2026, 4, 15),
    obligations: [
      "Flat tax of 30% on crypto capital gains",
      "Form 2086 for crypto disposals",
      "Must declare all foreign exchange accounts (Form 3916-bis)",
      "Mining/staking taxed as non-commercial profits (BNC)",
    ],
    myth: null,
    docs: [
      "Exchange transaction history (CSV exports)",
      "Wallet addresses for on-chain transactions",
      "DeFi protocol interaction records",
      "Records of crypto received as income (mining, staking, airdrops)",
      "Cost basis records for original purchases",
      "Previous tax returns (if amending)",
      "Numero fiscal (tax number)",
    ],
  },
  SE: {
    deadline: "2 May",
    deadlineDate: new Date(2026, 4, 2),
    obligations: [
      "Crypto gains taxed at 30% capital income tax",
      "Report on K4 attachment to income tax return",
      "Each crypto-to-crypto trade is a taxable event",
      "Average cost method required for calculations",
    ],
    myth: null,
    docs: [
      "Exchange transaction history (CSV exports)",
      "Wallet addresses for on-chain transactions",
      "DeFi protocol interaction records",
      "Records of crypto received as income (mining, staking, airdrops)",
      "Cost basis records for original purchases",
      "Previous tax returns (if amending)",
      "Personnummer (personal identity number)",
    ],
  },
  DK: {
    deadline: "1 July",
    deadlineDate: new Date(2026, 6, 1),
    obligations: [
      "Crypto taxed as personal income or speculation gains",
      "Gains on crypto held as investment taxed at up to 52.07%",
      "Must report all trades individually",
      "Losses can be deducted against gains in same category",
    ],
    myth: null,
    docs: [
      "Exchange transaction history (CSV exports)",
      "Wallet addresses for on-chain transactions",
      "DeFi protocol interaction records",
      "Records of crypto received as income (mining, staking, airdrops)",
      "Cost basis records for original purchases",
      "Previous tax returns (if amending)",
      "CPR-nummer (civil registration number)",
    ],
  },
  IT: {
    deadline: "30 November",
    deadlineDate: new Date(2025, 10, 30),
    obligations: [
      "26% substitute tax on crypto capital gains",
      "€2,000 de minimis threshold removed from 2023",
      "RW form for foreign asset monitoring",
      "IVAFE tax on foreign financial assets",
    ],
    myth: null,
    docs: [
      "Exchange transaction history (CSV exports)",
      "Wallet addresses for on-chain transactions",
      "DeFi protocol interaction records",
      "Records of crypto received as income (mining, staking, airdrops)",
      "Cost basis records for original purchases",
      "Previous tax returns (if amending)",
      "Codice Fiscale (tax code)",
    ],
  },
  PT: {
    deadline: "30 June",
    deadlineDate: new Date(2026, 5, 30),
    obligations: [
      "28% tax on crypto gains held less than 365 days",
      "Long-term holdings (365+ days) are tax-free",
      "Must declare on Annex G of IRS return",
      "Airdrops and mining taxed as income",
    ],
    myth: {
      myth: "Portugal doesn't tax crypto.",
      reality:
        "Since 2023, Portugal taxes crypto gains at 28% for holdings under 365 days.",
    },
    docs: [
      "Exchange transaction history (CSV exports)",
      "Wallet addresses for on-chain transactions",
      "DeFi protocol interaction records",
      "Records of crypto received as income (mining, staking, airdrops)",
      "Cost basis records for original purchases",
      "Previous tax returns (if amending)",
      "NIF (numero de identificacao fiscal)",
    ],
  },
  ES: {
    deadline: "30 June",
    deadlineDate: new Date(2026, 5, 30),
    obligations: [
      "Progressive tax on crypto gains (19–28%)",
      "Modelo 720 for overseas assets over €50,000",
      "Modelo 721 for crypto assets over €50,000",
      "Each trade is a taxable event including swaps",
    ],
    myth: null,
    docs: [
      "Exchange transaction history (CSV exports)",
      "Wallet addresses for on-chain transactions",
      "DeFi protocol interaction records",
      "Records of crypto received as income (mining, staking, airdrops)",
      "Cost basis records for original purchases",
      "Previous tax returns (if amending)",
      "NIE / NIF (tax identification number)",
    ],
  },
};

/* ──────────────────────── Helpers ──────────────────────── */

interface CountryResult {
  code: string;
  label: string;
  flag: string;
  deadlineLabel: string;
  deadlineDate: Date;
  daysUntil: number;
  status: "overdue" | "urgent" | "upcoming" | "clear";
  obligations: string[];
  myth: { myth: string; reality: string } | null;
  docs: string[];
}

function getDaysUntil(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getStatus(days: number): "overdue" | "urgent" | "upcoming" | "clear" {
  if (days < 0) return "overdue";
  if (days <= 30) return "urgent";
  if (days <= 90) return "upcoming";
  return "clear";
}

function getComplexity(data: OnboardingData): { label: string; color: string } {
  const countryCount =
    1 + (data.hasPreviousCountries ? data.previousCountries.length : 0);
  const assetCount = data.assetTypes.length;
  const yearCount = data.taxYears.length;
  const hasDeFi = data.usedDefi === true;
  const manyExchanges =
    data.exchangeCount === "15–30" || data.exchangeCount === "30+";

  let score = countryCount * 2 + assetCount + yearCount;
  if (hasDeFi) score += 3;
  if (manyExchanges) score += 2;

  if (countryCount > 1 && score >= 10)
    return { label: "Multi-Jurisdiction Complex", color: "text-red-400" };
  if (score >= 8) return { label: "Complex", color: "text-orange-400" };
  if (score >= 5) return { label: "Moderate", color: "text-yellow-400" };
  return { label: "Simple", color: "text-teal" };
}

function getPriceRange(complexity: string): string {
  switch (complexity) {
    case "Simple":
      return "£150 – £350";
    case "Moderate":
      return "£350 – £750";
    case "Complex":
      return "£750 – £1,500";
    case "Multi-Jurisdiction Complex":
      return "£1,500 – £3,000+";
    default:
      return "£350 – £750";
  }
}

const STATUS_STYLES = {
  overdue: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-400",
    label: "Overdue",
    pulse: true,
  },
  urgent: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-400",
    label: "Urgent",
    pulse: true,
  },
  upcoming: {
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    text: "text-yellow-400",
    label: "Upcoming",
    pulse: false,
  },
  clear: {
    bg: "bg-teal/10",
    border: "border-teal/30",
    text: "text-teal",
    label: "On Track",
    pulse: false,
  },
};

/* ──────────────────── Subcomponents ──────────────────── */

function DeadlineCountdown({
  days,
  status,
}: {
  days: number;
  status: CountryResult["status"];
}) {
  const style = STATUS_STYLES[status];
  const absDays = Math.abs(days);

  return (
    <div className={`flex items-center gap-2 mt-1`}>
      {style.pulse && (
        <span className={`relative flex h-2.5 w-2.5`}>
          <span
            className={`animate-deadlinePulse absolute inline-flex h-full w-full rounded-full opacity-75 ${status === "overdue" ? "bg-red-400" : "bg-amber-400"}`}
          />
          <span
            className={`relative inline-flex rounded-full h-2.5 w-2.5 ${status === "overdue" ? "bg-red-400" : "bg-amber-400"}`}
          />
        </span>
      )}
      <span className={`text-sm font-medium ${style.text}`}>
        {days < 0
          ? `${absDays} day${absDays !== 1 ? "s" : ""} OVERDUE`
          : days === 0
            ? "Due today"
            : `${days} day${days !== 1 ? "s" : ""} until deadline`}
      </span>
    </div>
  );
}

function MythBuster({ myth }: { myth: { myth: string; reality: string } }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4 border-t border-gray-700/50 pt-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors w-full text-left"
      >
        <svg
          className={`w-4 h-4 transition-transform flex-shrink-0 ${open ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5l7 7-7 7"
          />
        </svg>
        <span className="font-medium">Common misconceptions</span>
      </button>
      {open && (
        <div className="mt-3 ml-6 space-y-2">
          <div className="bg-red-500/5 border border-red-500/15 rounded-lg px-4 py-3">
            <p className="text-sm">
              <span className="text-red-400 font-semibold">Myth: </span>
              <span className="text-gray-400">&ldquo;{myth.myth}&rdquo;</span>
            </p>
          </div>
          <div className="bg-teal/5 border border-teal/15 rounded-lg px-4 py-3">
            <p className="text-sm">
              <span className="text-teal font-semibold">Reality: </span>
              <span className="text-gray-300">{myth.reality}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function DocumentChecklist({ docs }: { docs: string[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-3 border-t border-gray-700/50 pt-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors w-full text-left"
      >
        <svg
          className={`w-4 h-4 transition-transform flex-shrink-0 ${open ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5l7 7-7 7"
          />
        </svg>
        <span className="font-medium">What you&apos;ll need</span>
      </button>
      {open && (
        <div className="mt-3 ml-6">
          <ul className="space-y-2">
            {docs.map((doc, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <div className="w-4 h-4 mt-0.5 rounded border border-gray-600 flex-shrink-0" />
                <span className="text-gray-400">{doc}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-gray-500 italic">
            Don&apos;t worry if you don&apos;t have everything yet. We&apos;ll
            help you gather what&apos;s needed.
          </p>
        </div>
      )}
    </div>
  );
}

function EmailModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (email) setSubmitted(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-navy-light border border-gray-700 rounded-2xl p-6 sm:p-8 max-w-md w-full">
        {!submitted ? (
          <>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <h3 className="text-xl font-bold mb-2">
              Save Your Compliance Map
            </h3>
            <p className="text-sm text-gray-400 mb-6">
              Enter your email to save your results and get deadline reminders
              so you never miss a filing date.
            </p>
            <form onSubmit={handleSubmit}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-navy border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-teal transition-colors mb-4"
              />
              <button
                type="submit"
                className="w-full px-6 py-3 bg-teal text-navy font-semibold rounded-lg hover:bg-teal-light transition-colors"
              >
                Save &amp; Get Reminders
              </button>
            </form>
            <p className="mt-3 text-xs text-gray-500 text-center">
              We&apos;ll only email you about your deadlines. No spam, ever.
            </p>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-teal/10 border border-teal/20 mb-4">
              <svg
                className="w-7 h-7 text-teal"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">You&apos;re all set!</h3>
            <p className="text-sm text-gray-400 mb-5">
              We&apos;ll send deadline reminders to{" "}
              <span className="text-white">{email}</span>
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-teal hover:text-teal-light transition-colors text-sm font-medium"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────────────── Main Component ──────────────────── */

interface Props {
  data: OnboardingData;
  onBack: () => void;
  submitted?: boolean;
}

export default function StepResults({ data, onBack, submitted }: Props) {
  const [showEmailModal, setShowEmailModal] = useState(false);

  const allCountryCodes = [
    data.currentCountry,
    ...data.previousCountries.map((pc) => pc.country),
  ].filter(Boolean);

  const uniqueCodes = Array.from(new Set(allCountryCodes));

  const results: CountryResult[] = uniqueCodes.map((code) => {
    const country = COUNTRIES.find((c) => c.code === code);
    const info = COUNTRY_DATA[code];
    const fallback: CountryInfo = {
      deadline: "Check local tax authority",
      deadlineDate: new Date(2026, 11, 31),
      obligations: ["Research local filing requirements"],
      myth: null,
      docs: [
        "Exchange transaction history (CSV exports)",
        "Wallet addresses for on-chain transactions",
        "Cost basis records for original purchases",
      ],
    };
    const d = info || fallback;
    const days = getDaysUntil(d.deadlineDate);
    const status = getStatus(days);

    return {
      code,
      label: country?.label || code,
      flag: country?.flag || "🏳️",
      deadlineLabel: d.deadline,
      deadlineDate: d.deadlineDate,
      daysUntil: days,
      status,
      obligations: d.obligations,
      myth: d.myth,
      docs: d.docs,
    };
  });

  // Sort: overdue first, then by days ascending
  results.sort((a, b) => a.daysUntil - b.daysUntil);

  const complexity = getComplexity(data);
  const price = getPriceRange(complexity.label);
  const jurisdictionCount = uniqueCodes.length;
  const yearCount = data.taxYears.length;

  return (
    <div className="w-full max-w-2xl pb-12">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
        Your Compliance Map
      </h1>
      <p className="text-gray-400 mb-8">
        Based on your answers, here&apos;s what you need to know.
      </p>

      {/* Complexity + Price */}
      <div className="bg-navy-light border border-gray-700 rounded-xl p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-sm text-gray-400">Estimated complexity</span>
          <p className={`text-xl font-bold ${complexity.color}`}>
            {complexity.label}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <span className="text-sm text-gray-400">Estimated price range</span>
          <p className="text-xl font-bold text-white">{price}</p>
        </div>
      </div>

      {/* Country cards */}
      <div className="space-y-4">
        {results.map((r) => {
          const style = STATUS_STYLES[r.status];
          return (
            <div
              key={r.code}
              className={`bg-navy-light border rounded-xl p-5 ${
                r.status === "overdue"
                  ? "border-red-500/30"
                  : "border-gray-700"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{r.flag}</span>
                  <div>
                    <h3 className="font-semibold text-lg">{r.label}</h3>
                    <p className="text-sm text-gray-400">
                      Filing deadline: {r.deadlineLabel}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${style.bg} ${style.text} ${style.pulse ? "animate-deadlinePulse" : ""}`}
                >
                  {style.label}
                </span>
              </div>

              {/* Countdown */}
              <div className="ml-11 mb-3">
                <DeadlineCountdown days={r.daysUntil} status={r.status} />
              </div>

              {/* Obligations */}
              <ul className="space-y-1.5 ml-11">
                {r.obligations.map((ob, i) => (
                  <li
                    key={i}
                    className="text-sm text-gray-400 flex items-start gap-2"
                  >
                    <span className="text-teal mt-1 text-xs">&#9679;</span>
                    {ob}
                  </li>
                ))}
              </ul>

              {/* Myth Buster */}
              {r.myth && (
                <div className="ml-11">
                  <MythBuster myth={r.myth} />
                </div>
              )}

              {/* Document Checklist */}
              <div className="ml-11">
                <DocumentChecklist docs={r.docs} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Exposure Section */}
      <div className="mt-8 bg-navy-light border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-3">
          Understanding Your Exposure
        </h3>
        <p className="text-sm text-gray-400 leading-relaxed mb-4">
          Based on your profile, you may have obligations in{" "}
          <span className="text-white font-medium">
            {jurisdictionCount} jurisdiction
            {jurisdictionCount !== 1 ? "s" : ""}
          </span>{" "}
          covering{" "}
          <span className="text-white font-medium">
            {yearCount} tax year{yearCount !== 1 ? "s" : ""}
          </span>
          .
          {jurisdictionCount > 1 &&
            " Multi-jurisdiction cases typically involve treaty considerations to avoid double taxation."}
        </p>
        <div className="bg-navy/60 border border-gray-700/50 rounded-lg px-4 py-3 flex items-start gap-3">
          <svg
            className="w-5 h-5 text-teal flex-shrink-0 mt-0.5"
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
          <p className="text-xs text-gray-400 leading-relaxed">
            These estimates are based on general rules. Your actual obligations
            depend on specific circumstances — transaction volumes, holding
            periods, and residency status all affect the outcome. That&apos;s
            why we connect you with jurisdiction-specific experts.
          </p>
        </div>
      </div>

      {/* Post-submission CTA or Save buttons */}
      {submitted ? (
        <>
          {/* Confirmation */}
          <div className="mt-8 bg-teal/5 border border-teal/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-teal/15 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">
                Your compliance map has been saved
              </h3>
            </div>

            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
              What happens next
            </h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0">&#128231;</span>
                <p className="text-sm text-gray-400">
                  <span className="text-gray-200 font-medium">Check your inbox</span>
                  {" — "}we&apos;ve sent your full compliance report to{" "}
                  <span className="text-white">{data.email}</span>
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0">&#128269;</span>
                <p className="text-sm text-gray-400">
                  <span className="text-gray-200 font-medium">Expert matching in progress</span>
                  {" — "}we&apos;re identifying the best professionals for your jurisdictions
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0">&#128222;</span>
                <p className="text-sm text-gray-400">
                  <span className="text-gray-200 font-medium">Expect a call within 24 hours</span>
                  {" "}from your dedicated compliance coordinator
                </p>
              </div>
            </div>
          </div>

          {/* Dashboard preview link */}
          <div className="mt-6">
            <Link
              href="/dashboard"
              className="flex items-center justify-between px-5 py-4 bg-navy-light border border-gray-700 rounded-xl hover:border-teal/30 transition-colors group"
            >
              <div>
                <p className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
                  In the meantime, explore what your Handy dashboard will look like
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  See the client workspace, expert coordination, and document hub
                </p>
              </div>
              <svg className="w-5 h-5 text-gray-500 group-hover:text-teal transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>

          {/* Contact */}
          <p className="mt-5 text-center text-sm text-gray-500">
            Questions? Email us at{" "}
            <span className="text-teal">hello@handytax.io</span>
          </p>
        </>
      ) : (
        <>
          {/* Save / Download (non-submitted fallback) */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowEmailModal(true)}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-navy-light border border-gray-700 rounded-lg text-white font-medium hover:border-teal/40 transition-colors"
            >
              Save My Compliance Map
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-navy-light border border-gray-700 rounded-lg text-gray-400 font-medium hover:border-gray-600 hover:text-gray-300 transition-colors">
              Download PDF Summary
            </button>
          </div>

          {/* CTA */}
          <div className="mt-8 bg-gradient-to-r from-teal/10 to-teal/5 border border-teal/20 rounded-xl p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">
              Ready to get compliant?
            </h3>
            <p className="text-sm text-gray-400 mb-5">
              Connect with a crypto-savvy tax professional who covers your
              jurisdictions.
            </p>
            <button className="px-8 py-3.5 bg-teal text-navy font-semibold rounded-lg hover:bg-teal-light transition-colors text-lg">
              Get Started — Talk to an Expert
            </button>
          </div>
        </>
      )}

      {/* Nav */}
      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3.5 text-gray-400 hover:text-white transition-colors text-sm"
        >
          &larr; Back
        </button>
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          Back to Home
        </Link>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <EmailModal onClose={() => setShowEmailModal(false)} />
      )}
    </div>
  );
}
