import { OnboardingData, PreviousCountry } from "./page";

const COUNTRIES = [
  { code: "GB", label: "United Kingdom", flag: "🇬🇧" },
  { code: "US", label: "United States", flag: "🇺🇸" },
  { code: "AU", label: "Australia", flag: "🇦🇺" },
  { code: "CA", label: "Canada", flag: "🇨🇦" },
  { code: "DE", label: "Germany", flag: "🇩🇪" },
  { code: "FR", label: "France", flag: "🇫🇷" },
  { code: "SE", label: "Sweden", flag: "🇸🇪" },
  { code: "DK", label: "Denmark", flag: "🇩🇰" },
  { code: "IT", label: "Italy", flag: "🇮🇹" },
  { code: "PT", label: "Portugal", flag: "🇵🇹" },
  { code: "ES", label: "Spain", flag: "🇪🇸" },
];

export { COUNTRIES };

interface Props {
  data: OnboardingData;
  update: (partial: Partial<OnboardingData>) => void;
  onNext: () => void;
}

export default function StepResidence({ data, update, onNext }: Props) {
  function addPrevCountry() {
    update({
      previousCountries: [
        ...data.previousCountries,
        { country: "", movedFrom: "", movedTo: "" },
      ],
    });
  }

  function updatePrevCountry(
    index: number,
    field: keyof PreviousCountry,
    value: string
  ) {
    const updated = data.previousCountries.map((pc, i) =>
      i === index ? { ...pc, [field]: value } : pc
    );
    update({ previousCountries: updated });
  }

  function removePrevCountry(index: number) {
    update({
      previousCountries: data.previousCountries.filter((_, i) => i !== index),
    });
  }

  const canProceed =
    data.currentCountry &&
    (!data.hasPreviousCountries ||
      data.previousCountries.every(
        (pc) => pc.country && pc.movedFrom && pc.movedTo
      ));

  return (
    <div className="w-full max-w-xl">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
        Where do you live?
      </h1>
      <p className="text-gray-400 mb-8">
        Your tax residency determines which obligations apply to you.
      </p>

      {/* Current country */}
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Current country of residence
      </label>
      <select
        value={data.currentCountry}
        onChange={(e) => update({ currentCountry: e.target.value })}
        className="w-full bg-navy-light border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-teal transition-colors appearance-none cursor-pointer"
      >
        <option value="">Select a country</option>
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.label}
          </option>
        ))}
      </select>

      {/* Previous countries toggle */}
      <div className="mt-8">
        <button
          type="button"
          onClick={() => {
            const next = !data.hasPreviousCountries;
            update({
              hasPreviousCountries: next,
              previousCountries: next
                ? [{ country: "", movedFrom: "", movedTo: "" }]
                : [],
            });
          }}
          className="flex items-center gap-3 group"
        >
          <div
            className={`w-11 h-6 rounded-full transition-colors relative ${data.hasPreviousCountries ? "bg-teal" : "bg-gray-700"}`}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${data.hasPreviousCountries ? "translate-x-[22px]" : "translate-x-0.5"}`}
            />
          </div>
          <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
            I&apos;ve lived in another country in the last 3 years
          </span>
        </button>
      </div>

      {/* Previous countries list */}
      {data.hasPreviousCountries && (
        <div className="mt-6 space-y-4">
          {data.previousCountries.map((pc, i) => (
            <div
              key={i}
              className="bg-navy-light border border-gray-700 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-400">
                  Previous country {i + 1}
                </span>
                {data.previousCountries.length > 1 && (
                  <button
                    onClick={() => removePrevCountry(i)}
                    className="text-sm text-gray-500 hover:text-red-400 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
              <select
                value={pc.country}
                onChange={(e) =>
                  updatePrevCountry(i, "country", e.target.value)
                }
                className="w-full bg-navy border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-teal transition-colors appearance-none cursor-pointer"
              >
                <option value="">Select country</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.label}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Moved there
                  </label>
                  <input
                    type="month"
                    value={pc.movedFrom}
                    onChange={(e) =>
                      updatePrevCountry(i, "movedFrom", e.target.value)
                    }
                    className="w-full bg-navy border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-teal transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Moved away
                  </label>
                  <input
                    type="month"
                    value={pc.movedTo}
                    onChange={(e) =>
                      updatePrevCountry(i, "movedTo", e.target.value)
                    }
                    className="w-full bg-navy border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-teal transition-colors"
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={addPrevCountry}
            className="text-sm text-teal hover:text-teal-light transition-colors"
          >
            + Add another country
          </button>
        </div>
      )}

      {/* Next */}
      <div className="mt-10">
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="w-full sm:w-auto px-8 py-3.5 bg-teal text-navy font-semibold rounded-lg hover:bg-teal-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
