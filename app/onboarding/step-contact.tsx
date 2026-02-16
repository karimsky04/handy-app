"use client";

import { useState } from "react";
import { OnboardingData } from "./page";

interface Props {
  data: OnboardingData;
  update: (partial: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

function getComplexityLabel(data: OnboardingData): {
  label: string;
  price: string;
} {
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
    return { label: "Multi-Jurisdiction Complex", price: "£1,500 – £3,000+" };
  if (score >= 8) return { label: "Complex", price: "£750 – £1,500" };
  if (score >= 5) return { label: "Moderate", price: "£350 – £750" };
  return { label: "Simple", price: "£150 – £350" };
}

export default function StepContact({
  data,
  update,
  onNext,
  onBack,
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canProceed = data.fullName.trim() !== "" && data.email.trim() !== "";

  async function handleSubmit() {
    if (!canProceed || submitting) return;
    setSubmitting(true);
    setError("");

    const complexity = getComplexityLabel(data);

    try {
      const res = await fetch("/api/onboarding-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          fullName: data.fullName,
          phone: data.phone,
          currentCountry: data.currentCountry,
          previousCountries: data.previousCountries,
          assetTypes: data.assetTypes,
          exchangeCount: data.exchangeCount,
          usedDefi: data.usedDefi,
          taxYears: data.taxYears,
          filedCryptoBefore: data.filedCryptoBefore,
          accountantStatus: data.accountantStatus,
          complexityScore: complexity.label,
          estimatedPriceRange: complexity.price,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Submission failed");
      }

      onNext();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-xl">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
        Almost there — let&apos;s save your results
      </h1>
      <p className="text-gray-400 mb-8">
        We&apos;ll send your personalized compliance map and connect you with
        matched experts.
      </p>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Full name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={data.fullName}
            onChange={(e) => update({ fullName: e.target.value })}
            placeholder="Your full name"
            className="w-full bg-navy-light border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-teal transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Email <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => update({ email: e.target.value })}
            placeholder="you@example.com"
            className="w-full bg-navy-light border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-teal transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Phone <span className="text-gray-600">(optional)</span>
          </label>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => update({ phone: e.target.value })}
            placeholder="+44 7700 000000"
            className="w-full bg-navy-light border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-teal transition-colors"
          />
        </div>
      </div>

      {/* Privacy note */}
      <div className="mt-6 flex items-start gap-2.5 px-4 py-3 bg-navy-light/50 border border-gray-700/50 rounded-lg">
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
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <p className="text-xs text-gray-500 leading-relaxed">
          Your data is encrypted and stored securely. We never share your
          information with third parties.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Nav */}
      <div className="mt-8 flex items-center gap-4">
        <button
          onClick={onBack}
          className="px-6 py-3.5 text-gray-400 hover:text-white transition-colors text-sm"
        >
          &larr; Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canProceed || submitting}
          className="px-8 py-3.5 bg-teal text-navy font-semibold rounded-lg hover:bg-teal-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {submitting ? (
            <>
              <svg
                className="animate-spin w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Saving...
            </>
          ) : (
            "See My Compliance Map"
          )}
        </button>
      </div>
    </div>
  );
}
