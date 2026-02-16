"use client";

import { useState } from "react";
import Link from "next/link";
import ProgressBar from "./progress-bar";
import StepResidence from "./step-residence";
import StepAssets from "./step-assets";
import StepTaxYears from "./step-tax-years";
import StepAccountant from "./step-accountant";
import StepResults from "./step-results";

export interface PreviousCountry {
  country: string;
  movedFrom: string;
  movedTo: string;
}

export interface OnboardingData {
  currentCountry: string;
  hasPreviousCountries: boolean;
  previousCountries: PreviousCountry[];
  assetTypes: string[];
  exchangeCount: string;
  usedDefi: boolean | null;
  taxYears: string[];
  filedCryptoBefore: boolean | null;
  accountantStatus: string;
}

const INITIAL_DATA: OnboardingData = {
  currentCountry: "",
  hasPreviousCountries: false,
  previousCountries: [],
  assetTypes: [],
  exchangeCount: "",
  usedDefi: null,
  taxYears: [],
  filedCryptoBefore: null,
  accountantStatus: "",
};

const STEP_TITLES = [
  "Where do you live?",
  "What do you have?",
  "Tax years",
  "Your accountant",
  "Your Compliance Map",
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  const totalSteps = 5;

  function next() {
    if (step < totalSteps - 1) {
      setDirection("forward");
      setStep((s) => s + 1);
    }
  }

  function back() {
    if (step > 0) {
      setDirection("back");
      setStep((s) => s - 1);
    }
  }

  function update(partial: Partial<OnboardingData>) {
    setData((prev) => ({ ...prev, ...partial }));
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 sm:px-8 py-6 max-w-7xl mx-auto w-full">
        <Link
          href="/"
          className="text-2xl font-bold tracking-tight hover:opacity-80 transition-opacity"
        >
          Handy<span className="text-teal">.</span>
        </Link>
        {step < totalSteps - 1 && (
          <span className="text-sm text-gray-500">
            Step {step + 1} of {totalSteps - 1}
          </span>
        )}
      </nav>

      {/* Progress */}
      <ProgressBar current={step} total={totalSteps} />

      {/* Step Content */}
      <section
        key={step}
        className={`flex-1 flex items-start sm:items-center justify-center px-4 sm:px-8 py-8 sm:py-0 animate-${direction === "forward" ? "slideIn" : "slideBack"}`}
      >
        {step === 0 && (
          <StepResidence data={data} update={update} onNext={next} />
        )}
        {step === 1 && (
          <StepAssets
            data={data}
            update={update}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 2 && (
          <StepTaxYears
            data={data}
            update={update}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 3 && (
          <StepAccountant
            data={data}
            update={update}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 4 && <StepResults data={data} onBack={back} />}
      </section>
    </main>
  );
}
