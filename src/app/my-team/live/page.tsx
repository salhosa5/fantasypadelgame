// src/app/my-team/live/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

type Pos = "GK" | "DEF" | "MID" | "FWD";
type LiveRow = {
  id: number;
  name: string;
  teamShort: string;
  position: Pos;
  points: number;
  isCaptain?: boolean;
  isVice?: boolean;
};

type LivePayload = {
  gameweekId: number;
  gameweek: string; // e.g., "GW2"
  prev?: { id: number; name: string } | null;
  next?: { id: number; name: string } | null;
  chip?: "NONE" | "BENCH_BOOST" | "TRIPLE_CAPTAIN" | "TWO_CAPTAINS" | "WILDCARD";
  starters: LiveRow[];
  bench: LiveRow[];
  total: number;
};

function Pitch({ starters }: { starters: LiveRow[] }) {
  const byPos = useMemo(() => {
    const gk: LiveRow[] = [];
    const def: LiveRow[] = [];
    const mid: LiveRow[] = [];
    const fwd: LiveRow[] = [];
    for (const r of starters) {
      if (r.position === "GK") gk.push(r);
      else if (r.position === "DEF") def.push(r);
      else if (r.position === "MID") mid.push(r);
      else fwd.push(r);
    }
    return { gk, def, mid, fwd };
  }, [starters]);

  const Card = ({ r }: { r: LiveRow }) => (
    <div className="relative w-[140px] min-w-[140px] rounded-xl border bg-white/95 px-2 py-2 shadow-sm">
      <div className="absolute -top-1 -left-1 flex gap-1">
        {r.isCaptain && <span className="text-[10px] px-1.5 py-0.5 rounded bg-black text-white">C</span>}
        {r.isVice && <span className="text-[10px] px-1.5 py-0.5 rounded bg-black text-white">VC</span>}
      </div>
      <div className="text-sm font-semibold leading-tight">{r.name}</div>
      <div className="text-[11px] text-gray-600">{r.teamShort} • {r.position}</div>

      <div className="absolute -top-2 -right-2 h-6 min-w-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center px-1">
        {r.points}
      </div>
    </div>
  );

  const Row = ({ rows }: { rows: LiveRow[] }) => (
    <div className="flex flex-wrap justify-center gap-3">{rows.map((r) => <Card key={r.id} r={r} />)}</div>
  );

  return (
    <div
      className="rounded-2xl border shadow-sm p-6"
      style={{ background: "linear-gradient(#0a7a32 0%, #128a3c 100%)" }}
    >
      <div className="space-y-6">
        <Row rows={byPos.gk} />
        <Row rows={byPos.def} />
        <Row rows={byPos.mid} />
        <Row rows={byPos.fwd} />
      </div>
    </div>
  );
}

export default function LiveLineup() {
  const router = useRouter();
  const params = useSearchParams();
  const gwParam = params.get("gw");

  const [data, setData] = useState<LivePayload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load(gw?: string | null) {
    setErr(null);
    const r = await fetch(`/api/my-team/live${gw ? `?gw=${encodeURIComponent(gw)}` : ""}`, { cache: "no-store" });
    const t = await r.text();
    const j = t ? JSON.parse(t) : {};
    if (!r.ok) { setErr(j.error || "Failed to load"); return; }
    setData(j);
  }

  useEffect(() => { load(gwParam); /* eslint-disable-next-line */ }, [gwParam]);

  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!data) return <div className="p-6">Loading…</div>;

  const goPrev = () => data.prev && router.push(`/my-team/live?gw=${data.prev.id}`);
  const goNext = () => data.next && router.push(`/my-team/live?gw=${data.next.id}`);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className="border rounded px-2 py-1" disabled={!data.prev} onClick={goPrev}>←</button>
          <div className="text-xl font-bold">Live Lineup — {data.gameweek}</div>
          <button className="border rounded px-2 py-1" disabled={!data.next} onClick={goNext}>→</button>
        </div>
        <Link href="/my-team/lineup" className="underline">Edit Next GW</Link>
      </div>

      {data.chip && data.chip !== "NONE" && (
        <div className="text-sm">Active chip: <b>{data.chip.replace("_", " ")}</b></div>
      )}

      <Pitch starters={data.starters} />

      <div className="rounded-xl border p-3 bg-white">
        <h3 className="text-sm font-semibold mb-2">Bench</h3>
        <div className="flex flex-wrap gap-3">
          {data.bench.map((r) => (
            <div key={r.id} className="relative w-[140px] min-w-[140px] rounded-xl border bg-white/95 px-2 py-2">
              <div className="text-sm font-semibold leading-tight">{r.name}</div>
              <div className="text-[11px] text-gray-600">{r.teamShort} • {r.position}</div>
              <div className="absolute -top-2 -right-2 h-6 min-w-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center px-1">
                {r.points}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-right text-lg font-bold">Total: {data.total}</div>
    </div>
  );
}
