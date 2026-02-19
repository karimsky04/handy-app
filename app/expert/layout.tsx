"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ExpertAuthProvider,
  useExpert,
} from "@/lib/context/expert-auth-context";

const NAV_ITEMS = [
  { href: "/expert", label: "Dashboard" },
  { href: "/expert/clients", label: "My Clients" },
  { href: "/expert/workspace", label: "Workspace" },
  { href: "/expert/calendar", label: "Calendar" },
  { href: "/expert/earnings", label: "Earnings" },
  { href: "/expert/settings", label: "Settings" },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function ExpertNavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { expert, loading, signOut } = useExpert();
  const [showDropdown, setShowDropdown] = useState(false);

  // Don't show nav on login page
  if (pathname === "/expert/login") return null;

  // Loading skeleton
  if (loading) {
    return (
      <header className="border-b border-gray-800 bg-navy-dark/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight">
                Handy<span className="text-teal">.</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gold/15 text-gold border border-gold/30">
                Expert
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-700 animate-pulse" />
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-gray-800 bg-navy-dark/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Expert badge */}
          <Link
            href="/expert"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0"
          >
            <span className="text-xl font-bold tracking-tight">
              Handy<span className="text-teal">.</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gold/15 text-gold border border-gold/30">
              Expert
            </span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide mx-4 sm:mx-8">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/expert"
                  ? pathname === "/expert"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-gold/10 text-gold"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Notification bell */}
            <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
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
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </button>

            {/* Avatar with dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-8 h-8 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center text-gold text-xs font-bold hover:bg-gold/30 transition-colors"
              >
                {expert ? getInitials(expert.full_name) : "?"}
              </button>

              {showDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowDropdown(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-navy-light border border-gray-700 rounded-lg shadow-xl z-50 py-1">
                    {expert && (
                      <div className="px-3 py-2 border-b border-gray-700">
                        <p className="text-sm font-medium text-white truncate">
                          {expert.full_name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {expert.email}
                        </p>
                      </div>
                    )}
                    <button
                      onClick={async () => {
                        await signOut();
                        router.push("/expert/login");
                        router.refresh();
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function ExpertLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ExpertAuthProvider>
      <div className="min-h-screen flex flex-col">
        <ExpertNavBar />
        <main className="flex-1">{children}</main>
      </div>
    </ExpertAuthProvider>
  );
}
