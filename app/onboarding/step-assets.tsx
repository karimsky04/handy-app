import { OnboardingData } from "./page";

const ASSET_TYPES = [
  { id: "crypto", label: "Cryptocurrency", icon: "₿" },
  { id: "stocks", label: "Stocks & ETFs", icon: "📈" },
  { id: "rental", label: "Rental Property", icon: "🏠" },
  { id: "business", label: "Business Income", icon: "💼" },
  { id: "employment", label: "Employment Income (multiple countries)", icon: "🌍" },
  { id: "pension", label: "Pension / Retirement", icon: "🏦" },
  { id: "other", label: "Other", icon: "📋" },
];

const EXCHANGE_OPTIONS = ["1–5", "5–15", "15–30", "30+"];

interface Props {
  data: OnboardingData;
  update: (partial: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepAssets({ data, update, onNext, onBack }: Props) {
  function toggleAsset(id: string) {
    const current = data.assetTypes;
    if (current.includes(id)) {
      update({ assetTypes: current.filter((a) => a !== id) });
    } else {
      update({ assetTypes: [...current, id] });
    }
  }

  const hasCrypto = data.assetTypes.includes("crypto");
  const canProceed =
    data.assetTypes.length > 0 &&
    (!hasCrypto || (data.exchangeCount && data.usedDefi !== null));

  return (
    <div className="w-full max-w-xl">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
        What do you have?
      </h1>
      <p className="text-gray-400 mb-8">
        Select all asset types and income sources that apply to you.
      </p>

      {/* Asset checkboxes */}
      <div className="space-y-3">
        {ASSET_TYPES.map((asset) => {
          const selected = data.assetTypes.includes(asset.id);
          return (
            <button
              key={asset.id}
              onClick={() => toggleAsset(asset.id)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all text-left ${
                selected
                  ? "bg-teal/10 border-teal/40 text-white"
                  : "bg-navy-light border-gray-700 text-gray-300 hover:border-gray-600"
              }`}
            >
              <span className="text-xl w-8 text-center">{asset.icon}</span>
              <span className="font-medium text-sm sm:text-base flex-1">
                {asset.label}
              </span>
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  selected ? "bg-teal border-teal" : "border-gray-600"
                }`}
              >
                {selected && (
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
            </button>
          );
        })}
      </div>

      {/* Crypto follow-up */}
      {hasCrypto && (
        <div className="mt-8 bg-navy-light border border-gray-700 rounded-xl p-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              How many exchanges or wallets do you use?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {EXCHANGE_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => update({ exchangeCount: opt })}
                  className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    data.exchangeCount === opt
                      ? "bg-teal/10 border-teal/40 text-teal"
                      : "border-gray-700 text-gray-400 hover:border-gray-600"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Have you used DeFi protocols?
            </label>
            <div className="flex gap-3">
              {[
                { value: true, label: "Yes" },
                { value: false, label: "No" },
              ].map((opt) => (
                <button
                  key={String(opt.value)}
                  onClick={() => update({ usedDefi: opt.value })}
                  className={`px-6 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    data.usedDefi === opt.value
                      ? "bg-teal/10 border-teal/40 text-teal"
                      : "border-gray-700 text-gray-400 hover:border-gray-600"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
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
