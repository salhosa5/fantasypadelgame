// src/app/transfers/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Pos = "GK" | "DEF" | "MID" | "FWD";
type Player = {
  id: number;
  name: string;
  position: Pos;
  price: any;
  team: { name: string; shortName: string; id?: number };
};

const POS_LIMITS = { GK: 2, DEF: 5, MID: 5, FWD: 3 } as const;
const MAX_PER_TEAM = 3;
const BUDGET = 100.0;
// 👉 Only Wildcard belongs here
const CHIP_OPTIONS = ["NONE", "WILDCARD"] as const;

export default function TransfersPage() {
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [initial, setInitial] = useState<number[]>([]);
  const [working, setWorking] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);
  const [freeTransfers, setFreeTransfers] = useState<number>(1);
  const [chip, setChip] = useState<typeof CHIP_OPTIONS[number]>("NONE");

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const r = await fetch("/api/my-team", { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) { setError(j.error || "Failed to load"); setLoading(false); return; }
      setPlayers(j.players);
      // if a wildcard had been selected earlier it will appear here
      setChip(((j.squad?.chip ?? "NONE") === "WILDCARD" ? "WILDCARD" : "NONE") as any);

      const ids: number[] = Array.isArray(j.squad?.picks)
        ? j.squad.picks.map((p: any) => (typeof p === "number" ? p : Number(p?.playerId))) : [];
      const fifteen = ids.slice(0, 15);
      setInitial(fifteen); setWorking(fifteen);
      setFreeTransfers(Number(j.squad?.freeTransfers ?? 1));
    } catch (e) {
      console.error(e); setError("Network error");
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const byId = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const posOf = (id: number) => byId.get(id)?.position as Pos;
  const teamOf = (id: number) => byId.get(id)?.team?.shortName ?? "UNK";
  const priceOf = (id: number) => Number(byId.get(id)?.price ?? 0);
  const sumPrice = (ids: number[]) => ids.reduce((s, id) => s + priceOf(id), 0);

  const countByTeam = (ids: number[]) => {
    const m = new Map<string, number>();
    for (const id of ids) { const tn = teamOf(id); m.set(tn, (m.get(tn) ?? 0) + 1); }
    return m;
  };
  const countByPos = (ids: number[]) => {
    const c = { GK: 0, DEF: 0, MID: 0, FWD: 0 } as Record<Pos, number>;
    ids.forEach((id) => { const p = posOf(id); if (p) c[p] += 1; });
    return c;
  };

  const budgetLeft = BUDGET - sumPrice(working);
  const transfersMade = useMemo(() => {
    if (initial.length !== 15 || working.length !== 15) return 0;
    const setInit = new Set(initial); const setWork = new Set(working);
    let diff = 0; for (const id of setInit) if (!setWork.has(id)) diff++; return diff;
  }, [initial, working]);
  const projectedHit = Math.max(0, transfersMade - freeTransfers) * 4;

  const reasons: string[] = [];
  const mTeam = countByTeam(working);
  for (const [t, c] of mTeam) if (c > MAX_PER_TEAM) reasons.push(`Too many from ${t} (${c}/${MAX_PER_TEAM})`);
  const cPos = countByPos(working);
  if (cPos.GK !== POS_LIMITS.GK) reasons.push(`GK ${cPos.GK}/${POS_LIMITS.GK}`);
  if (cPos.DEF !== POS_LIMITS.DEF) reasons.push(`DEF ${cPos.DEF}/${POS_LIMITS.DEF}`);
  if (cPos.MID !== POS_LIMITS.MID) reasons.push(`MID ${cPos.MID}/${POS_LIMITS.MID}`);
  if (cPos.FWD !== POS_LIMITS.FWD) reasons.push(`FWD ${cPos.FWD}/${POS_LIMITS.FWD}`);
  if (budgetLeft < -1e-9) reasons.push(`Budget exceeded by ${(-budgetLeft).toFixed(1)}`);

  const confirmEnabled = reasons.length === 0 && working.length === 15;

  const poolForIndex = (idx: number) => {
    const outId = working[idx]; const wantPos = posOf(outId); const owned = new Set(working);
    return players.filter((p) => p.position === wantPos && !owned.has(p.id))
      .sort((a, b) => (a.team.shortName + a.name).localeCompare(b.team.shortName + b.name));
  };
  const selectReplacement = (idx: number, inId: number) => {
    setWorking((w) => { const next = [...w]; next[idx] = inId; return next; });
    setReplaceIndex(null);
  };
  const cancelReplace = () => setReplaceIndex(null);

  const save = async () => {
    setError(null);
    try {
      const r = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerIds: working, chip }),
      });
      const text = await r.text(); let j: any = {}; if (text) { try { j = JSON.parse(text); } catch {} }
      if (!r.ok) { setError(j.error || "Save failed"); return; }
      alert(`Transfers confirmed.\nTransfers made: ${j.transfers}\nProjected hit: -${j.projectedHit}\nFree transfers next: ${j.freeTransfers}\nChip: ${j.chip}`);
      await load();
    } catch (e) {
      console.error(e); setError("Network/parse error while saving.");
    }
  };

  if (loading) return <div className="p-6">Loading…</div>;

  const Section = ({ title, ids }: { title: string; ids: number[] }) => (
    <div className="mb-5">
      <h3 className="font-semibold text-sm mb-2">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {ids.map((id, i) => {
          const myIndex = working.indexOf(id);
          const p = byId.get(id)!;
          const selected = replaceIndex === myIndex;
          return (
            <div key={`${title}-${id}-${i}`} className={`border rounded px-3 py-2 flex items-center justify-between ${selected ? "ring-2 ring-red-500 border-red-500" : ""}`}>
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-gray-600">{p.team.shortName} • {p.position} • {String(p.price)}</div>
              </div>
              <button className="text-sm px-3 py-1 rounded border"
                      onClick={() => (selected ? cancelReplace() : setReplaceIndex(myIndex))}>
                {selected ? "Cancel" : "Replace"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  const idsByPos = {
    GK: working.filter((id) => posOf(id) === "GK"),
    DEF: working.filter((id) => posOf(id) === "DEF"),
    MID: working.filter((id) => posOf(id) === "MID"),
    FWD: working.filter((id) => posOf(id) === "FWD"),
  };

  const pool = replaceIndex != null ? poolForIndex(replaceIndex) : [];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Transfers</h1>
        <div className="flex gap-4 text-sm">
          <Link href="/my-team/lineup" className="underline">Lineup</Link>
          <Link href="/my-team" className="underline">Squad Picker</Link>
        </div>
      </div>

      {error && <div className="text-red-600">{error}</div>}
      {reasons.length > 0 && <div className="text-red-600 text-sm">{reasons.map((r) => <div key={r}>• {r}</div>)}</div>}

      <div className="flex items-center gap-4 text-sm">
        <div>Free transfers: <b>{freeTransfers}</b></div>
        <div>Transfers made: <b>{transfersMade}</b></div>
        <div>Projected hit: <b>-{projectedHit}</b></div>
        <div>Budget left: <b>{(BUDGET - sumPrice(working)).toFixed(1)}</b></div>

        <div className="flex items-center gap-2">
          <span>Chip:</span>
          <select className="border rounded px-2 py-1" value={chip} onChange={(e) => setChip(e.target.value as any)}>
            {CHIP_OPTIONS.map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
          </select>
          <span className="text-xs text-gray-500">(Other chips are on the Lineup page)</span>
        </div>
      </div>

      <Section title="GK" ids={idsByPos.GK} />
      <Section title="DEF" ids={idsByPos.DEF} />
      <Section title="MID" ids={idsByPos.MID} />
      <Section title="FWD" ids={idsByPos.FWD} />

      {replaceIndex != null && (
        <div className="space-y-2">
          <div className="font-semibold text-sm">Choose replacement</div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
            {pool.map((p) => (
              <div key={p.id} className="border rounded px-3 py-2 flex items-center justify-between">
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-gray-600">{p.team.shortName} • {p.position} • {String(p.price)}</div>
                </div>
                <button className="text-sm px-3 py-1 rounded border" onClick={() => selectReplacement(replaceIndex!, p.id)}>
                  Select
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-2">
        <button className="px-4 py-2 rounded bg-black text-white disabled:opacity-40"
                onClick={save} disabled={!confirmEnabled}
                title={confirmEnabled ? "Confirm transfers" : "Fix issues to confirm"}>
          Confirm Transfers
        </button>
      </div>
    </div>
  );
}
