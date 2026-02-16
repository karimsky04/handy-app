"use client";

/* ═══════════════════ MOCK DATA ═══════════════════ */

interface Expert {
  initials: string;
  name: string;
  title: string;
  location: string;
  specializations: string[];
  languages: string[];
  rating: number;
  clients: number;
  handling: { flag: string; country: string };
  responseTime: string;
  avatarColor: string;
}

const EXPERTS: Expert[] = [
  {
    initials: "SM",
    name: "Sarah Mitchell",
    title: "ACCA Chartered Accountant",
    location: "London, UK",
    specializations: [
      "Crypto taxation",
      "Capital gains",
      "Non-resident landlords",
    ],
    languages: ["English"],
    rating: 4.9,
    clients: 127,
    handling: { flag: "🇬🇧", country: "United Kingdom" },
    responseTime: "Usually responds within 4 hours",
    avatarColor: "from-teal/30 to-teal/10",
  },
  {
    initials: "PD",
    name: "Pierre Dubois",
    title: "Expert-Comptable",
    location: "Paris, France",
    specializations: [
      "Crypto PFU",
      "International tax treaties",
      "Cerfa compliance",
    ],
    languages: ["French", "English"],
    rating: 4.7,
    clients: 89,
    handling: { flag: "🇫🇷", country: "France" },
    responseTime: "Usually responds within 24 hours",
    avatarColor: "from-blue-500/30 to-blue-500/10",
  },
  {
    initials: "AS",
    name: "Ana Santos",
    title: "Técnico Oficial de Contas",
    location: "Lisbon, Portugal",
    specializations: [
      "NHR regime",
      "Crypto taxation",
      "Expat tax planning",
    ],
    languages: ["Portuguese", "English", "Spanish"],
    rating: 4.8,
    clients: 64,
    handling: { flag: "🇵🇹", country: "Portugal" },
    responseTime: "Usually responds within 8 hours",
    avatarColor: "from-amber-500/30 to-amber-500/10",
  },
];

/* ═══════════════════ PAGE ═══════════════════ */

export default function ExpertsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Your Expert Team
        </h1>
        <p className="text-gray-400 mt-1">
          Matched based on your jurisdictions, complexity, and language needs
        </p>
      </div>

      {/* Expert Cards */}
      <div className="grid lg:grid-cols-3 gap-5 mb-8">
        {EXPERTS.map((expert) => (
          <div
            key={expert.initials}
            className="bg-navy-light border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors group"
          >
            {/* Profile Header */}
            <div className="flex items-start gap-4 mb-5">
              <div
                className={`w-14 h-14 rounded-full bg-gradient-to-br ${expert.avatarColor} border border-gray-600 flex items-center justify-center text-lg font-bold text-white flex-shrink-0`}
              >
                {expert.initials}
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-lg leading-tight">
                  {expert.name}
                </h3>
                <p className="text-sm text-teal">{expert.title}</p>
                <p className="text-sm text-gray-500">{expert.location}</p>
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1">
                <span className="text-amber-400 text-sm">&#9733;</span>
                <span className="text-sm font-semibold text-white">
                  {expert.rating}
                </span>
              </div>
              <span className="text-sm text-gray-500">
                ({expert.clients} clients)
              </span>
            </div>

            {/* Handling */}
            <div className="flex items-center gap-2 px-3 py-2 bg-navy/60 rounded-lg border border-gray-700/50 mb-4">
              <span className="text-lg">{expert.handling.flag}</span>
              <span className="text-sm text-gray-300">
                Handling: {expert.handling.country}
              </span>
            </div>

            {/* Specializations */}
            <div className="mb-4">
              <span className="text-xs text-gray-500 uppercase tracking-wider">
                Specializations
              </span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {expert.specializations.map((s) => (
                  <span
                    key={s}
                    className="px-2.5 py-1 bg-gray-800 rounded-md text-xs text-gray-300"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div className="mb-4">
              <span className="text-xs text-gray-500 uppercase tracking-wider">
                Languages
              </span>
              <p className="text-sm text-gray-300 mt-1">
                {expert.languages.join(", ")}
              </p>
            </div>

            {/* Response time */}
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-5 pb-5 border-b border-gray-700/50">
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {expert.responseTime}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              <button className="py-2.5 rounded-lg bg-teal/10 border border-teal/30 text-sm font-medium text-teal hover:bg-teal/20 transition-colors">
                Send Message
              </button>
              <button className="py-2.5 rounded-lg border border-gray-700 text-sm font-medium text-gray-300 hover:border-gray-600 hover:text-white transition-colors">
                Schedule Call
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Coordination Box */}
      <div className="bg-navy-light border border-teal/20 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-teal/10 border border-teal/20 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-teal"
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
          </div>
          <div>
            <h3 className="font-semibold mb-1">
              Cross-Jurisdiction Coordination
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Your experts are connected through Handy&apos;s coordination
              layer. When Sarah identifies UK-France treaty implications,
              Pierre is automatically notified with the relevant context. You
              don&apos;t need to relay information between them.
            </p>
          </div>
        </div>

        {/* Visual connection */}
        <div className="mt-5 pt-5 border-t border-gray-700/50">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {EXPERTS.map((e, i) => (
              <div key={e.initials} className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-navy rounded-full border border-gray-700">
                  <div
                    className={`w-6 h-6 rounded-full bg-gradient-to-br ${e.avatarColor} flex items-center justify-center text-[10px] font-bold text-white`}
                  >
                    {e.initials}
                  </div>
                  <span className="text-xs text-gray-300 font-medium">
                    {e.name.split(" ")[0]}
                  </span>
                  <span className="text-sm">{e.handling.flag}</span>
                </div>
                {i < EXPERTS.length - 1 && (
                  <svg
                    className="w-4 h-4 text-teal/40 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 12h8"
                    />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
