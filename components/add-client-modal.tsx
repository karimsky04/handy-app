"use client";

import { useState, useRef, useEffect } from "react";

const COUNTRY_OPTIONS = [
  "United Kingdom",
  "United States",
  "Germany",
  "France",
  "Spain",
  "Portugal",
  "Netherlands",
  "Switzerland",
  "Australia",
  "Canada",
  "Japan",
  "Singapore",
];

const ASSET_TYPE_OPTIONS = [
  "Crypto",
  "Stocks",
  "Employment",
  "Self-Employment",
  "Property",
  "DeFi",
  "NFTs",
];

const TAX_YEAR_OPTIONS = ["2022/23", "2023/24", "2024/25", "2025/26"];

const COMPLEXITY_OPTIONS = ["Simple", "Moderate", "Complex", "Multi-Jurisdiction Complex"];

interface AddClientModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddClientModal({
  open,
  onClose,
  onSuccess,
}: AddClientModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countries, setCountries] = useState<string[]>([]);
  const [assetTypes, setAssetTypes] = useState<string[]>([]);
  const [complexity, setComplexity] = useState("Moderate");
  const [taxYears, setTaxYears] = useState<string[]>([]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  function toggleItem(
    arr: string[],
    setArr: (v: string[]) => void,
    item: string
  ) {
    setArr(arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/expert/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone: phone || null,
          countries,
          asset_types: assetTypes,
          complexity,
          tax_years: taxYears,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create client");
      }

      // Reset form
      setFullName("");
      setEmail("");
      setPhone("");
      setCountries([]);
      setAssetTypes([]);
      setComplexity("Moderate");
      setTaxYears([]);

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="w-full max-w-lg bg-[#12122a] border border-gray-700 rounded-xl shadow-2xl max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Add New Client</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
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
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full bg-navy-light border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold/50 transition-colors"
              placeholder="John Smith"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-navy-light border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold/50 transition-colors"
              placeholder="john@example.com"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              Phone
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-navy-light border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold/50 transition-colors"
              placeholder="+44 7700 000000"
            />
          </div>

          {/* Countries */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              Countries *
            </label>
            <div className="flex flex-wrap gap-2">
              {COUNTRY_OPTIONS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => toggleItem(countries, setCountries, c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    countries.includes(c)
                      ? "bg-gold/10 border-gold/30 text-gold"
                      : "border-gray-700 text-gray-400 hover:border-gray-600"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Asset Types */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              Asset Types *
            </label>
            <div className="flex flex-wrap gap-2">
              {ASSET_TYPE_OPTIONS.map((a) => (
                <button
                  type="button"
                  key={a}
                  onClick={() => toggleItem(assetTypes, setAssetTypes, a)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    assetTypes.includes(a)
                      ? "bg-gold/10 border-gold/30 text-gold"
                      : "border-gray-700 text-gray-400 hover:border-gray-600"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Complexity */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              Complexity
            </label>
            <select
              value={complexity}
              onChange={(e) => setComplexity(e.target.value)}
              className="w-full bg-navy-light border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold/50 transition-colors"
            >
              {COMPLEXITY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Tax Years */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              Tax Years
            </label>
            <div className="flex flex-wrap gap-2">
              {TAX_YEAR_OPTIONS.map((y) => (
                <button
                  type="button"
                  key={y}
                  onClick={() => toggleItem(taxYears, setTaxYears, y)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    taxYears.includes(y)
                      ? "bg-gold/10 border-gold/30 text-gold"
                      : "border-gray-700 text-gray-400 hover:border-gray-600"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-700 text-sm font-medium text-gray-400 hover:border-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !fullName || !email || countries.length === 0}
              className="flex-1 py-2.5 rounded-lg bg-gold text-navy font-semibold text-sm hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Add Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
