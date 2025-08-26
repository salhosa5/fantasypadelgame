// src/app/leagues/[code]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function LeagueStandings() {
  const { code } = useParams<{ code: string }>();
  const invite = String(code).toUpperCase();

  const [data, setData] = useState<{
    league?: { 
      name: string; 
      members?: Array<{ 
        userId: string; 
        name: string; 
        gwPoints: number; 
        totalPoints: number; 
      }> 
    };
    join?: boolean;
  } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const safeJson = async (res: Response) => {
    const text = await res.text();
    try {
      return text ? JSON.parse(text) : {};
    } catch {
      return {};
    }
  };

  useEffect(() => {
    (async () => {
      setErr(null);
      const r = await fetch(`/api/leagues/${encodeURIComponent(invite)}`, {
        cache: "no-store",
      });
      const j = await safeJson(r);
      if (!r.ok) {
        setErr(j.error || "Failed to load");
        return;
      }
      setData(j);
    })();
  }, [invite]);

  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!data) return <div className="p-6">Loading…</div>;

  const { league, standings, currentGameweek } = data;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{league.name} — Standings</h1>
          {currentGameweek && (
            <div className="text-sm text-gray-600">
              Current GW: <span className="font-medium">{currentGameweek.name}</span>
            </div>
          )}
        </div>
        <Link href="/leagues" className="text-blue-600 underline">
          ← All leagues
        </Link>
      </div>

      <table className="min-w-[520px] border rounded overflow-hidden">
        <thead>
          <tr className="bg-gray-50 text-left">
            <th className="px-3 py-2">#</th>
            <th className="px-3 py-2">Manager</th>
            <th className="px-3 py-2">GW</th>
            <th className="px-3 py-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row: { userId: string; name: string; gwPoints: number; totalPoints: number }, i: number) => (
            <tr key={row.userId} className="border-t">
              <td className="px-3 py-2">{i + 1}</td>
              <td className="px-3 py-2">{row.name}</td>
              <td className="px-3 py-2">{row.gwPoints}</td>
              <td className="px-3 py-2 font-semibold">{row.totalPoints}</td>
            </tr>
          ))}
          {standings.length === 0 && (
            <tr>
              <td className="px-3 py-2" colSpan={4}>
                No members yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
