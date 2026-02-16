"use client";

import { useState } from "react";

/* ═══════════════════════ TYPES ═══════════════════════ */

type Section =
  | "profile"
  | "jurisdictions"
  | "notifications"
  | "billing"
  | "security"
  | "privacy";

const NAV_ITEMS: { id: Section; label: string; icon: string }[] = [
  { id: "profile", label: "Profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  { id: "jurisdictions", label: "Jurisdictions", icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { id: "notifications", label: "Notifications", icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" },
  { id: "billing", label: "Billing", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
  { id: "security", label: "Security", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" },
  { id: "privacy", label: "Data & Privacy", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
];

/* ═══════════════════════ TOGGLE ═══════════════════════ */

function Toggle({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${on ? "bg-teal" : "bg-gray-700"}`}
    >
      <div
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${on ? "translate-x-[22px]" : "translate-x-0.5"}`}
      />
    </button>
  );
}

/* ═══════════════════════ SECTIONS ═══════════════════════ */

function ProfileSection() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-1">Profile</h2>
      <p className="text-gray-400 text-sm mb-8">
        Your personal information and preferences
      </p>

      {/* Avatar */}
      <div className="flex items-center gap-5 mb-8">
        <div className="relative group">
          <div className="w-20 h-20 rounded-full bg-teal/20 border-2 border-teal/30 flex items-center justify-center text-2xl font-bold text-teal">
            M
          </div>
          <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <span className="text-[10px] text-white font-medium">
              Change
            </span>
          </div>
        </div>
        <div>
          <p className="font-semibold">Michael Thompson</p>
          <p className="text-sm text-gray-400">Client since January 2026</p>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-5 max-w-lg">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Full name
          </label>
          <input
            type="text"
            defaultValue="Michael Thompson"
            className="w-full bg-navy border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal/50 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Email
          </label>
          <div className="relative">
            <input
              type="email"
              defaultValue="michael.t@email.com"
              className="w-full bg-navy border border-gray-700 rounded-lg px-4 py-2.5 pr-24 text-sm text-white focus:outline-none focus:border-teal/50 transition-colors"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-teal">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Verified
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Phone
          </label>
          <input
            type="tel"
            defaultValue="+44 7700 900123"
            className="w-full bg-navy border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal/50 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Preferred language
          </label>
          <select
            defaultValue="en"
            className="w-full bg-navy border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal/50 transition-colors appearance-none cursor-pointer"
          >
            <option value="en">English</option>
            <option value="fr">French</option>
            <option value="pt">Portuguese</option>
            <option value="de">German</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Timezone
          </label>
          <select
            defaultValue="gmt"
            className="w-full bg-navy border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal/50 transition-colors appearance-none cursor-pointer"
          >
            <option value="gmt">GMT (London)</option>
            <option value="cet">CET (Paris)</option>
            <option value="wet">WET (Lisbon)</option>
            <option value="est">EST (New York)</option>
          </select>
        </div>

        <button className="px-6 py-2.5 bg-teal text-navy font-semibold rounded-lg hover:bg-teal-light transition-colors text-sm mt-2">
          Save Changes
        </button>
      </div>
    </div>
  );
}

function JurisdictionsSection() {
  const jurisdictions = [
    { flag: "🇬🇧", country: "United Kingdom", status: "Active", taxId: "UTR: ****4521" },
    { flag: "🇫🇷", country: "France", status: "Active", taxId: "NIF: ****8834" },
    { flag: "🇵🇹", country: "Portugal", status: "Active", taxId: "NIF: ****2207" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1">Your Tax Jurisdictions</h2>
      <p className="text-gray-400 text-sm mb-8">
        Manage the countries where you have tax obligations
      </p>

      <div className="space-y-3 max-w-lg">
        {jurisdictions.map((j) => (
          <div
            key={j.country}
            className="bg-navy border border-gray-700 rounded-xl p-4 flex items-center justify-between hover:border-gray-600 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{j.flag}</span>
              <div>
                <p className="font-medium text-sm">{j.country}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-teal bg-teal/10 px-1.5 py-0.5 rounded">
                    {j.status}
                  </span>
                  <span className="text-xs text-gray-500">{j.taxId}</span>
                </div>
              </div>
            </div>
            <button className="px-3 py-1.5 text-xs font-medium text-gray-400 border border-gray-700 rounded-lg hover:border-gray-600 hover:text-white transition-colors">
              Manage
            </button>
          </div>
        ))}

        <button className="w-full py-3 border border-dashed border-gray-700 rounded-xl text-sm text-gray-500 hover:border-gray-600 hover:text-gray-400 transition-colors">
          + Add Jurisdiction
        </button>
      </div>

      <div className="mt-5 max-w-lg flex items-start gap-2.5 px-4 py-3 bg-navy border border-gray-700/50 rounded-lg">
        <svg className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-gray-500 leading-relaxed">
          Adding a jurisdiction will trigger a compliance check and suggest
          matched experts for that country.
        </p>
      </div>
    </div>
  );
}

function NotificationsSection() {
  const [prefs, setPrefs] = useState({
    deadlineReminders: true,
    overdueAlerts: true,
    expertMessages: true,
    docUploads: true,
    taskChanges: true,
    approvalRequests: true,
    regulationAlerts: true,
    monthlySummary: true,
    productUpdates: false,
    email: true,
    push: false,
    sms: true,
  });
  const [reminderDays, setReminderDays] = useState("30");

  function toggle(key: keyof typeof prefs) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  }

  function Row({
    label,
    field,
    children,
  }: {
    label: string;
    field: keyof typeof prefs;
    children?: React.ReactNode;
  }) {
    return (
      <div className="flex items-center justify-between py-3">
        <div>
          <span className="text-sm text-gray-300">{label}</span>
          {children}
        </div>
        <Toggle on={prefs[field]} onChange={() => toggle(field)} />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1">Notification Preferences</h2>
      <p className="text-gray-400 text-sm mb-8">
        Control how and when we reach out to you
      </p>

      <div className="max-w-lg space-y-6">
        {/* Deadlines */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Deadlines
          </h4>
          <div className="divide-y divide-gray-800">
            <div>
              <Row label="Filing deadline reminders" field="deadlineReminders">
                {prefs.deadlineReminders && (
                  <div className="flex gap-1.5 mt-1.5">
                    {["30", "14", "7", "1"].map((d) => (
                      <button
                        key={d}
                        onClick={() => setReminderDays(d)}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                          reminderDays === d
                            ? "bg-teal/10 border-teal/30 text-teal"
                            : "border-gray-700 text-gray-500 hover:border-gray-600"
                        }`}
                      >
                        {d}d
                      </button>
                    ))}
                  </div>
                )}
              </Row>
            </div>
            <Row label="Overdue alerts" field="overdueAlerts" />
          </div>
        </div>

        {/* Expert Activity */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Expert Activity
          </h4>
          <div className="divide-y divide-gray-800">
            <Row label="Expert messages" field="expertMessages" />
            <Row label="Document uploads by experts" field="docUploads" />
            <Row label="Task status changes" field="taskChanges" />
            <Row label="Approval requests" field="approvalRequests" />
          </div>
        </div>

        {/* System */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            System
          </h4>
          <div className="divide-y divide-gray-800">
            <Row
              label="New regulation alerts (CARF/DAC8 updates)"
              field="regulationAlerts"
            />
            <Row label="Monthly compliance summary" field="monthlySummary" />
            <Row label="Product updates" field="productUpdates" />
          </div>
        </div>

        {/* Delivery */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Delivery Method
          </h4>
          <div className="divide-y divide-gray-800">
            <Row label="Email" field="email" />
            <Row label="Push notifications" field="push" />
            <Row label="SMS for urgent deadlines" field="sms" />
          </div>
        </div>
      </div>
    </div>
  );
}

function BillingSection() {
  const invoices = [
    { date: "Feb 1, 2026", desc: "UK Filing — Crypto Complex", amount: "£1,200", status: "Paid", statusClass: "text-teal" },
    { date: "Feb 1, 2026", desc: "France Filing — Standard", amount: "€800", status: "Pending", statusClass: "text-amber-400" },
    { date: "Feb 1, 2026", desc: "Portugal Filing — NHR Review", amount: "€600", status: "Pending", statusClass: "text-amber-400" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1">Billing</h2>
      <p className="text-gray-400 text-sm mb-8">
        Manage your plan, payments, and invoices
      </p>

      <div className="max-w-2xl space-y-6">
        {/* Plan */}
        <div className="bg-navy border border-gray-700 rounded-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                Current Plan
              </p>
              <p className="text-lg font-semibold mt-0.5">
                Professional — Multi-Jurisdiction
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-teal/10 text-teal text-xs font-medium border border-teal/30">
              Active
            </span>
          </div>
          <p className="text-sm text-gray-400">
            3 active jurisdictions &times; base fee + complexity adjustments
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Current period: February 2026
          </p>
        </div>

        {/* Payment method */}
        <div className="bg-navy border border-gray-700 rounded-xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-7 rounded bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-400">
              VISA
            </div>
            <div>
              <p className="text-sm font-medium">Visa ending 4242</p>
              <p className="text-xs text-gray-500">Expires 12/2028</p>
            </div>
          </div>
          <button className="text-sm text-teal hover:text-teal-light transition-colors font-medium">
            Update
          </button>
        </div>

        {/* Invoice table */}
        <div className="bg-navy border border-gray-700 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-700/50">
            <h4 className="font-medium text-sm">Billing History</h4>
          </div>

          {/* Desktop */}
          <div className="hidden sm:block">
            <div className="grid grid-cols-[1fr_1fr_100px_90px_60px] gap-2 px-5 py-2 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-700/30">
              <span>Date</span>
              <span>Description</span>
              <span>Amount</span>
              <span>Status</span>
              <span></span>
            </div>
            {invoices.map((inv, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_1fr_100px_90px_60px] gap-2 items-center px-5 py-3 border-b border-gray-700/30 last:border-b-0 hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-sm text-gray-400">{inv.date}</span>
                <span className="text-sm text-gray-300">{inv.desc}</span>
                <span className="text-sm font-medium text-white">
                  {inv.amount}
                </span>
                <span className={`text-xs font-medium ${inv.statusClass}`}>
                  {inv.status === "Paid" ? "✅ " : "🔄 "}
                  {inv.status}
                </span>
                <button className="text-xs text-gray-500 hover:text-teal transition-colors">
                  Invoice
                </button>
              </div>
            ))}
          </div>

          {/* Mobile */}
          <div className="sm:hidden divide-y divide-gray-700/30">
            {invoices.map((inv, i) => (
              <div key={i} className="px-5 py-3.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">
                    {inv.amount}
                  </span>
                  <span className={`text-xs font-medium ${inv.statusClass}`}>
                    {inv.status}
                  </span>
                </div>
                <p className="text-sm text-gray-400">{inv.desc}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500">{inv.date}</span>
                  <button className="text-xs text-gray-500 hover:text-teal transition-colors">
                    Invoice
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Outstanding */}
        <div className="flex items-center justify-between px-5 py-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
          <span className="text-sm text-gray-300">Total outstanding</span>
          <span className="text-lg font-bold text-amber-400">&euro;1,400</span>
        </div>

        {/* Info */}
        <div className="flex items-start gap-2.5 px-4 py-3 bg-navy border border-gray-700/50 rounded-lg">
          <svg className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-gray-500 leading-relaxed">
            Payments are per jurisdiction per tax year. Expert fees are included
            — no hidden charges.
          </p>
        </div>
      </div>
    </div>
  );
}

function SecuritySection() {
  const sessions = [
    { device: "MacBook Pro", browser: "Chrome", location: "London, UK", time: "Current session", current: true },
    { device: "iPhone 15", browser: "Safari", location: "London, UK", time: "2 days ago", current: false },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1">Security</h2>
      <p className="text-gray-400 text-sm mb-8">
        Manage your account security and sessions
      </p>

      <div className="max-w-lg space-y-5">
        {/* Password */}
        <div className="bg-navy border border-gray-700 rounded-xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium">Password</p>
              <p className="text-xs text-gray-500">
                Last changed 3 months ago
              </p>
            </div>
          </div>
          <button className="px-3 py-1.5 text-xs font-medium border border-gray-700 rounded-lg text-gray-400 hover:border-gray-600 hover:text-white transition-colors">
            Change Password
          </button>
        </div>

        {/* 2FA */}
        <div className="bg-navy border border-gray-700 rounded-xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium flex items-center gap-1.5">
                Two-factor authentication
                <span className="text-xs text-teal bg-teal/10 px-1.5 py-0.5 rounded">
                  Enabled
                </span>
              </p>
              <p className="text-xs text-gray-500">Authenticator app</p>
            </div>
          </div>
          <button className="px-3 py-1.5 text-xs font-medium border border-gray-700 rounded-lg text-gray-400 hover:border-gray-600 hover:text-white transition-colors">
            Manage 2FA
          </button>
        </div>

        {/* Sessions */}
        <div className="bg-navy border border-gray-700 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-700/50">
            <h4 className="font-medium text-sm">Active Sessions</h4>
          </div>
          <div className="divide-y divide-gray-700/30">
            {sessions.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-5 py-3.5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-xs text-gray-400">
                    {s.device.includes("Mac") ? "💻" : "📱"}
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">
                      {s.device} — {s.browser}
                    </p>
                    <p className="text-xs text-gray-500">
                      {s.location} &middot; {s.time}
                    </p>
                  </div>
                </div>
                {s.current ? (
                  <span className="text-xs text-teal bg-teal/10 px-2 py-0.5 rounded">
                    Current
                  </span>
                ) : (
                  <button className="text-xs text-red-400 hover:text-red-300 transition-colors font-medium">
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Login history */}
        <button className="text-sm text-teal hover:text-teal-light transition-colors font-medium">
          View recent login activity &rarr;
        </button>

        {/* Data export */}
        <div className="bg-navy border border-gray-700 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Download all your data</p>
            <p className="text-xs text-gray-500">
              Export a copy of everything we store about you
            </p>
          </div>
          <button className="px-3 py-1.5 text-xs font-medium border border-gray-700 rounded-lg text-gray-400 hover:border-gray-600 hover:text-white transition-colors">
            Export Data
          </button>
        </div>

        {/* Delete */}
        <div className="pt-4 border-t border-gray-800">
          <button className="text-sm text-red-400 hover:text-red-300 transition-colors font-medium">
            Delete account
          </button>
          <p className="text-xs text-gray-600 mt-1">
            This permanently deletes your account and all associated data.
          </p>
        </div>
      </div>
    </div>
  );
}

function PrivacySection() {
  const [anonData, setAnonData] = useState(true);
  const [historicalAccess, setHistoricalAccess] = useState(true);

  const gdprRights = [
    { label: "Access your data", action: "Request Export", style: "button" as const },
    { label: "Correct your data", action: "Contact Support", style: "link" as const },
    { label: "Delete your data", action: "Request Deletion", style: "button" as const },
    { label: "Data portability", action: "Export as JSON", style: "button" as const },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1">Data &amp; Privacy</h2>
      <p className="text-gray-400 text-sm mb-8">
        Control how your data is used and exercise your rights
      </p>

      <div className="max-w-lg space-y-6">
        {/* Data processing */}
        <div className="bg-navy border border-gray-700 rounded-xl p-5">
          <h4 className="font-medium text-sm mb-2">Data Processing</h4>
          <p className="text-sm text-gray-400 leading-relaxed">
            Your data is processed by Handy (HandyTax O&Uuml;, Estonia) and
            shared only with your assigned experts.
          </p>
        </div>

        {/* GDPR rights */}
        <div className="bg-navy border border-gray-700 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-700/50">
            <h4 className="font-medium text-sm">Your GDPR Rights</h4>
          </div>
          <div className="divide-y divide-gray-700/30">
            {gdprRights.map((r) => (
              <div
                key={r.label}
                className="flex items-center justify-between px-5 py-3.5"
              >
                <span className="text-sm text-gray-300">{r.label}</span>
                {r.style === "button" ? (
                  <button className="px-3 py-1.5 text-xs font-medium border border-gray-700 rounded-lg text-gray-400 hover:border-gray-600 hover:text-white transition-colors">
                    {r.action}
                  </button>
                ) : (
                  <button className="text-xs text-teal hover:text-teal-light transition-colors font-medium">
                    {r.action}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Consent */}
        <div className="bg-navy border border-gray-700 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-700/50">
            <h4 className="font-medium text-sm">Consent Management</h4>
          </div>
          <div className="divide-y divide-gray-700/30">
            <div className="flex items-center justify-between px-5 py-3.5">
              <span className="text-sm text-gray-300 pr-4">
                Share anonymized usage data to improve Handy
              </span>
              <Toggle on={anonData} onChange={setAnonData} />
            </div>
            <div className="flex items-center justify-between px-5 py-3.5">
              <span className="text-sm text-gray-300 pr-4">
                Allow experts to access historical data from previous tax years
              </span>
              <Toggle on={historicalAccess} onChange={setHistoricalAccess} />
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="space-y-2">
          <button className="block text-sm text-teal hover:text-teal-light transition-colors font-medium">
            View our Data Processing Agreement &rarr;
          </button>
          <button className="block text-sm text-teal hover:text-teal-light transition-colors font-medium">
            Read our Privacy Policy &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════ PAGE ═══════════════════════ */

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<Section>("profile");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <nav className="lg:w-56 flex-shrink-0">
          <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 lg:sticky lg:top-24">
            {NAV_ITEMS.map((item) => {
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    active
                      ? "bg-teal/10 text-teal"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
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
                      d={item.icon}
                    />
                  </svg>
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeSection === "profile" && <ProfileSection />}
          {activeSection === "jurisdictions" && <JurisdictionsSection />}
          {activeSection === "notifications" && <NotificationsSection />}
          {activeSection === "billing" && <BillingSection />}
          {activeSection === "security" && <SecuritySection />}
          {activeSection === "privacy" && <PrivacySection />}
        </div>
      </div>
    </div>
  );
}
