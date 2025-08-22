"use client";
import { useEffect, useState } from "react";

export default function UserMenu() {
  const [me, setMe] = useState<{ email?: string; teamName?: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/auth/me", { cache: "no-store" });
        const j = await r.json();
        setMe(j.user || null);
      } catch {
        setMe(null);
      }
    })();
  }, []);

  const signOut = async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
    } catch {}
    // Hard reload to land on login flow
    window.location.href = "/login";
  };

  return (
    <div className="flex items-center gap-3">
      {me ? (
        <>
          <div className="text-sm text-gray-700">
            <span className="font-medium">{me.teamName || "My Team"}</span>
            <span className="text-gray-500"> — {me.email}</span>
          </div>
          <button
            onClick={signOut}
            className="text-sm px-2 py-1 rounded border hover:bg-gray-50"
            title="Sign out"
          >
            Sign out
          </button>
        </>
      ) : (
        <a className="text-sm underline" href="/login">
          Sign in
        </a>
      )}
    </div>
  );
}
