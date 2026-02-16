"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

/* ═══════════════════════════ DATA ═══════════════════════════ */

interface CountryInfo {
  code: string;
  label: string;
  flag: string;
  regime: "dac8" | "carf" | "none";
  regimeLabel: string;
  badgeColor: string;
  badgeText: string;
  exchangeDate: string;
}

const COUNTRIES: CountryInfo[] = [
  {
    code: "GB",
    label: "United Kingdom",
    flag: "🇬🇧",
    regime: "carf",
    regimeLabel: "CARF",
    badgeColor: "amber",
    badgeText:
      "CARF Enrolled — Data exchange begins 2027",
    exchangeDate: "September 2027",
  },
  {
    code: "US",
    label: "United States",
    flag: "🇺🇸",
    regime: "carf",
    regimeLabel: "CARF",
    badgeColor: "amber",
    badgeText:
      "CARF Enrolled — Data exchange begins 2027",
    exchangeDate: "September 2027",
  },
  {
    code: "AU",
    label: "Australia",
    flag: "🇦🇺",
    regime: "carf",
    regimeLabel: "CARF",
    badgeColor: "amber",
    badgeText:
      "CARF Enrolled — Data exchange begins 2027",
    exchangeDate: "September 2027",
  },
  {
    code: "CA",
    label: "Canada",
    flag: "🇨🇦",
    regime: "carf",
    regimeLabel: "CARF",
    badgeColor: "amber",
    badgeText:
      "CARF Enrolled — Data exchange begins 2027",
    exchangeDate: "September 2027",
  },
  {
    code: "DE",
    label: "Germany",
    flag: "🇩🇪",
    regime: "dac8",
    regimeLabel: "DAC8",
    badgeColor: "red",
    badgeText:
      "DAC8 Active — Your country is collecting crypto data NOW (since January 2026)",
    exchangeDate: "January 2026",
  },
  {
    code: "FR",
    label: "France",
    flag: "🇫🇷",
    regime: "dac8",
    regimeLabel: "DAC8",
    badgeColor: "red",
    badgeText:
      "DAC8 Active — Your country is collecting crypto data NOW (since January 2026)",
    exchangeDate: "January 2026",
  },
  {
    code: "SE",
    label: "Sweden",
    flag: "🇸🇪",
    regime: "dac8",
    regimeLabel: "DAC8",
    badgeColor: "red",
    badgeText:
      "DAC8 Active — Your country is collecting crypto data NOW (since January 2026)",
    exchangeDate: "January 2026",
  },
  {
    code: "DK",
    label: "Denmark",
    flag: "🇩🇰",
    regime: "dac8",
    regimeLabel: "DAC8",
    badgeColor: "red",
    badgeText:
      "DAC8 Active — Your country is collecting crypto data NOW (since January 2026)",
    exchangeDate: "January 2026",
  },
  {
    code: "IT",
    label: "Italy",
    flag: "🇮🇹",
    regime: "dac8",
    regimeLabel: "DAC8",
    badgeColor: "red",
    badgeText:
      "DAC8 Active — Your country is collecting crypto data NOW (since January 2026)",
    exchangeDate: "January 2026",
  },
  {
    code: "PT",
    label: "Portugal",
    flag: "🇵🇹",
    regime: "dac8",
    regimeLabel: "DAC8",
    badgeColor: "red",
    badgeText:
      "DAC8 Active — Your country is collecting crypto data NOW (since January 2026)",
    exchangeDate: "January 2026",
  },
  {
    code: "ES",
    label: "Spain",
    flag: "🇪🇸",
    regime: "dac8",
    regimeLabel: "DAC8",
    badgeColor: "red",
    badgeText:
      "DAC8 Active — Your country is collecting crypto data NOW (since January 2026)",
    exchangeDate: "January 2026",
  },
];

const EXCHANGES = [
  { id: "binance", label: "Binance", reports: true },
  { id: "coinbase", label: "Coinbase", reports: true },
  { id: "kraken", label: "Kraken", reports: true },
  { id: "cryptocom", label: "Crypto.com", reports: true },
  { id: "bybit", label: "Bybit", reports: true },
  { id: "okx", label: "OKX", reports: true },
  { id: "bitstamp", label: "Bitstamp", reports: true },
  { id: "other_cex", label: "Other CEX", reports: true },
  { id: "dex_only", label: "DEX only", reports: false },
];

const RISK_FACTORS = [
  {
    id: "unreported",
    label: "I have unreported crypto gains from previous years",
    weight: 3,
  },
  {
    id: "crypto_to_crypto",
    label: "I've traded crypto-to-crypto",
    weight: 1,
  },
  {
    id: "defi",
    label: "I've used DeFi protocols",
    weight: 2,
  },
  {
    id: "foreign_exchanges",
    label: "I hold crypto on foreign exchanges",
    weight: 2,
  },
];

/* ═══════════════════════════ HELPERS ═══════════════════════════ */

type RiskLevel = "low" | "medium" | "high" | "critical";

function calculateRisk(
  country: CountryInfo | null,
  exchanges: string[],
  factors: string[]
): { level: RiskLevel; score: number } {
  let score = 0;

  if (country?.regime === "dac8") score += 3;
  else if (country?.regime === "carf") score += 2;

  const reportingExchanges = exchanges.filter(
    (id) => EXCHANGES.find((e) => e.id === id)?.reports
  );
  if (reportingExchanges.length >= 3) score += 2;
  else if (reportingExchanges.length >= 1) score += 1;

  for (const f of factors) {
    const factor = RISK_FACTORS.find((rf) => rf.id === f);
    if (factor) score += factor.weight;
  }

  if (score >= 8) return { level: "critical", score };
  if (score >= 5) return { level: "high", score };
  if (score >= 3) return { level: "medium", score };
  return { level: "low", score };
}

function getRiskStyle(level: RiskLevel) {
  switch (level) {
    case "critical":
      return {
        bg: "bg-red-500/10",
        border: "border-red-500/30",
        text: "text-red-400",
        label: "Critical",
        bar: "bg-red-500",
        barWidth: "100%",
      };
    case "high":
      return {
        bg: "bg-orange-500/10",
        border: "border-orange-500/30",
        text: "text-orange-400",
        label: "High",
        bar: "bg-orange-500",
        barWidth: "75%",
      };
    case "medium":
      return {
        bg: "bg-amber-500/10",
        border: "border-amber-500/30",
        text: "text-amber-400",
        label: "Medium",
        bar: "bg-amber-500",
        barWidth: "50%",
      };
    case "low":
      return {
        bg: "bg-teal/10",
        border: "border-teal/30",
        text: "text-teal",
        label: "Low",
        bar: "bg-teal",
        barWidth: "25%",
      };
  }
}

function getBullets(
  country: CountryInfo,
  factors: string[],
  exchanges: string[]
): string[] {
  const bullets: string[] = [];
  const regime = country.regimeLabel;

  if (country.regime === "dac8") {
    bullets.push(
      `Under DAC8, crypto service providers in the EU are already collecting and reporting your transaction data to ${country.label}'s tax authority.`
    );
  } else if (country.regime === "carf") {
    bullets.push(
      `Under CARF, your exchanges will begin reporting your transaction data to ${country.label}'s tax authority from ${country.exchangeDate}.`
    );
  }

  if (factors.includes("unreported")) {
    bullets.push(
      `Unreported gains from previous years will become visible to tax authorities once ${regime} data exchange is active.`
    );
  }

  if (factors.includes("foreign_exchanges")) {
    bullets.push(
      "Foreign exchanges will share your data with your home country under cross-border information exchange agreements."
    );
  }

  if (factors.includes("crypto_to_crypto") && !factors.includes("unreported")) {
    bullets.push(
      `Crypto-to-crypto trades are taxable events in ${country.label} — exchange data will reveal these transactions.`
    );
  }

  if (factors.includes("defi")) {
    bullets.push(
      "DeFi activity may not be directly reported by exchanges, but on-chain data is increasingly being cross-referenced by tax authorities."
    );
  }

  const reportingCount = exchanges.filter(
    (id) => EXCHANGES.find((e) => e.id === id)?.reports
  ).length;
  if (reportingCount > 0 && bullets.length < 3) {
    bullets.push(
      `${reportingCount} of your exchange${reportingCount > 1 ? "s" : ""} ${reportingCount > 1 ? "are" : "is"} required to report under ${regime}.`
    );
  }

  return bullets.slice(0, 3);
}

function getActions(level: RiskLevel, country: CountryInfo): string[] {
  if (level === "critical" || level === "high") {
    return [
      "Review all crypto transactions across exchanges and wallets for past tax years",
      `Consider a voluntary disclosure to ${country.label}'s tax authority before data exchange catches discrepancies`,
      "Consult a tax professional experienced in crypto compliance — penalties for voluntary disclosure are significantly lower",
    ];
  }
  if (level === "medium") {
    return [
      "Gather your exchange transaction history and confirm all disposals are accounted for",
      "Check that crypto-to-crypto trades have been reported as taxable events",
      "Consider a professional review to ensure nothing has been missed",
    ];
  }
  return [
    "Keep records of all transactions including cost basis documentation",
    `Stay informed about ${country.regimeLabel} reporting timelines for ${country.label}`,
    "Ensure future tax returns account for all crypto activity",
  ];
}

/* ═══════════════════════════ FAQ ═══════════════════════════ */

const FAQS = [
  {
    q: "Can I get in trouble for past crypto activity?",
    a: "Tax authorities are primarily interested in compliance going forward. However, once CARF/DAC8 data exchange is active, discrepancies between reported income and exchange data may trigger audits covering previous years. The severity of consequences depends on the amount involved and whether the failure to report was deliberate.",
  },
  {
    q: "What if I haven't reported my crypto taxes?",
    a: "Most jurisdictions offer voluntary disclosure programmes that significantly reduce penalties compared to being caught in an audit. Coming forward proactively is almost always better than waiting — both financially and legally. The exact terms vary by country.",
  },
  {
    q: "Is it too late to fix this?",
    a: "No. In most cases, you can file amended returns for previous years and make a voluntary disclosure. The key is to act before tax authorities contact you — once they initiate an investigation, the window for favourable treatment narrows significantly.",
  },
  {
    q: "What data are exchanges sharing?",
    a: "Under CARF and DAC8, exchanges report your full name, address, tax identification number, account balances, and details of every transaction — including buys, sells, swaps, and transfers. This data is then shared with your country of tax residence.",
  },
];

/* ═══════════════════════════ COMPONENT ═══════════════════════════ */

export default function CARFChecker() {
  /* State */
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedExchanges, setSelectedExchanges] = useState<string[]>([]);
  const [activatedFactors, setActivatedFactors] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const step2Ref = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const country = COUNTRIES.find((c) => c.code === selectedCountry) || null;
  const showStep2 = selectedCountry !== "";
  const showStep3 = selectedExchanges.length > 0;
  const showResults = showStep3 && activatedFactors.length > 0;

  const risk = showResults ? calculateRisk(country, selectedExchanges, activatedFactors) : null;
  const riskStyle = risk ? getRiskStyle(risk.level) : null;

  /* Scroll into view on step reveal */
  useEffect(() => {
    if (showStep2) step2Ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [showStep2]);

  useEffect(() => {
    if (showStep3) step3Ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [showStep3]);

  useEffect(() => {
    if (showResults) {
      const t = setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      return () => clearTimeout(t);
    }
  }, [showResults]);

  function toggleExchange(id: string) {
    setSelectedExchanges((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleFactor(id: string) {
    setActivatedFactors((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const reportingExchangeCount = selectedExchanges.filter(
    (id) => EXCHANGES.find((e) => e.id === id)?.reports
  ).length;

  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="px-6 sm:px-8 py-6 max-w-4xl mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight hover:opacity-80 transition-opacity"
        >
          Handy<span className="text-teal">.</span>
        </Link>
        <span className="text-xs text-gray-500 uppercase tracking-wider">
          Free Tool
        </span>
      </nav>

      <div className="max-w-4xl mx-auto px-6 sm:px-8 pb-20">
        {/* ─── HERO ─── */}
        <section className="pt-8 sm:pt-16 pb-12 sm:pb-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
            Is Your Country Sharing{" "}
            <span className="text-teal">Your Crypto Data</span>?
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl leading-relaxed">
            Starting 2026, tax authorities across 48 countries are exchanging
            cryptocurrency transaction data. Find out what this means for you
            in 60 seconds.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <span className="px-3 py-1.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
              DAC8 — EU — Active now
            </span>
            <span className="px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              CARF — OECD — From 2027
            </span>
            <span className="px-3 py-1.5 rounded-full bg-gray-500/10 text-gray-400 border border-gray-500/20">
              48 countries participating
            </span>
          </div>
        </section>

        {/* ─── STEP 1: Country ─── */}
        <section className="py-8 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-5">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-teal/10 border border-teal/30 text-teal text-sm font-bold">
              1
            </span>
            <h2 className="text-xl font-semibold">
              Where are you tax resident?
            </h2>
          </div>
          <select
            value={selectedCountry}
            onChange={(e) => {
              setSelectedCountry(e.target.value);
              setSelectedExchanges([]);
              setActivatedFactors([]);
              setEmailSubmitted(false);
            }}
            className="w-full sm:w-96 bg-navy-light border border-gray-700 rounded-lg px-4 py-3.5 text-white focus:outline-none focus:border-teal transition-colors appearance-none cursor-pointer text-base"
          >
            <option value="">Select your country</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.label}
              </option>
            ))}
          </select>

          {/* Status badge */}
          {country && (
            <div
              className={`mt-4 px-4 py-3 rounded-lg border ${
                country.badgeColor === "red"
                  ? "bg-red-500/8 border-red-500/25"
                  : country.badgeColor === "amber"
                    ? "bg-amber-500/8 border-amber-500/25"
                    : "bg-green-500/8 border-green-500/25"
              }`}
            >
              <p
                className={`text-sm font-medium ${
                  country.badgeColor === "red"
                    ? "text-red-400"
                    : country.badgeColor === "amber"
                      ? "text-amber-400"
                      : "text-green-400"
                }`}
              >
                {country.badgeColor === "red"
                  ? "🔴"
                  : country.badgeColor === "amber"
                    ? "🟡"
                    : "🟢"}{" "}
                {country.badgeText}
              </p>
            </div>
          )}
        </section>

        {/* ─── STEP 2: Exchanges ─── */}
        {showStep2 && (
          <section ref={step2Ref} className="py-8 border-t border-gray-800">
            <div className="flex items-center gap-3 mb-5">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-teal/10 border border-teal/30 text-teal text-sm font-bold">
                2
              </span>
              <h2 className="text-xl font-semibold">
                What exchanges do you use?
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {EXCHANGES.map((ex) => {
                const selected = selectedExchanges.includes(ex.id);
                return (
                  <button
                    key={ex.id}
                    onClick={() => toggleExchange(ex.id)}
                    className={`px-4 py-3 rounded-lg border text-sm font-medium text-left transition-all ${
                      selected
                        ? "bg-teal/10 border-teal/40 text-white"
                        : "bg-navy-light border-gray-700 text-gray-400 hover:border-gray-600"
                    }`}
                  >
                    {ex.label}
                  </button>
                );
              })}
            </div>

            {selectedExchanges.length > 0 && country && (
              <div className="mt-4 px-4 py-3 rounded-lg bg-navy-light border border-gray-700">
                <p className="text-sm text-gray-300">
                  <span className="text-white font-semibold">
                    {reportingExchangeCount}
                  </span>{" "}
                  of your exchange{selectedExchanges.length !== 1 ? "s" : ""}{" "}
                  {reportingExchangeCount === 1 ? "is" : "are"} required to
                  report your data to{" "}
                  <span className="text-white">{country.label}</span> tax
                  authorities under{" "}
                  <span className="text-white">{country.regimeLabel}</span>.
                </p>
              </div>
            )}
          </section>
        )}

        {/* ─── STEP 3: Situation ─── */}
        {showStep3 && (
          <section ref={step3Ref} className="py-8 border-t border-gray-800">
            <div className="flex items-center gap-3 mb-5">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-teal/10 border border-teal/30 text-teal text-sm font-bold">
                3
              </span>
              <h2 className="text-xl font-semibold">Your situation</h2>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Select everything that applies. This stays private — we don&apos;t
              store your answers.
            </p>
            <div className="space-y-2.5">
              {RISK_FACTORS.map((factor) => {
                const active = activatedFactors.includes(factor.id);
                return (
                  <button
                    key={factor.id}
                    onClick={() => toggleFactor(factor.id)}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-lg border text-left transition-all ${
                      active
                        ? factor.weight >= 3
                          ? "bg-red-500/8 border-red-500/30 text-white"
                          : factor.weight >= 2
                            ? "bg-amber-500/8 border-amber-500/30 text-white"
                            : "bg-teal/8 border-teal/30 text-white"
                        : "bg-navy-light border-gray-700 text-gray-400 hover:border-gray-600"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        active
                          ? factor.weight >= 3
                            ? "bg-red-500 border-red-500"
                            : factor.weight >= 2
                              ? "bg-amber-500 border-amber-500"
                              : "bg-teal border-teal"
                          : "border-gray-600"
                      }`}
                    >
                      {active && (
                        <svg
                          className="w-3 h-3 text-navy"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm font-medium">{factor.label}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ─── RESULTS ─── */}
        {showResults && risk && riskStyle && country && (
          <section ref={resultsRef} className="py-8 border-t border-gray-800">
            {/* Risk Card */}
            <div
              className={`rounded-xl border p-6 sm:p-8 ${riskStyle.border} ${riskStyle.bg}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div>
                  <span className="text-sm text-gray-400 uppercase tracking-wider">
                    Your risk level
                  </span>
                  <p className={`text-3xl font-bold ${riskStyle.text}`}>
                    {riskStyle.label}
                  </p>
                </div>
                <div className="w-full sm:w-48">
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${riskStyle.bar}`}
                      style={{ width: riskStyle.barWidth }}
                    />
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="mb-5 px-4 py-3 bg-navy/40 rounded-lg">
                <p className="text-sm text-gray-300">
                  <span className="font-semibold text-white">Timeline:</span>{" "}
                  Your exchange data will be shared with{" "}
                  <span className="text-white">{country.label}</span> tax
                  authority by{" "}
                  <span className="text-white font-semibold">
                    {country.exchangeDate}
                  </span>
                  .
                </p>
              </div>

              {/* What it means */}
              <div className="mb-5">
                <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
                  What this means for you
                </h4>
                <ul className="space-y-2">
                  {getBullets(country, activatedFactors, selectedExchanges).map(
                    (b, i) => (
                      <li
                        key={i}
                        className="text-sm text-gray-400 flex items-start gap-2.5"
                      >
                        <span
                          className={`mt-1.5 text-[6px] ${riskStyle.text}`}
                        >
                          &#9679;
                        </span>
                        {b}
                      </li>
                    )
                  )}
                </ul>
              </div>

              {/* What to do */}
              <div>
                <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
                  What to do now
                </h4>
                <ol className="space-y-2">
                  {getActions(risk.level, country).map((a, i) => (
                    <li
                      key={i}
                      className="text-sm text-gray-400 flex items-start gap-2.5"
                    >
                      <span className="text-teal font-semibold flex-shrink-0 mt-px">
                        {i + 1}.
                      </span>
                      {a}
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* High/Critical Warning */}
            {(risk.level === "high" || risk.level === "critical") && (
              <div className="mt-5 px-5 py-4 rounded-xl bg-red-500/5 border border-red-500/20">
                <p className="text-sm text-red-300 leading-relaxed mb-3">
                  <span className="font-semibold">&#9888;&#65039; Based on your answers,</span>{" "}
                  you may have unreported obligations that tax authorities will
                  soon have data to identify.
                </p>
                <p className="text-sm text-gray-400 leading-relaxed">
                  <span className="text-teal font-semibold">
                    The good news:
                  </span>{" "}
                  voluntary disclosure before authorities contact you typically
                  results in significantly lower penalties.
                </p>
              </div>
            )}

            {/* ─── LEAD CAPTURE ─── */}
            <div className="mt-8 bg-navy-light border border-gray-700 rounded-xl p-6 sm:p-8">
              {!emailSubmitted ? (
                <>
                  <h3 className="text-lg font-semibold mb-2">
                    Get your full personalized compliance report
                  </h3>
                  <p className="text-sm text-gray-400 mb-5">
                    We&apos;ll send you a detailed breakdown of your
                    obligations, key deadlines, and recommended next steps.
                    No spam, no sales calls.
                  </p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (email) setEmailSubmitted(true);
                    }}
                    className="flex flex-col sm:flex-row gap-3"
                  >
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="flex-1 bg-navy border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-teal transition-colors"
                    />
                    <button
                      type="submit"
                      className="px-6 py-3 bg-teal text-navy font-semibold rounded-lg hover:bg-teal-light transition-colors whitespace-nowrap"
                    >
                      Send My Report
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center py-2">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-teal/10 border border-teal/20 mb-3">
                    <svg
                      className="w-6 h-6 text-teal"
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
                  <p className="font-semibold mb-1">
                    Check your inbox.
                  </p>
                  <p className="text-sm text-gray-400 mb-4">
                    Want to go deeper? Get a full compliance assessment with
                    jurisdiction-specific guidance.
                  </p>
                  <Link
                    href="/onboarding"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-teal text-navy font-semibold rounded-lg hover:bg-teal-light transition-colors"
                  >
                    Start Full Assessment
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ─── EXPLAINERS ─── */}
        <section className="py-12 border-t border-gray-800 mt-4">
          <div className="grid sm:grid-cols-2 gap-6 mb-8">
            <div className="bg-navy-light border border-gray-700 rounded-xl p-6">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span className="text-red-400">&#9679;</span> What is DAC8?
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                DAC8 (Directive on Administrative Cooperation 8) is the EU&apos;s
                framework requiring all crypto asset service providers operating
                in the EU to collect and report user transaction data to tax
                authorities. Active since January 2026, it covers all EU member
                states and enables automatic cross-border information exchange
                within the EU.
              </p>
            </div>
            <div className="bg-navy-light border border-gray-700 rounded-xl p-6">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span className="text-amber-400">&#9679;</span> What is CARF?
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                CARF (Crypto-Asset Reporting Framework) is the OECD&apos;s global
                standard for automatic exchange of crypto tax information between
                countries. Adopted by 48 jurisdictions including the US, UK,
                Canada, and Australia, it requires exchanges to report your
                transaction data to your country of tax residence. First
                exchanges are expected in 2027.
              </p>
            </div>
          </div>

          <div className="bg-navy-light border border-teal/20 rounded-xl p-6 mb-10">
            <h3 className="font-semibold mb-2">How Handy Helps</h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-3">
              Handy maps your crypto activity against jurisdiction-specific tax
              rules, identifies your exact obligations, and connects you with
              professionals who specialise in cross-border crypto compliance.
            </p>
            <Link
              href="/"
              className="text-sm text-teal hover:text-teal-light transition-colors font-medium"
            >
              Learn more about Handy &rarr;
            </Link>
          </div>

          {/* FAQ */}
          <h3 className="text-xl font-semibold mb-5">
            Frequently Asked Questions
          </h3>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className="bg-navy-light border border-gray-700 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className="font-medium text-sm sm:text-base pr-4">
                    {faq.q}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
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
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-8 pb-4 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <span>&copy; 2026 Handy. All rights reserved.</span>
          <Link
            href="/"
            className="hover:text-gray-300 transition-colors"
          >
            handy.tax
          </Link>
        </footer>
      </div>
    </main>
  );
}
