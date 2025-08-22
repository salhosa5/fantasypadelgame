// src/app/my-team/lineup/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Pos = "GK" | "DEF" | "MID" | "FWD";
type Player = {
  id: number;
  name: string;
  position: Pos;
  price: any;
  team: { shortName: string; id?: number };
};

type Pending = { from: "S" | "B"; id: number } | null;

type Chip = "NONE" | "BENCH_BOOST" | "TRIPLE_CAPTAIN" | "TWO_CAPTAINS";

function Pitch(/* unchanged props */{
  players, starters, bench, captainId, viceId, pending, validTargets,
  setPending, setCaptain, setVice, trySwapWith, openProfile, opponentMap,
}: {
  players: Player[]; starters: number[]; bench: number[]; captainId: number | null; viceId: number | null;
  pending: Pending; validTargets: Set<number>; setPending: (p: Pending) => void;
  setCaptain: (id: number) => void; setVice: (id: number) => void;
  trySwapWith: (targetId: number) => void; openProfile: (id: number) => void;
  opponentMap?: Record<number, string>;
}) {
  const byId = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const posOf = (id: number) => byId.get(id)?.position as Pos;

  const isPending = (id: number) => pending?.id === id;
  const isTarget = (id: number) => validTargets.has(id);

  const sGK = starters.filter((id) => posOf(id) === "GK");
  const sDEF = starters.filter((id) => posOf(id) === "DEF");
  const sMID = starters.filter((id) => posOf(id) === "MID");
  const sFWD = starters.filter((id) => posOf(id) === "FWD");

  function onClickStarter(id: number) {
    if (isTarget(id) && pending?.from === "B") { trySwapWith(id); return; }
    setPending(pending && pending.id === id ? null : { from: "S", id });
  }
  function onClickBench(id: number) {
    if (isTarget(id) && pending?.from === "S") { trySwapWith(id); return; }
    setPending(pending && pending.id === id ? null : { from: "B", id });
  }

  const Row = ({ ids, side }: { ids: number[]; side: "S" | "B" }) => (
    <div className="flex flex-wrap justify-center gap-3">
      {ids.map((id) => <PlayerCard key={`${side}-${id}`} id={id} side={side} />)}
    </div>
  );

  const PlayerCard = ({ id, side }: { id: number; side: "S" | "B" }) => {
    const p = byId.get(id)!;
    const isC = id === captainId;
    const isV = id === viceId;
    const pendingClass = isPending(id) ? "ring-4 ring-red-500 border-red-500"
      : isTarget(id) ? "ring-4 ring-green-500 border-green-500" : "";
    const click = () => (side === "S" ? onClickStarter(id) : onClickBench(id));
    const opp = (p.team?.id != null && opponentMap && opponentMap[p.team.id]) || null;

    return (
      <div onClick={click}
        className={`relative w-[128px] min-w-[128px] cursor-pointer select-none rounded-xl border bg-white/95 px-2 py-2 shadow-sm ${pendingClass}`}>
        <button
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-blue-600 text-white text-[10px] leading-5"
          onClick={(e) => { e.stopPropagation(); openProfile(id); }}
          title="Player profile">i</button>
        <div className="absolute -top-2 -left-2 flex gap-1">
          {isC && <span className="text-[10px] px-1.5 py-0.5 rounded bg-black text-white">C</span>}
          {isV && <span className="text-[10px] px-1.5 py-0.5 rounded bg-black text-white">VC</span>}
        </div>
        <div className="text-sm font-semibold leading-tight">{p.name}</div>
        <div className="text-[11px] text-gray-600">{p.team.shortName} • {p.position} • {String(p.price)}</div>
        {opp && <div className="text-[11px]">{opp}</div>}
        {side === "S" && (
          <div className="mt-2 flex gap-2">
            <button className={`text-[11px] px-2 py-0.5 rounded border ${isC ? "bg-black text-white" : ""}`}
                    onClick={(e) => { e.stopPropagation(); setCaptain(id); }}>C</button>
            <button className={`text-[11px] px-2 py-0.5 rounded border ${isV ? "bg-black text-white" : ""}`}
                    onClick={(e) => { e.stopPropagation(); setVice(id); }}>VC</button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border shadow-sm p-6" style={{ background: "linear-gradient(#0a7a32 0%, #128a3c 100%)" }}>
        <div className="space-y-6">
          <Row ids={sGK} side="S" />
          <Row ids={sDEF} side="S" />
          <Row ids={sMID} side="S" />
          <Row ids={sFWD} side="S" />
        </div>
      </div>
      <div className="rounded-xl border p-3 bg-white">
        <h3 className="text-sm font-semibold mb-2">Bench</h3>
        <Row ids={bench} side="B" />
      </div>
    </div>
  );
}

/* ---------------- Page ---------------- */

export default function LineupPage() {
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [starters, setStarters] = useState<number[]>([]);
  const [bench, setBench] = useState<number[]>([]);
  const [captainId, setCaptainId] = useState<number | null>(null);
  const [viceId, setViceId] = useState<number | null>(null);
  const [pending, setPending] = useState<Pending>(null);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profile, setProfile] = useState<any | null>(null);
  const [opponentMap, setOpponentMap] = useState<Record<number, string>>({});
  const [activeChip, setActiveChip] = useState<Chip | "NONE">("NONE");

  const byId = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const posOf = (id: number) => byId.get(id)?.position as Pos;

  const validStarters = (ids: number[]) => {
    if (ids.length !== 11) return false;
    let gk = 0, def = 0, mid = 0, fwd = 0;
    ids.forEach((id) => {
      const p = posOf(id);
      if (p === "GK") gk++; else if (p === "DEF") def++; else if (p === "MID") mid++; else fwd++;
    });
    return gk >= 1 && def >= 3 && mid >= 3 && fwd >= 1;
  };
  const validBench = (ids: number[]) => ids.length === 4 && ids.filter((id) => posOf(id) === "GK").length === 1;

  const ensureCaptainViceInStarters = (s: number[], C: number | null, V: number | null) => {
    let cap = C, vice = V;
    if (!cap || !s.includes(cap)) cap = s[0];
    if (!vice || !s.includes(vice) || vice === cap) {
      vice = s.find((id) => id !== cap) ?? s[0];
      if (vice === cap) vice = s[0];
    }
    return { C: cap!, V: vice! };
  };

  function buildDefaultFromPicks(ids: number[]) {
    const gk: number[] = [], def: number[] = [], mid: number[] = [], fwd: number[] = [];
    ids.forEach((id) => { const p = posOf(id); if (p === "GK") gk.push(id); else if (p === "DEF") def.push(id);
      else if (p === "MID") mid.push(id); else fwd.push(id); });
    const starters: number[] = [];
    if (gk.length) starters.push(gk[0]);
    starters.push(...def.slice(0, 3)); starters.push(...mid.slice(0, 3)); starters.push(...fwd.slice(0, 1));
    const used = new Set(starters); const leftovers = ids.filter((x) => !used.has(x));
    const nonGk = leftovers.filter((x) => posOf(x) !== "GK"); const gks = leftovers.filter((x) => posOf(x) === "GK");
    for (const id of nonGk) { if (starters.length >= 11) break; starters.push(id); }
    for (const id of gks) { if (starters.length >= 11) break; starters.push(id); }
    const startersSet = new Set(starters);
    const pool = ids.filter((x) => !startersSet.has(x));
    let bench: number[] = []; const benchGk = gk.find((id) => !startersSet.has(id)) ?? null;
    if (benchGk) bench.push(benchGk);
    for (const id of pool) { if (bench.length >= 4) break; if (benchGk && id === benchGk) continue; if (posOf(id) === "GK") continue; bench.push(id); }
    for (const id of pool) { if (bench.length >= 4) break; if (!bench.includes(id)) bench.push(id); }
    const uniq = (arr: number[]) => Array.from(new Set(arr));
    return { starters: uniq(starters).slice(0, 11), bench: uniq(bench).slice(0, 4) };
  }

  const load = async () => {
    setLoading(true); setError(null);
    const r = await fetch("/api/my-team", { cache: "no-store" });
    const j = await r.json();
    if (!r.ok) { setError(j.error || "Failed to load"); setLoading(false); return; }
    setPlayers(j.players);
    setLocked(Boolean(j.gameweek?.locked));
    setOpponentMap(j.opponentMap ?? {});
    setActiveChip((j.squad?.chip ?? "NONE") as Chip | "NONE");

    const ids: number[] = Array.isArray(j.squad?.picks)
      ? j.squad.picks.map((p: any) => (typeof p === "number" ? p : Number(p?.playerId))) : [];
    const built = buildDefaultFromPicks(ids);
    const s = built.starters; const b = built.bench;

    setStarters(s); setBench(b);
    const { C, V } = ensureCaptainViceInStarters(s, j.squad?.captainId ?? null, j.squad?.viceId ?? null);
    setCaptainId(C); setViceId(V);
    setPending(null); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const orderBySamePosFirst = (candidates: number[], targetId: number) => {
    const p = posOf(targetId);
    return [...candidates.filter((x) => posOf(x) === p), ...candidates.filter((x) => posOf(x) !== p)];
  };
  const simulateSwapValid = (outId: number, inId: number, from: "S" | "B") => {
    let newS = [...starters], newB = [...bench];
    if (from === "S") { newS = starters.filter((x) => x !== outId).concat(inId); newB = bench.filter((x) => x !== inId).concat(outId); }
    else { newS = starters.filter((x) => x !== inId).concat(outId); newB = bench.filter((x) => x !== outId).concat(inId); }
    return validStarters(newS) && validBench(newB);
  };
  const validTargets = useMemo(() => {
    if (!pending) return new Set<number>();
    if (pending.from === "S") {
      return new Set(orderBySamePosFirst(bench, pending.id).filter((bid) => simulateSwapValid(pending.id, bid, "S")));
    } else {
      return new Set(orderBySamePosFirst(starters, pending.id).filter((sid) => simulateSwapValid(pending.id, sid, "B")));
    }
  }, [pending, starters, bench, players]);

  const applySwap = (outId: number, inId: number, from: "S" | "B") => {
    let newS: number[], newB: number[];
    if (from === "S") { newS = starters.filter((x) => x !== outId).concat(inId); newB = bench.filter((x) => x !== inId).concat(outId); }
    else { newS = starters.filter((x) => x !== inId).concat(outId); newB = bench.filter((x) => x !== outId).concat(inId); }
    if (!validStarters(newS) || !validBench(newB)) return false;
    const { C, V } = ensureCaptainViceInStarters(newS, captainId, viceId);
    setStarters(newS); setBench(newB); setCaptainId(C); setViceId(V); setPending(null); setError(null); return true;
  };
  const trySwapWith = (targetId: number) => { if (!pending) return; if (!validTargets.has(targetId)) return; applySwap(pending.id, targetId, pending.from); };
  const setCaptain = (id: number) => { if (!starters.includes(id)) return; if (id === viceId) setViceId(captainId!); setCaptainId(id); };
  const setVice = (id: number) => { if (!starters.includes(id)) return; if (id === captainId) setCaptainId(viceId!); setViceId(id); };

  const save = async () => {
    if (locked) { setError("Deadline passed. Lineup locked."); return; }
    setError(null);
    const r = await fetch("/api/my-team", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ starters, bench, captainId, viceId }),
    });
    const txt = await r.text(); const j = txt ? JSON.parse(txt) : {};
    if (!r.ok) { setError(j.error || "Save failed"); return; }
    alert("Lineup saved!"); await load();
  };

  // ---------- Quick profile ----------
  const openProfile = async (id: number) => {
    setProfileLoading(true); setProfile(null);
    try {
      const r = await fetch(`/api/players/${id}`, { cache: "no-store" });
      const text = await r.text(); const data = text ? JSON.parse(text) : null;
      if (!r.ok || !data) throw new Error((data && data.error) || "Failed");
      setProfile(data);
    } catch { alert("Failed to load profile."); } finally { setProfileLoading(false); }
  };

  if (loading) return <div className="p-6">Loading…</div>;
  const banner = `Starters must have ≥1 GK, ≥3 DEF, ≥3 MID, ≥1 FWD (11 total).`;

  // ---- CHIPS (lineup-only chips) ----
  async function setChip(chip: Chip | "NONE") {
    if (locked) return;
    const r = await fetch("/api/chips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chip }),
    });
    const t = await r.text(); const j = t ? JSON.parse(t) : {};
    if (!r.ok) { alert(j.error || "Failed to set chip"); return; }
    setActiveChip(j.chip);
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Lineup</h1>
        <Link href="/transfers" className="text-blue-600 underline">← Transfers</Link>
      </div>

      {/* Chips row (lineup-only) */}
      <div className="flex items-center gap-2 text-sm">
        <span className="mr-1">Chip:</span>
        <button className={`px-2 py-1 rounded border ${activeChip==="BENCH_BOOST"?"bg-black text-white":""}`}
                disabled={locked} onClick={() => setChip("BENCH_BOOST")}>Bench Boost</button>
        <button className={`px-2 py-1 rounded border ${activeChip==="TRIPLE_CAPTAIN"?"bg-black text-white":""}`}
                disabled={locked} onClick={() => setChip("TRIPLE_CAPTAIN")}>Triple Captain</button>
        <button className={`px-2 py-1 rounded border ${activeChip==="TWO_CAPTAINS"?"bg-black text-white":""}`}
                disabled={locked} onClick={() => setChip("TWO_CAPTAINS")}>Two Captains</button>
        <button className={`px-2 py-1 rounded border ${activeChip==="NONE"?"bg-black text-white":""}`}
                disabled={locked} onClick={() => setChip("NONE")}>Clear</button>
      </div>

      {pending && (
        <div className="text-sm text-gray-700">
          {pending.from === "S"
            ? "Select a green bench player to swap in for the selected starter."
            : "Select a green starter to swap out for the selected bench player."}
        </div>
      )}
      {!validStarters(starters) && <div className="text-sm text-red-600">{banner}</div>}
      {error && <div className="text-red-600">{error}</div>}

      <Pitch
        players={players} starters={starters} bench={bench}
        captainId={captainId} viceId={viceId}
        pending={pending} validTargets={validTargets}
        setPending={setPending} setCaptain={setCaptain} setVice={setVice}
        trySwapWith={trySwapWith} openProfile={openProfile} opponentMap={opponentMap}
      />

      <div>
        <button className="px-4 py-2 rounded bg-black text-white disabled:opacity-40"
                onClick={save} disabled={locked || !validStarters(starters) || !validBench(bench)}>
          Save Lineup
        </button>
      </div>

      {profileLoading && <div className="fixed inset-0 bg-black/40 flex items-center justify-center text-white">Loading profile…</div>}
      {profile && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4" onClick={() => setProfile(null)}>
          <div className="max-w-xl w-full rounded-xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold">{profile.player.name} — {profile.player.team.shortName}</div>
              <button className="text-sm px-2 py-1 border rounded" onClick={() => setProfile(null)}>Close</button>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              {profile.player.position} • £{Number(profile.player.price).toFixed(1)}
            </div>
            <div className="mt-4">
              <div className="font-semibold mb-1">Recent (last 5)</div>
              <div className="text-sm text-gray-700">
                {profile.recent?.length
                  ? profile.recent.map((r: any) =>
                      `GW${r.fixture?.gameweekId ?? r.fixtureId} ${r.fixture?.homeTeam?.shortName ?? "?"}-${r.fixture?.awayTeam?.shortName ?? "?"} • ${r.minutes}m, G${r.goals}, A${r.assists}`
                    ).join(" | ")
                  : "No recent appearances"}
              </div>
            </div>
            <div className="mt-4">
              <div className="font-semibold mb-1">Upcoming</div>
              <div className="text-sm text-gray-700">
                {profile.upcoming?.length
                  ? profile.upcoming.map((f: any) => `GW${f.gameweekId} ${f.homeTeam.shortName}-${f.awayTeam.shortName}`).join(" | ")
                  : "No upcoming fixtures"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
