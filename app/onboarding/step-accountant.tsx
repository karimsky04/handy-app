import { OnboardingData } from "./page";

const OPTIONS = [
  {
    id: "no-crypto",
    label: "Yes, but they don't understand crypto",
    help: "We'll work alongside your accountant — providing the crypto-specific data, calculations, and jurisdiction rules they need. They stay in control, we fill the knowledge gap.",
  },
  {
    id: "full-service",
    label: "Yes, and they handle everything",
    help: "Great — we can still add value by double-checking your cross-border obligations and flagging anything your accountant might miss across jurisdictions.",
  },
  {
    id: "need-one",
    label: "No, I need one",
    help: "We'll match you with a vetted tax professional who specializes in crypto and cross-border compliance in your jurisdiction.",
  },
  {
    id: "not-sure",
    label: "Not sure what I need",
    help: "No problem. We'll assess your situation first and recommend whether you need a full accountant, a one-time filing service, or can handle it with our guided tools.",
  },
];

interface Props {
  data: OnboardingData;
  update: (partial: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepAccountant({
  data,
  update,
  onNext,
  onBack,
}: Props) {
  const canProceed = data.accountantStatus !== "";

  return (
    <div className="w-full max-w-xl">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
        Do you already have an accountant?
      </h1>
      <p className="text-gray-400 mb-8">
        This helps us tailor the right level of support for you.
      </p>

      <div className="space-y-3">
        {OPTIONS.map((opt) => {
          const selected = data.accountantStatus === opt.id;
          return (
            <div key={opt.id}>
              <button
                onClick={() => update({ accountantStatus: opt.id })}
                className={`w-full text-left px-5 py-4 rounded-xl border transition-all ${
                  selected
                    ? "bg-teal/10 border-teal/40"
                    : "bg-navy-light border-gray-700 hover:border-gray-600"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                      selected ? "border-teal" : "border-gray-600"
                    }`}
                  >
                    {selected && (
                      <div className="w-2 h-2 rounded-full bg-teal" />
                    )}
                  </div>
                  <span
                    className={`font-medium text-sm sm:text-base ${selected ? "text-white" : "text-gray-300"}`}
                  >
                    {opt.label}
                  </span>
                </div>
              </button>
              {selected && (
                <div className="mt-2 ml-7 px-4 py-3 bg-navy-light/50 rounded-lg border-l-2 border-teal/30">
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {opt.help}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

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
          See My Results
        </button>
      </div>
    </div>
  );
}
