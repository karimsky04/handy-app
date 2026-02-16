import { OnboardingData } from "./page";

const TAX_YEARS = ["2024/25", "2023/24", "2022/23", "2021/22", "Earlier"];

interface Props {
  data: OnboardingData;
  update: (partial: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepTaxYears({ data, update, onNext, onBack }: Props) {
  function toggleYear(year: string) {
    const current = data.taxYears;
    if (current.includes(year)) {
      update({ taxYears: current.filter((y) => y !== year) });
    } else {
      update({ taxYears: [...current, year] });
    }
  }

  const canProceed =
    data.taxYears.length > 0 && data.filedCryptoBefore !== null;

  return (
    <div className="w-full max-w-xl">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
        Which tax years need help?
      </h1>
      <p className="text-gray-400 mb-8">
        Select all tax years you need to review or file for.
      </p>

      {/* Tax year multi-select */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {TAX_YEARS.map((year) => {
          const selected = data.taxYears.includes(year);
          return (
            <button
              key={year}
              onClick={() => toggleYear(year)}
              className={`px-4 py-4 rounded-xl border text-center font-medium transition-all ${
                selected
                  ? "bg-teal/10 border-teal/40 text-teal"
                  : "bg-navy-light border-gray-700 text-gray-400 hover:border-gray-600"
              }`}
            >
              {year}
            </button>
          );
        })}
      </div>

      {/* Filed before */}
      <div className="mt-8">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Have you filed crypto taxes before?
        </label>
        <div className="flex gap-3">
          {[
            { value: true, label: "Yes" },
            { value: false, label: "No" },
          ].map((opt) => (
            <button
              key={String(opt.value)}
              onClick={() => update({ filedCryptoBefore: opt.value })}
              className={`px-6 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                data.filedCryptoBefore === opt.value
                  ? "bg-teal/10 border-teal/40 text-teal"
                  : "border-gray-700 text-gray-400 hover:border-gray-600"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reassuring message for first-timers */}
      {data.filedCryptoBefore === false && (
        <div className="mt-6 bg-teal/5 border border-teal/20 rounded-xl p-4">
          <p className="text-sm text-teal leading-relaxed">
            No worries — many of our clients are filing for the first time.
            We&apos;ll help you get caught up and make sure everything is done
            correctly.
          </p>
        </div>
      )}

      {/* Nav */}
      <div className="mt-10 flex items-center gap-4">
        <button
          onClick={onBack}
          className="px-6 py-3.5 text-gray-400 hover:text-white transition-colors text-sm"
        >
          &larr; Back
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="px-8 py-3.5 bg-teal text-navy font-semibold rounded-lg hover:bg-teal-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
