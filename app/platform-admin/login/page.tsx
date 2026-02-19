"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/platform-admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Check admin role
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: expertRow } = await supabase
        .from("experts")
        .select("role")
        .eq("auth_user_id", user.id)
        .single();

      if (!expertRow || expertRow.role !== "admin") {
        setError("Access denied. Admin privileges required.");
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-dark px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl font-bold tracking-tight">
              Handy<span className="text-teal">.</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple/15 text-purple-light border border-purple/30">
              Platform
            </span>
          </div>
          <p className="text-sm text-gray-500">Admin access only</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-navy-light border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple/50 transition-colors"
              placeholder="admin@handytax.io"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-navy-light border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple/50 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-purple text-white font-semibold text-sm hover:bg-purple-dark transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in to Platform Admin"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function PlatformAdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-navy-dark">
          <div className="w-8 h-8 rounded-full border-2 border-purple border-t-transparent animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
