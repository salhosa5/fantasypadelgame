// src/app/leagues/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type League = {
  id: string;
  name: string;
  code: string;     // invite code
  isAdmin: boolean;
};

export default function LeaguesPage() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const safeJson = async (res: Response) => {
    const text = await res.text();
    try { return text ? JSON.parse(text) : {}; } catch { return {}; }
  };

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/leagues", { cache: "no-store" });
      const j = await safeJson(r);
      if (!r.ok) { setErr(j.error || "Failed to load"); setLeagues([]); return; }
      setLeagues(j.leagues || []);
    } catch {
      setErr("Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const createLeague = async () => {
    if (!name.trim()) return;
    setErr(null); setLoading(true);
    try {
      const r = await fetch("/api/leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const j = await safeJson(r);
      if (!r.ok) { setErr(j.error || "Create failed"); return; }
      setName(""); await load();
    } catch { setErr("Create failed"); }
    finally { setLoading(false); }
  };

  const joinLeague = async () => {
    if (!code.trim()) return;
    setErr(null); setLoading(true);
    try {
      const r = await fetch("/api/leagues", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const j = await safeJson(r);
      if (!r.ok) { setErr(j.error || "Join failed"); return; }
      setCode(""); await load();
    } catch { setErr("Join failed"); }
    finally { setLoading(false); }
  };

  const leaveLeague = async (leagueId: string) => {
    setErr(null); setLoading(true);
    try {
      const r = await fetch(`/api/leagues?leagueId=${encodeURIComponent(leagueId)}`, { method: "DELETE" });
      const j = await safeJson(r);
      if (!r.ok) { setErr(j.error || "Leave failed"); return; }
      await load();
    } catch { setErr("Leave failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold">Leagues</h1>

      {err && <div className="text-red-600">{err}</div>}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="border rounded p-4 space-y-2">
          <h2 className="font-semibold">Create a league</h2>
          <input
            className="border rounded px-2 py-1 w-full"
            placeholder="League name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
          <button
            className="px-3 py-1 rounded bg-black text-white disabled:opacity-40"
            onClick={createLeague}
            disabled={loading || !name.trim()}
          >
            Create
          </button>
        </div>

        <div className="border rounded p-4 space-y-2">
          <h2 className="font-semibold">Join a league</h2>
          <input
            className="border rounded px-2 py-1 w-full"
            placeholder="Invite code (e.g., 6CHARS)"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            disabled={loading}
          />
          <button
            className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-40"
            onClick={joinLeague}
            disabled={loading || !code.trim()}
          >
            Join
          </button>
        </div>
      </div>

      <div className="border rounded p-4">
        <h2 className="font-semibold mb-2">Your leagues</h2>
        {loading && <div>Loading…</div>}
        {!loading && leagues.length === 0 && (
          <div className="text-sm text-gray-600">You haven’t joined any leagues yet.</div>
        )}

        <div className="space-y-2">
          {leagues.map((lg) => (
            <div key={lg.id} className="border rounded p-3 flex items-center justify-between">
              <div>
                {/* Link by invite code (matches the [code] route) */}
                <Link href={`/leagues/${lg.code}`} className="font-medium underline">
                  {lg.name}
                </Link>
                <div className="text-xs text-gray-600">
                  Code: <span className="font-mono">{lg.code}</span> {lg.isAdmin ? "• Admin" : ""}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/leagues/${lg.code}`} className="text-sm px-3 py-1 rounded border">
                  Standings
                </Link>
                <button
                  className="text-sm px-3 py-1 rounded border"
                  onClick={() => leaveLeague(lg.id)}
                  disabled={loading}
                >
                  Leave
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
