"use client";

import { useState } from "react";
import Link from "next/link";

/* ═══════════════════════ DATA ═══════════════════════ */

const COUNTRIES = [
  { code: "GB", label: "United Kingdom", flag: "\u{1F1EC}\u{1F1E7}" },
  { code: "US", label: "United States", flag: "\u{1F1FA}\u{1F1F8}" },
  { code: "AU", label: "Australia", flag: "\u{1F1E6}\u{1F1FA}" },
  { code: "CA", label: "Canada", flag: "\u{1F1E8}\u{1F1E6}" },
  { code: "DE", label: "Germany", flag: "\u{1F1E9}\u{1F1EA}" },
  { code: "FR", label: "France", flag: "\u{1F1EB}\u{1F1F7}" },
  { code: "SE", label: "Sweden", flag: "\u{1F1F8}\u{1F1EA}" },
  { code: "DK", label: "Denmark", flag: "\u{1F1E9}\u{1F1F0}" },
  { code: "IT", label: "Italy", flag: "\u{1F1EE}\u{1F1F9}" },
  { code: "PT", label: "Portugal", flag: "\u{1F1F5}\u{1F1F9}" },
  { code: "ES", label: "Spain", flag: "\u{1F1EA}\u{1F1F8}" },
];

const SPECIALIZATIONS = [
  "Cryptocurrency & digital assets",
  "Stocks, ETFs & investments",
  "Self-employment & freelance",
  "Employment income (multi-country)",
  "Rental property & real estate",
  "Pensions & retirement",
  "Corporate / business tax",
  "VAT / GST",
  "Estate / inheritance",
];

const LANGUAGES = [
  "English",
  "French",
  "German",
  "Spanish",
  "Portuguese",
  "Italian",
  "Swedish",
  "Danish",
  "Dutch",
  "Other",
];

const REFERRAL_OPTIONS = [
  "Google",
  "LinkedIn",
  "Referral from another expert",
  "Referral from a client",
  "Social media",
  "Conference / event",
  "Other",
];

/* ═══════════════════════ SUBCOMPONENTS ═══════════════════════ */

function MultiCheckbox({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  function toggle(opt: string) {
    if (selected.includes(opt)) {
      onChange(selected.filter((s) => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  }

  return (
    <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
      {options.map((opt) => {
        const checked = selected.includes(opt);
        return (
          <label
            key={opt}
            className="flex items-center gap-2.5 py-1 cursor-pointer group"
          >
            <div
              onClick={() => toggle(opt)}
              className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                checked
                  ? "bg-teal border-teal"
                  : "border-gray-600 group-hover:border-gray-500"
              }`}
            >
              {checked && (
                <span className="text-[10px] leading-none text-navy font-bold">
                  &#10003;
                </span>
              )}
            </div>
            <span className="text-sm text-gray-300">{opt}</span>
          </label>
        );
      })}
    </div>
  );
}

/* ═══════════════════════ SHARED INPUT STYLE ═══════════════════════ */

const INPUT_CLASS =
  "w-full bg-navy-light border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal transition-colors";

const SELECT_CLASS =
  "w-full bg-navy-light border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal transition-colors appearance-none";

/* ═══════════════════════ PAGE ═══════════════════════ */

export default function ExpertJoinPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [professionalTitle, setProfessionalTitle] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [crossBorderExp, setCrossBorderExp] = useState<string>("");
  const [annualClients, setAnnualClients] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [website, setWebsite] = useState("");
  const [practiceDescription, setPracticeDescription] = useState("");
  const [referralSource, setReferralSource] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch("/api/expert-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          country,
          professionalTitle,
          licenseNumber,
          yearsExperience,
          specializations,
          crossBorderExperience: crossBorderExp === "yes",
          annualClients,
          languages,
          website: website || null,
          practiceDescription: practiceDescription || null,
          referralSource: referralSource || null,
        }),
      });
      setSubmitted(true);
    } catch {
      alert("Something went wrong. Please try again.");
    }
    setSubmitting(false);
  }

  /* ── Confirmation Screen ── */
  if (submitted) {
    return (
      <main className="min-h-screen flex flex-col">
        <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            Handy<span className="text-teal">.</span>
          </Link>
        </nav>

        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-lg w-full text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal/10 border border-teal/20 mb-6">
              <span className="text-3xl">&#10003;</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">Application Received</h1>
            <p className="text-gray-400 mb-8">
              Thank you, {fullName}. Here&apos;s what happens next:
            </p>

            <div className="space-y-4 text-left max-w-md mx-auto mb-8">
              {[
                {
                  num: "1",
                  title: "Credential review",
                  desc: "We review your qualifications and credentials (24-48 hours)",
                },
                {
                  num: "2",
                  title: "Onboarding call",
                  desc: "A brief call to discuss your specializations and how Handy works (15 minutes)",
                },
                {
                  num: "3",
                  title: "Profile activation",
                  desc: "You'll start receiving client matches within your first week",
                },
              ].map((step) => (
                <div
                  key={step.num}
                  className="flex items-start gap-4 bg-navy-light border border-gray-800 rounded-xl p-4"
                >
                  <div className="w-7 h-7 rounded-full bg-teal/10 border border-teal/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-teal">
                      {step.num}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-200">
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-sm text-gray-500">
              Questions? Email us at{" "}
              <span className="text-teal">experts@handytax.io</span>
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* ── Main Page ── */
  return (
    <main className="min-h-screen flex flex-col">
      {/* Nav — matches landing page */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          Handy<span className="text-teal">.</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-teal transition-colors hidden sm:block"
          >
            For Clients
          </Link>
          <a
            href="#apply"
            className="text-sm text-teal hover:text-teal-light transition-colors font-medium"
          >
            Apply Now
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-8 py-16 sm:py-24">
        <div className="max-w-3xl text-center">
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight">
            Grow Your Practice With Global Clients
          </h1>
          <p className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Join Handy&apos;s expert network and get matched with cross-border
            clients who need your jurisdiction expertise. We handle the client
            acquisition, platform, and coordination — you focus on what you do
            best.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#apply"
              className="inline-flex items-center justify-center px-8 py-4 bg-teal text-navy font-semibold rounded-lg hover:bg-teal-light transition-colors text-lg"
            >
              Apply to Join
            </a>
          </div>
          <p className="mt-6 text-sm text-gray-500">
            Currently onboarding experts in 11 jurisdictions
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-8 py-20 max-w-5xl mx-auto w-full">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
          How It Works
        </h2>
        <div className="grid sm:grid-cols-3 gap-8">
          {[
            {
              step: "1",
              title: "We Find the Clients",
              desc: "Cross-border individuals and investors find Handy through our compliance tools. They complete an onboarding assessment that maps their jurisdictions, asset types, and complexity.",
            },
            {
              step: "2",
              title: "We Match Them to You",
              desc: "Our matching algorithm considers jurisdiction, specialization, language, complexity level, and availability. You only see clients that fit your expertise.",
            },
            {
              step: "3",
              title: "You Do the Expert Work",
              desc: "Use Handy\u2019s collaboration workspace to communicate with clients, share documents, coordinate with experts in other jurisdictions, and track progress. We handle billing and payments.",
            },
          ].map((s) => (
            <div key={s.step} className="bg-navy-light rounded-xl p-6 border border-gray-800">
              <div className="w-10 h-10 rounded-full bg-teal/10 border border-teal/20 flex items-center justify-center mb-4">
                <span className="text-sm font-bold text-teal">{s.step}</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Experts Join */}
      <section className="px-8 py-20 border-t border-gray-800">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Why Experts Join
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                icon: "\u25C6",
                title: "Clients Come to You",
                desc: "No more marketing, no cold outreach. We deliver pre-qualified clients who\u2019ve already mapped their obligations and are ready to engage.",
              },
              {
                icon: "\u25C6",
                title: "Cross-Border Coordination Built In",
                desc: "Working with a client who has obligations in 3 countries? Our platform connects you with vetted experts in other jurisdictions. Share context, coordinate treaty positions, collaborate seamlessly.",
              },
              {
                icon: "\u25C6",
                title: "Transparent, Fixed Pricing",
                desc: "No hourly rate negotiations. Cases are priced by complexity upfront. You know what you\u2019ll earn before accepting a client. Typical per-case earnings: \u00A3350\u2013\u00A31,200.",
              },
              {
                icon: "\u25C6",
                title: "Built for Modern Practice",
                desc: "Digital-first workspace, secure document sharing, integrated messaging, automated deadline tracking. Everything in one place instead of scattered across email, WhatsApp, and Dropbox.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="bg-navy-light rounded-xl p-6 border border-gray-800"
              >
                <div className="text-teal text-2xl mb-3">{card.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{card.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="px-8 py-20 border-t border-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-teal font-medium mb-8">
            Trusted by 40+ clients across 8 countries
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                quote:
                  "Handy sends me clients I\u2019d never reach on my own \u2014 international crypto investors who need exactly my specialization. The coordination with other jurisdiction experts is something I couldn\u2019t do alone.",
                name: "Sarah M.",
                title: "ACCA, London",
              },
              {
                quote:
                  "The platform handles all the back-and-forth with clients. I get the data I need, do my analysis, and upload the results. No chasing for documents.",
                name: "Pierre D.",
                title: "Expert-Comptable, Paris",
              },
            ].map((q) => (
              <div
                key={q.name}
                className="bg-navy-light border border-gray-800 rounded-xl p-6 text-left"
              >
                <p className="text-sm text-gray-300 leading-relaxed italic mb-4">
                  &ldquo;{q.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal/10 border border-teal/20 flex items-center justify-center text-teal text-xs font-bold">
                    {q.name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")}
                  </div>
                  <div>
                    <p className="text-sm text-gray-200 font-medium">
                      {q.name}
                    </p>
                    <p className="text-xs text-gray-500">{q.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Earnings */}
      <section className="px-8 py-20 border-t border-gray-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            What You Can Earn
          </h2>
          <p className="text-sm text-gray-500 text-center mb-8">
            Transparent breakdown &mdash; no hidden fees
          </p>

          <div className="bg-navy-light border border-gray-800 rounded-xl overflow-hidden mb-4">
            <div className="hidden sm:grid grid-cols-4 gap-2 px-5 py-3 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
              <span>Case Type</span>
              <span>Typical Fee</span>
              <span>Your Earnings</span>
              <span>Estimated Hours</span>
            </div>
            {[
              {
                type: "Simple",
                sub: "Single jurisdiction, single asset",
                fee: "\u00A3400 \u2013 \u00A3600",
                earn: "\u00A3300 \u2013 \u00A3450",
                hours: "2-4 hours",
              },
              {
                type: "Moderate",
                sub: "Single jurisdiction, multi-asset",
                fee: "\u00A3600 \u2013 \u00A31,000",
                earn: "\u00A3450 \u2013 \u00A3750",
                hours: "4-6 hours",
              },
              {
                type: "Complex",
                sub: "High volume, DeFi, multi-asset",
                fee: "\u00A31,000 \u2013 \u00A31,500",
                earn: "\u00A3750 \u2013 \u00A31,200",
                hours: "6-10 hours",
              },
              {
                type: "Multi-Jurisdiction",
                sub: "Per additional jurisdiction",
                fee: "+\u00A3200 \u2013 \u00A3500",
                earn: "+\u00A3150 \u2013 \u00A3400",
                hours: "+2-4 hours",
              },
            ].map((row, i) => (
              <div
                key={row.type}
                className={`grid sm:grid-cols-4 gap-2 px-5 py-4 ${
                  i > 0 ? "border-t border-gray-800" : ""
                }`}
              >
                <div>
                  <p className="text-sm text-gray-200 font-medium">
                    {row.type}
                  </p>
                  {row.sub && (
                    <p className="text-xs text-gray-500">{row.sub}</p>
                  )}
                </div>
                <p className="text-sm text-gray-400">{row.fee}</p>
                <p className="text-sm text-teal font-medium">{row.earn}</p>
                <p className="text-sm text-gray-400">{row.hours}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-500 text-center leading-relaxed">
            Handy retains a 20-25% platform fee that covers client acquisition,
            platform infrastructure, payment processing, and coordination
            services.
          </p>
        </div>
      </section>

      {/* Application Form */}
      <section
        id="apply"
        className="px-8 py-20 border-t border-gray-800 scroll-mt-8"
      >
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2">
            Apply to Join the Expert Network
          </h2>
          <p className="text-sm text-gray-500 text-center mb-10">
            Applications are reviewed within 48 hours. We&apos;re selective to
            maintain quality for our clients.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name + Email */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">
                  Full name <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Sarah Mitchell"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="sarah@mitchelltax.co.uk"
                />
              </div>
            </div>

            {/* Phone + Country */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">
                  Phone <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="+44 7700 000000"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">
                  Country of practice{" "}
                  <span className="text-red-400">*</span>
                </label>
                <select
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className={SELECT_CLASS}
                >
                  <option value="">Select country</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Title + License */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">
                  Professional title / qualification{" "}
                  <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  value={professionalTitle}
                  onChange={(e) => setProfessionalTitle(e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="e.g., ACCA, CPA, Expert-Comptable"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">
                  License / registration number{" "}
                  <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="e.g., ACCA #2847193"
                />
              </div>
            </div>

            {/* Years experience */}
            <div>
              <label className="text-xs text-gray-500 block mb-1.5">
                Years of experience <span className="text-red-400">*</span>
              </label>
              <select
                required
                value={yearsExperience}
                onChange={(e) => setYearsExperience(e.target.value)}
                className={`${SELECT_CLASS} sm:w-48`}
              >
                <option value="">Select</option>
                <option value="1-3">1-3 years</option>
                <option value="3-5">3-5 years</option>
                <option value="5-10">5-10 years</option>
                <option value="10+">10+ years</option>
              </select>
            </div>

            {/* Specializations */}
            <div>
              <label className="text-xs text-gray-500 block mb-2">
                Specializations (select all that apply)
              </label>
              <MultiCheckbox
                options={SPECIALIZATIONS}
                selected={specializations}
                onChange={setSpecializations}
              />
            </div>

            {/* Cross-border */}
            <div>
              <label className="text-xs text-gray-500 block mb-2">
                Do you have experience with cross-border / international tax?{" "}
                <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-4">
                {["yes", "no"].map((v) => (
                  <label
                    key={v}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <div
                      onClick={() => setCrossBorderExp(v)}
                      className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                        crossBorderExp === v
                          ? "border-teal bg-teal"
                          : "border-gray-600"
                      }`}
                    >
                      {crossBorderExp === v && (
                        <div className="w-1.5 h-1.5 rounded-full bg-navy" />
                      )}
                    </div>
                    <span className="text-sm text-gray-300 capitalize">
                      {v}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Annual clients */}
            <div>
              <label className="text-xs text-gray-500 block mb-1.5">
                How many individual tax clients do you currently serve annually?
              </label>
              <select
                value={annualClients}
                onChange={(e) => setAnnualClients(e.target.value)}
                className={`${SELECT_CLASS} sm:w-48`}
              >
                <option value="">Select</option>
                <option value="Under 20">Under 20</option>
                <option value="20-50">20-50</option>
                <option value="50-100">50-100</option>
                <option value="100+">100+</option>
              </select>
            </div>

            {/* Languages */}
            <div>
              <label className="text-xs text-gray-500 block mb-2">
                Languages spoken
              </label>
              <MultiCheckbox
                options={LANGUAGES}
                selected={languages}
                onChange={setLanguages}
              />
            </div>

            {/* Website */}
            <div>
              <label className="text-xs text-gray-500 block mb-1.5">
                Website or LinkedIn URL{" "}
                <span className="text-gray-600">(optional)</span>
              </label>
              <input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className={INPUT_CLASS}
                placeholder="https://..."
              />
            </div>

            {/* Practice description */}
            <div>
              <label className="text-xs text-gray-500 block mb-1.5">
                Brief description of your practice{" "}
                <span className="text-gray-600">(optional)</span>
              </label>
              <textarea
                value={practiceDescription}
                onChange={(e) => setPracticeDescription(e.target.value)}
                rows={3}
                className={`${INPUT_CLASS} resize-none`}
                placeholder="Tell us about your practice, specializations, and why you're interested in joining Handy's network"
              />
            </div>

            {/* Referral source */}
            <div>
              <label className="text-xs text-gray-500 block mb-1.5">
                How did you hear about Handy?
              </label>
              <select
                value={referralSource}
                onChange={(e) => setReferralSource(e.target.value)}
                className={`${SELECT_CLASS} sm:w-64`}
              >
                <option value="">Select</option>
                {REFERRAL_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting || !crossBorderExp}
                className="w-full sm:w-auto px-10 py-3.5 bg-teal text-navy font-semibold rounded-lg hover:bg-teal-light transition-colors text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting..." : "Submit Application"}
              </button>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              Your information is used solely for evaluating your application.
              We verify all professional credentials before activation.
            </p>
          </form>
        </div>
      </section>

      {/* Footer — matches landing page */}
      <footer className="px-8 py-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-gray-500">
          <span>&copy; 2026 Handy. All rights reserved.</span>
          <Link
            href="/"
            className="hover:text-teal transition-colors"
          >
            Back to Handy.
          </Link>
        </div>
      </footer>
    </main>
  );
}
