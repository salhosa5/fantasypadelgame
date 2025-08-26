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

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Leagues</h1>
              <p className="text-gray-600 mt-1">Create or join leagues to compete with friends</p>
            </div>
            <div className="flex items-center gap-3">
              <Link 
                href="/my-team/lineup" 
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                🏆 Lineup
              </Link>
              <Link 
                href="/transfers" 
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
              >
                🔄 Transfers
              </Link>
              <Link 
                href="/my-team/live" 
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                ⚡ Live Scores
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {err && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <span className="text-red-500">⚠️</span>
            {err}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Create League Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-white">+</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Create a League</h2>
              <p className="text-gray-600 text-sm mt-1">Start your own league and invite friends</p>
            </div>
            <div className="space-y-4">
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="Enter league name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
              <button
                className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
                onClick={createLeague}
                disabled={loading || !name.trim()}
              >
                {loading ? "Creating..." : "Create League"}
              </button>
            </div>
          </div>

          {/* Join League Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-white">🎯</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Join a League</h2>
              <p className="text-gray-600 text-sm mt-1">Use an invite code to join existing league</p>
            </div>
            <div className="space-y-4">
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono text-center"
                placeholder="Invite code (e.g., 6CHARS)"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                disabled={loading}
                maxLength={6}
              />
              <button
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
                onClick={joinLeague}
                disabled={loading || !code.trim()}
              >
                {loading ? "Joining..." : "Join League"}
              </button>
            </div>
          </div>
        </div>

        {/* Your Leagues Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">🏆</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Your Leagues</h2>
            </div>
          </div>
          
          <div className="p-6">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="ml-3 text-gray-600">Loading leagues...</span>
              </div>
            )}
            
            {!loading && leagues.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-gray-400">🏁</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No leagues yet</h3>
                <p className="text-gray-600 text-sm">Create your first league or join one with an invite code</p>
              </div>
            )}

            {!loading && leagues.length > 0 && (
              <div className="grid gap-4">
                {leagues.map((lg) => (
                  <div key={lg.id} className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Link 
                            href={`/leagues/${lg.code}`} 
                            className="text-lg font-semibold text-gray-900 hover:text-purple-600 transition-colors"
                          >
                            {lg.name}
                          </Link>
                          {lg.isAdmin && (
                            <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 flex items-center gap-2">
                          <span>Code:</span>
                          <code className="px-2 py-1 bg-gray-100 rounded font-mono text-xs">{lg.code}</code>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link 
                          href={`/leagues/${lg.code}`}
                          className="px-4 py-2 text-sm font-medium bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                        >
                          View Standings
                        </Link>
                        <button
                          className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                          onClick={() => leaveLeague(lg.id)}
                          disabled={loading}
                        >
                          Leave
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
