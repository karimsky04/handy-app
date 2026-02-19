"use client";

import {
  ExpertAuthProvider,
} from "@/lib/context/expert-auth-context";

export default function PlatformAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ExpertAuthProvider>
      <div className="min-h-screen flex bg-navy-dark">{children}</div>
    </ExpertAuthProvider>
  );
}
