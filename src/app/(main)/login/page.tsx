// src/app/login/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const sp = useSearchParams();
  const nextUrl = sp.get("next") || "/my-team";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);
    try {
      const r = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      // tolerate empty or non-JSON body
      const text = await r.text();
      let j: { error?: string; success?: boolean } = {};
      try { j = text ? JSON.parse(text) : {}; } catch {}

      if (!r.ok) {
        setErr(j.error || "Sign in failed");
        setSubmitting(false);
        return;
      }

      // cookie 'uid' is now set by the API — trigger auth change and go to next page
      window.dispatchEvent(new Event('authChange'));
      router.replace(nextUrl);
    } catch {
      setErr("Network error");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md mx-auto p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Sign In</h1>
          <p className="text-gray-600">Welcome back to UAE Pro League Fantasy</p>
        </div>

        {err && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{err}</div>}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            className="w-full bg-black text-white font-medium rounded-lg px-4 py-3 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={submitting}
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="text-center text-sm text-gray-600">
          No account?{" "}
          <Link href={`/register?next=${encodeURIComponent(nextUrl)}`} className="text-blue-600 hover:text-blue-800 font-medium">
            Create one
          </Link>
        </div>
        
        <div className="text-center">
          <Link href="/rules" className="text-sm text-blue-600 hover:text-blue-800">
            Learn the Rules
          </Link>
        </div>
      </div>
    </div>
  );
}
