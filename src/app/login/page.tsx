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
      let j: any = {};
      try { j = text ? JSON.parse(text) : {}; } catch {}

      if (!r.ok) {
        setErr(j.error || "Sign in failed");
        setSubmitting(false);
        return;
      }

      // cookie 'uid' is now set by the API — go to next page
      router.replace(nextUrl);
    } catch {
      setErr("Network error");
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto p-6 space-y-4">
      <h1 className="text-xl font-bold">Sign in</h1>

      {err && <div className="text-red-600 text-sm">{err}</div>}

      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          className="w-full bg-black text-white rounded px-3 py-2 disabled:opacity-40"
          disabled={submitting}
        >
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="text-sm">
        No account?{" "}
        <Link href={`/register?next=${encodeURIComponent(nextUrl)}`} className="underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
