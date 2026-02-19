"use client";

import { useState, useEffect } from "react";
import { useExpert } from "@/lib/context/expert-auth-context";
import { createClient } from "@/lib/supabase";

/* ═══════════════════════ TYPES ═══════════════════════ */

type Section =
  | "profile"
  | "specializations"
  | "availability"
  | "notifications"
  | "payments"
  | "agreement";

/* ═══════════════════════ HELPERS ═══════════════════════ */

function getInitials(fullName: string): string {
  return fullName
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function Toggle({
  on,
  label,
  sub,
}: {
  on: boolean;
  label: string;
  sub?: string;
}) {
  const [enabled, setEnabled] = useState(on);
  return (
    <div className="flex items-start justify-between py-2.5">
      <div className="pr-4">
        <p className="text-sm text-gray-200">{label}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
      <button
        onClick={() => setEnabled(!enabled)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${
          enabled ? "bg-gold" : "bg-gray-700"
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
            enabled ? "translate-x-[18px]" : "translate-x-[3px]"
          }`}
        />
      </button>
    </div>
  );
}

function Checkbox({
  checked,
  label,
  badge,
}: {
  checked: boolean;
  label: string;
  badge?: string;
}) {
  const [on, setOn] = useState(checked);
  return (
    <label className="flex items-center gap-2.5 py-1.5 cursor-pointer group">
      <div
        onClick={() => setOn(!on)}
        className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
          on
            ? "bg-gold border-gold text-navy"
            : "border-gray-600 group-hover:border-gray-500"
        }`}
      >
        {on && (
          <svg
            className="w-3 h-3"
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
      <span className="text-sm text-gray-300">{label}</span>
      {badge && (
        <span className="text-[10px] text-gold bg-gold/10 border border-gold/30 px-1.5 py-0.5 rounded">
          {badge}
        </span>
      )}
    </label>
  );
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gray-700/40 rounded-lg ${className}`}
    />
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <SkeletonBlock className="h-6 w-32 mb-2" />
        <SkeletonBlock className="h-4 w-64 mb-6" />
      </div>
      <div className="flex items-center gap-4 mb-6">
        <SkeletonBlock className="w-16 h-16 rounded-full" />
        <div className="space-y-2">
          <SkeletonBlock className="h-4 w-24" />
          <SkeletonBlock className="h-3 w-32" />
        </div>
      </div>
      <div className="space-y-4 max-w-lg">
        {[...Array(5)].map((_, i) => (
          <div key={i}>
            <SkeletonBlock className="h-3 w-20 mb-1.5" />
            <SkeletonBlock className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════ SECTIONS ═══════════════════════ */

function ProfileSection() {
  const { expert, loading } = useExpert();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Sync local state when expert data loads or changes
  useEffect(() => {
    if (expert) {
      setFullName(expert.full_name ?? "");
      setPhone(expert.phone ?? "");
      setCompany(expert.company_name ?? "");
    }
  }, [expert]);

  if (loading) return <LoadingSkeleton />;
  if (!expert) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">
          Unable to load profile. Please sign in again.
        </p>
      </div>
    );
  }

  const initials = getInitials(expert.full_name);

  async function handleSave() {
    if (!expert) return;
    setSaving(true);
    setFeedback(null);

    const { error } = await supabase
      .from("experts")
      .update({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        company_name: company.trim() || null,
      })
      .eq("id", expert.id);

    setSaving(false);

    if (error) {
      setFeedback({
        type: "error",
        message: "Failed to save changes. Please try again.",
      });
    } else {
      setFeedback({ type: "success", message: "Profile updated successfully." });
      // Auto-dismiss success message after 4 seconds
      setTimeout(() => setFeedback(null), 4000);
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Profile</h2>
      <p className="text-sm text-gray-500 mb-6">
        Your professional details visible to clients
      </p>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-gold/20 border-2 border-gold/30 flex items-center justify-center text-gold text-xl font-bold relative group cursor-pointer">
          {initials}
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] text-white font-medium">Change</span>
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-200 font-medium">Profile photo</p>
          <p className="text-xs text-gray-500">JPG or PNG, max 2MB</p>
        </div>
      </div>

      <div className="space-y-4 max-w-lg">
        {/* Full name — editable */}
        <div>
          <label className="text-xs text-gray-500 block mb-1.5">
            Full name
          </label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full bg-navy border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold/50 transition-colors"
          />
        </div>

        {/* Email — read-only */}
        <div>
          <label className="text-xs text-gray-500 block mb-1.5">Email</label>
          <input
            value={expert.email}
            readOnly
            className="w-full bg-navy border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-400 focus:outline-none cursor-not-allowed"
          />
        </div>

        {/* Phone — editable */}
        <div>
          <label className="text-xs text-gray-500 block mb-1.5">Phone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter your phone number"
            className="w-full bg-navy border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-gold/50 transition-colors"
          />
        </div>

        {/* Company — editable */}
        <div>
          <label className="text-xs text-gray-500 block mb-1.5">Company</label>
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Enter your company name"
            className="w-full bg-navy border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-gold/50 transition-colors"
          />
        </div>

        {/* Jurisdictions — read-only chips */}
        <div>
          <label className="text-xs text-gray-500 block mb-1.5">
            Jurisdictions
          </label>
          <div className="flex flex-wrap gap-2">
            {expert.jurisdictions.length > 0 ? (
              expert.jurisdictions.map((j) => (
                <span
                  key={j}
                  className="text-xs text-teal bg-teal/10 border border-teal/30 px-2.5 py-1 rounded-full"
                >
                  {j}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-500">
                No jurisdictions set
              </span>
            )}
          </div>
        </div>

        {/* Specializations — read-only chips */}
        <div>
          <label className="text-xs text-gray-500 block mb-1.5">
            Specializations
          </label>
          <div className="flex flex-wrap gap-2">
            {expert.specializations.length > 0 ? (
              expert.specializations.map((s) => (
                <span
                  key={s}
                  className="text-xs text-gold bg-gold/10 border border-gold/30 px-2.5 py-1 rounded-full"
                >
                  {s}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-500">
                No specializations set
              </span>
            )}
          </div>
        </div>

        {/* Languages */}
        <div>
          <label className="text-xs text-gray-500 block mb-1.5">
            Languages
          </label>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <Checkbox checked={true} label="English" />
            <Checkbox checked={false} label="French" />
            <Checkbox checked={false} label="German" />
            <Checkbox checked={false} label="Spanish" />
            <Checkbox checked={false} label="Portuguese" />
            <Checkbox checked={false} label="Other" />
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="text-xs text-gray-500 block mb-1.5">Bio</label>
          <textarea
            defaultValue=""
            placeholder="Write a short professional bio..."
            rows={4}
            className="w-full bg-navy border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-gold/50 transition-colors resize-none"
          />
        </div>

        {/* Website & LinkedIn */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1.5">
              Website
            </label>
            <input
              defaultValue=""
              placeholder="www.example.com"
              className="w-full bg-navy border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-gold/50 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1.5">
              LinkedIn
            </label>
            <input
              defaultValue=""
              placeholder="linkedin.com/in/yourname"
              className="w-full bg-navy border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-gold/50 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Feedback message */}
      {feedback && (
        <div
          className={`mt-4 max-w-lg px-4 py-2.5 rounded-lg text-sm font-medium ${
            feedback.type === "success"
              ? "bg-teal/10 border border-teal/30 text-teal"
              : "bg-red-500/10 border border-red-500/30 text-red-400"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="flex items-center gap-4 mt-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-gold text-navy font-semibold rounded-lg hover:bg-gold-light transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
        <button className="text-sm text-gray-400 hover:text-gray-300 transition-colors">
          See how clients see your profile &rarr;
        </button>
      </div>
    </div>
  );
}

function SpecializationsSection() {
  const { expert, loading } = useExpert();

  if (loading) return <LoadingSkeleton />;

  const expertJurisdictions = expert?.jurisdictions ?? [];
  const expertSpecializations = expert?.specializations ?? [];

  // Common jurisdiction list — mark expert's as checked
  const allJurisdictions = [
    "United Kingdom",
    "Ireland",
    "United States",
    "Canada",
    "Australia",
    "Germany",
    "France",
    "Netherlands",
  ];

  // Common specialization / asset-type list — mark expert's as checked
  const allAssetTypes = [
    "Cryptocurrency & digital assets",
    "Stocks, ETFs & investment portfolios",
    "Self-employment & freelance",
    "Employment income (multi-country)",
    "Rental property & real estate",
    "Pensions & retirement",
    "Business / corporate tax",
  ];

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Your Expertise</h2>
      <p className="text-sm text-gray-500 mb-6">
        Clients are matched to you based on these specializations
      </p>

      {/* Jurisdictions */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">
          Jurisdictions covered
        </h3>
        <div className="space-y-1">
          {allJurisdictions.map((j) => (
            <Checkbox
              key={j}
              checked={expertJurisdictions.some(
                (ej) => ej.toLowerCase() === j.toLowerCase()
              )}
              label={j}
              badge={
                expertJurisdictions.length > 0 &&
                expertJurisdictions[0]?.toLowerCase() === j.toLowerCase()
                  ? "Primary"
                  : undefined
              }
            />
          ))}
        </div>
        <button className="mt-2 text-xs text-gold hover:text-gold-light transition-colors">
          + Add jurisdiction
        </button>
      </div>

      {/* Asset types */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">
          Asset type expertise
        </h3>
        <div className="space-y-1">
          {allAssetTypes.map((a) => (
            <Checkbox
              key={a}
              checked={expertSpecializations.some(
                (es) => es.toLowerCase() === a.toLowerCase()
              )}
              label={a}
            />
          ))}
        </div>
      </div>

      {/* Complexity */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">
          Complexity levels accepted
        </h3>
        <div className="space-y-1">
          <Checkbox
            checked={false}
            label="Simple (single jurisdiction, single asset type)"
          />
          <Checkbox
            checked={false}
            label="Moderate (single jurisdiction, multiple asset types)"
          />
          <Checkbox
            checked={false}
            label="Complex (single jurisdiction, high volume/DeFi)"
          />
          <Checkbox
            checked={false}
            label="Multi-Jurisdiction (coordination with other experts required)"
          />
        </div>
      </div>

      {/* Certifications */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-3">
          Special certifications
        </h3>
        <div className="space-y-1">
          <Checkbox checked={false} label="HMRC registered agent" />
          <Checkbox checked={false} label="Crypto-asset taxation specialist" />
          <Checkbox checked={false} label="US Enrolled Agent" />
          <Checkbox
            checked={false}
            label="CARF/DAC8 compliance certified"
          />
        </div>
        <button className="mt-2 text-xs text-gold hover:text-gold-light transition-colors">
          + Add certification
        </button>
      </div>

      <button className="mt-6 px-6 py-2.5 bg-gold text-navy font-semibold rounded-lg hover:bg-gold-light transition-colors text-sm">
        Save Changes
      </button>
    </div>
  );
}

function AvailabilitySection() {
  const [capacity] = useState(15);
  const [status, setStatus] = useState<"accepting" | "limited" | "closed">(
    "accepting"
  );

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Availability & Capacity</h2>
      <p className="text-sm text-gray-500 mb-6">
        Manage your workload and schedule
      </p>

      {/* Capacity */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">
          Current capacity
        </h3>
        <div className="bg-navy border border-gray-700 rounded-xl p-4 space-y-3 max-w-lg">
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-400">Maximum active clients</span>
              <span className="text-white font-medium">{capacity}</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gold rounded-full"
                style={{ width: `${(capacity / 30) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-600 mt-1">
              <span>5</span>
              <span>30</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-700/50">
            <div>
              <p className="text-xs text-gray-500">Current active</p>
              <p className="text-lg font-bold text-white">--</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Available capacity</p>
              <p className="text-lg font-bold text-teal">--</p>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="flex gap-2 mt-4">
          {(
            [
              {
                id: "accepting",
                icon: "🟢",
                label: "Accepting new clients",
              },
              { id: "limited", icon: "🟡", label: "Limited availability" },
              { id: "closed", icon: "🔴", label: "Not accepting" },
            ] as const
          ).map((s) => (
            <button
              key={s.id}
              onClick={() => setStatus(s.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${
                status === s.id
                  ? "bg-gold/10 border-gold/30 text-gold"
                  : "border-gray-700 text-gray-400 hover:border-gray-600"
              }`}
            >
              <span>{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Working hours */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">
          Working hours
        </h3>
        <div className="space-y-2 max-w-lg">
          {[
            { day: "Monday – Friday", time: "9:00 AM – 5:30 PM", active: true },
            { day: "Saturday", time: "Off", active: false },
            { day: "Sunday", time: "Off", active: false },
          ].map((row) => (
            <div
              key={row.day}
              className="flex items-center justify-between py-2"
            >
              <span className="text-sm text-gray-300">{row.day}</span>
              <span
                className={`text-sm ${row.active ? "text-gray-200" : "text-gray-500"}`}
              >
                {row.time}
              </span>
            </div>
          ))}
          <Toggle
            on={true}
            label="Available for urgent matters outside hours"
          />
        </div>
      </div>

      {/* Response time */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">
          Response time commitment
        </h3>
        <div className="flex items-center gap-3 max-w-lg">
          <select className="bg-navy border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold/50 transition-colors">
            <option>Within 4 hours</option>
            <option>Within 8 hours</option>
            <option>Within 24 hours</option>
            <option>Within 48 hours</option>
          </select>
        </div>
      </div>

      {/* Absences */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-3">
          Holiday / absence dates
        </h3>
        <p className="text-sm text-gray-500 mb-2 max-w-lg">
          No upcoming absences scheduled.
        </p>
        <button className="text-xs text-gold hover:text-gold-light transition-colors">
          + Add absence period
        </button>
        <p className="text-[11px] text-gray-500 mt-2 max-w-lg">
          Clients will be notified and cases reassigned temporarily during
          your absence.
        </p>
      </div>

      <button className="mt-6 px-6 py-2.5 bg-gold text-navy font-semibold rounded-lg hover:bg-gold-light transition-colors text-sm">
        Save Changes
      </button>
    </div>
  );
}

function NotificationsSection() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Notifications</h2>
      <p className="text-sm text-gray-500 mb-6">
        Choose what you get notified about
      </p>

      <div className="space-y-6 max-w-lg">
        {/* Client Activity */}
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-2">
            Client Activity
          </h3>
          <div className="border-t border-gray-700/50">
            <Toggle on={true} label="New client match available" />
            <Toggle on={true} label="Client messages" />
            <Toggle on={true} label="Document uploads by clients" />
            <Toggle on={true} label="Client approves/rejects submission" />
          </div>
        </div>

        {/* Coordination */}
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-2">
            Coordination
          </h3>
          <div className="border-t border-gray-700/50">
            <Toggle
              on={true}
              label="Cross-jurisdiction coordination requests"
            />
            <Toggle
              on={true}
              label="Other expert updates on shared cases"
            />
          </div>
        </div>

        {/* Deadlines */}
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-2">
            Deadlines
          </h3>
          <div className="border-t border-gray-700/50">
            <Toggle
              on={true}
              label="Client deadline reminders"
              sub="30, 14, 7, and 1 day before deadline"
            />
            <Toggle on={true} label="Overdue filing alerts" />
            <Toggle on={true} label="Regulatory change alerts" />
          </div>
        </div>

        {/* Platform */}
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-2">
            Platform
          </h3>
          <div className="border-t border-gray-700/50">
            <Toggle on={true} label="Monthly performance summary" />
            <Toggle on={false} label="New feature announcements" />
            <Toggle on={true} label="Payment confirmations" />
          </div>
        </div>

        {/* Delivery method */}
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-2">
            Delivery Method
          </h3>
          <div className="border-t border-gray-700/50">
            <Toggle on={true} label="Email" />
            <Toggle on={false} label="Push notifications" />
            <Toggle
              on={true}
              label="SMS for urgent"
              sub="Overdue filings and coordination requests"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentsSection() {
  const { expert } = useExpert();

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Payment Settings</h2>
      <p className="text-sm text-gray-500 mb-6">
        Bank details, invoicing, and fee structure
      </p>

      {/* Bank Details */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">
          Bank details
        </h3>
        <div className="bg-navy border border-gray-700 rounded-xl p-4 max-w-lg">
          <p className="text-sm text-gray-400">
            No bank details on file.
          </p>
          <button className="text-xs text-gold hover:text-gold-light transition-colors mt-2">
            Add bank details
          </button>
        </div>
      </div>

      {/* Company details */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">
          Company details (for invoicing)
        </h3>
        <div className="bg-navy border border-gray-700 rounded-xl p-4 space-y-1.5 max-w-lg">
          <p className="text-sm text-gray-200">
            {expert?.company_name || "No company name set"}
          </p>
          <p className="text-xs text-gray-500">
            Update your company name in the Profile section.
          </p>
        </div>
      </div>

      {/* Fee structure */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">
          Fee structure
        </h3>
        <p className="text-xs text-gray-500 mb-3">
          Your rate card (negotiated with Handy):
        </p>
        <div className="bg-navy border border-gray-700 rounded-xl overflow-hidden max-w-lg">
          {[
            { level: "Simple case", range: "TBD" },
            { level: "Moderate case", range: "TBD" },
            { level: "Complex case", range: "TBD" },
            {
              level: "Multi-jurisdiction coordination",
              range: "TBD",
            },
          ].map((fee, i) => (
            <div
              key={fee.level}
              className={`flex items-center justify-between px-4 py-3 ${
                i > 0 ? "border-t border-gray-700/30" : ""
              }`}
            >
              <span className="text-sm text-gray-300">{fee.level}</span>
              <span className="text-sm font-medium text-gold">
                {fee.range}
              </span>
            </div>
          ))}
        </div>
        <button className="text-xs text-gold hover:text-gold-light transition-colors mt-3">
          Request rate review &rarr;
        </button>
      </div>

      {/* Tax documents */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-3">
          Tax documents
        </h3>
        <div className="space-y-2 max-w-lg">
          <p className="text-sm text-gray-500">
            No tax documents available yet.
          </p>
        </div>
      </div>
    </div>
  );
}

function AgreementSection() {
  const { expert } = useExpert();

  // Derive "active since" from expert.created_at
  const activeSince = expert?.created_at
    ? new Date(expert.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "Unknown";

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Platform Agreement</h2>
      <p className="text-sm text-gray-500 mb-6">
        Your Handy Expert Agreement
      </p>

      {/* Status */}
      <div className="bg-teal/5 border border-teal/20 rounded-xl px-5 py-4 mb-6 max-w-lg flex items-center gap-3">
        <span className="text-teal text-lg">&#10003;</span>
        <div>
          <p className="text-sm text-gray-200 font-medium">
            Active since {activeSince}
          </p>
          <p className="text-xs text-gray-500">
            Agreement auto-renews annually
          </p>
        </div>
      </div>

      {/* Key terms */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">
          Key terms
        </h3>
        <div className="bg-navy border border-gray-700 rounded-xl overflow-hidden max-w-lg">
          {[
            {
              label: "Service standard",
              value: "Respond within committed timeframe",
            },
            {
              label: "Quality guarantee",
              value: "Maintain 4.5+ client rating",
            },
            {
              label: "Data handling",
              value: "Process client data only within Handy platform",
            },
            {
              label: "Non-solicitation",
              value: "12-month clause for Handy-introduced clients",
            },
            {
              label: "Fee structure",
              value: "As agreed in your rate card",
            },
          ].map((term, i) => (
            <div
              key={term.label}
              className={`flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 gap-1 ${
                i > 0 ? "border-t border-gray-700/30" : ""
              }`}
            >
              <span className="text-sm text-gray-400 font-medium">
                {term.label}
              </span>
              <span className="text-sm text-gray-300">{term.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 max-w-lg">
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-700 text-sm text-gray-300 hover:border-gold/40 hover:text-gold transition-colors">
          View full agreement (PDF)
        </button>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-700 text-sm text-gray-400 hover:border-gray-600 hover:text-gray-300 transition-colors">
          Request amendment
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════ PAGE ═══════════════════════ */

const SECTIONS_NAV: { id: Section; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "specializations", label: "Specializations" },
  { id: "availability", label: "Availability" },
  { id: "notifications", label: "Notifications" },
  { id: "payments", label: "Payments" },
  { id: "agreement", label: "Platform Agreement" },
];

export default function ExpertSettingsPage() {
  const [active, setActive] = useState<Section>("profile");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Settings</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <nav className="lg:w-48 flex-shrink-0">
          <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
            {SECTIONS_NAV.map((s) => (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap text-left transition-colors ${
                  active === s.id
                    ? "bg-gold/10 text-gold"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-navy-light border border-gray-700 rounded-xl p-5 sm:p-8">
            {active === "profile" && <ProfileSection />}
            {active === "specializations" && <SpecializationsSection />}
            {active === "availability" && <AvailabilitySection />}
            {active === "notifications" && <NotificationsSection />}
            {active === "payments" && <PaymentsSection />}
            {active === "agreement" && <AgreementSection />}
          </div>
        </div>
      </div>
    </div>
  );
}
