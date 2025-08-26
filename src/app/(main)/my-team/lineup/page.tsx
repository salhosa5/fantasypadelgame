// src/app/my-team/lineup/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Pos = "GK" | "DEF" | "MID" | "FWD";
type Chip = "WILDCARD" | "BENCH_BOOST" | "TRIPLE_CAPTAIN" | "TWO_CAPTAINS";
type Pending = { id: number; from: "S" | "B" } | null;

type Player = {
  id: number;
  name: string;
  position: Pos;
  price: number | string;
  status: string;
  team: { id: number; name: string; shortName: string };
};

/* ---------------- Pitch Component ---------------- */
function Pitch({
  players,
  starters,
  bench,
  captainId,
  viceId,
  pending,
  validTargets,
  setPending,
  setCaptain,
  setVice,
  trySwapWith,
  openProfile,
  opponentMap,
}: {
  players: Player[];
  starters: number[];
  bench: number[];
  captainId: number | null;
  viceId: number | null;
  pending: Pending;
  validTargets: Set<number>;
  setPending: (p: Pending) => void;
  setCaptain: (id: number) => void;
  setVice: (id: number) => void;
  trySwapWith: (id: number) => void;
  openProfile: (id: number) => void;
  opponentMap: Record<number, string>;
}) {
  const byId = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const posOf = (id: number) => byId.get(id)?.position as Pos;

  // Split starters by position
  const sGK = starters.filter((id) => posOf(id) === "GK");
  const sDEF = starters.filter((id) => posOf(id) === "DEF");
  const sMID = starters.filter((id) => posOf(id) === "MID");
  const sFWD = starters.filter((id) => posOf(id) === "FWD");

  const onClickStarter = (id: number) => {
    if (pending) {
      if (pending.from === "B" && validTargets.has(id)) {
        trySwapWith(id);
      } else {
        setPending(null);
      }
    } else {
      setPending({ id, from: "S" });
    }
  };

  const onClickBench = (id: number) => {
    if (pending) {
      if (pending.from === "S" && validTargets.has(id)) {
        trySwapWith(id);
      } else if (pending.from === "B" && validTargets.has(id)) {
        // Bench-to-bench swap
        trySwapWith(id);
      } else {
        setPending(null);
      }
    } else {
      setPending({ id, from: "B" });
    }
  };

  const PlayerCard = ({ id, side }: { id: number; side: "S" | "B" }) => {
    const p = byId.get(id);
    if (!p) return null;

    const isPending = (x: number) => pending?.id === x;
    const isTarget = (x: number) => validTargets.has(x);
    const isC = id === captainId;
    const isV = id === viceId;
    
    const pendingClass = isPending(id) 
      ? "ring-4 ring-red-400 border-red-500 scale-105"
      : isTarget(id) 
      ? "ring-4 ring-green-400 border-green-500 hover:scale-105" 
      : "hover:scale-105";
    
    const click = () => (side === "S" ? onClickStarter(id) : onClickBench(id));
    const opp = (p.team?.id != null && opponentMap && opponentMap[p.team.id]) || null;

    return (
      <div 
        onClick={click}
        className={`relative cursor-pointer select-none rounded-2xl border-2 bg-gradient-to-br from-white to-gray-50 px-3 py-3 shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300 transform-gpu ${pendingClass}`}
        style={{ 
          minWidth: '130px',
          borderColor: isC ? '#fbbf24' : isV ? '#6b7280' : isPending(id) ? '#ef4444' : isTarget(id) ? '#10b981' : '#e5e7eb'
        }}
      >
        {/* Info button */}
        <button
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white text-xs font-bold shadow-lg hover:scale-110 transition-transform z-10"
          onClick={(e) => { e.stopPropagation(); openProfile(id); }}
          title="Player info"
        >
          i
        </button>
        
        {/* Captain/Vice badges */}
        <div className="absolute -top-2 -left-2 flex gap-1 z-10">
          {isC && (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg">
              <span className="text-xs font-black text-black">C</span>
            </div>
          )}
          {isV && (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center shadow-lg">
              <span className="text-xs font-black text-white">V</span>
            </div>
          )}
        </div>
        
        {/* Player info */}
        <div className="text-sm font-bold text-gray-800 mb-1 pr-8">{p.name}</div>
        <div className="text-xs text-gray-600 font-medium">
          {p.team.shortName} • {p.position} • £{Number(p.price).toFixed(1)}
        </div>
        {opp && <div className="text-xs text-blue-600 font-medium mt-1">vs {opp}</div>}
        
        {/* Captain/Vice buttons for starters */}
        {side === "S" && (
          <div className="mt-2 flex gap-1">
            <button 
              className={`text-xs px-2 py-1 rounded-full font-bold transition-all ${
                isC 
                ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-sm" 
                : "bg-gray-200 hover:bg-yellow-200 text-gray-700"
              }`}
              onClick={(e) => { e.stopPropagation(); setCaptain(id); }}
            >
              Captain
            </button>
            <button 
              className={`text-xs px-2 py-1 rounded-full font-bold transition-all ${
                isV 
                ? "bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-sm" 
                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              }`}
              onClick={(e) => { e.stopPropagation(); setVice(id); }}
            >
              Vice
            </button>
          </div>
        )}

        {/* Status indicator for injured players */}
        {p.status !== "FIT" && (
          <div className="absolute top-1 right-8 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full font-bold">
            {p.status}
          </div>
        )}
      </div>
    );
  };

  const Row = ({ ids, side }: { ids: number[]; side: "S" | "B" }) => {
    if (side === "B") {
      return (
        <div className="flex gap-2 justify-center flex-wrap">
          {ids.map((id) => <PlayerCard key={id} id={id} side={side} />)}
        </div>
      );
    }
    
    return (
      <div className="flex gap-2 justify-center flex-wrap">
        {ids.map((id) => <PlayerCard key={id} id={id} side={side} />)}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Pitch */}
      <div
        className="rounded-3xl border-2 shadow-2xl p-6 sm:p-8 lg:p-10 relative overflow-hidden"
        style={{ 
          background: "linear-gradient(45deg, #0d4f24 0%, #1a7a3a 25%, #0f6e2d 50%, #1a7a3a 75%, #0d4f24 100%)",
          minHeight: "550px",
          border: "3px solid #ffffff20"
        }}
      >
        {/* Enhanced pitch markings with realistic look */}
        <div className="absolute inset-6 border-4 border-white/40 rounded-2xl">
          {/* Goal areas */}
          <div className="absolute inset-x-8 top-0 h-16 border-x-4 border-b-4 border-white/30 rounded-b-lg"></div>
          <div className="absolute inset-x-8 bottom-0 h-16 border-x-4 border-t-4 border-white/30 rounded-t-lg"></div>
          
          {/* Center line and circle */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/30 transform -translate-y-0.5"></div>
          <div className="absolute top-1/2 left-1/2 w-20 h-20 border-4 border-white/30 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white/40 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
          
          {/* Penalty areas */}
          <div className="absolute inset-x-16 top-0 h-8 border-x-2 border-b-2 border-white/20 rounded-b"></div>
          <div className="absolute inset-x-16 bottom-0 h-8 border-x-2 border-t-2 border-white/20 rounded-t"></div>
          
          {/* Corner arcs */}
          <div className="absolute top-0 left-0 w-8 h-8 border-r-2 border-b-2 border-white/20 rounded-br-full"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-l-2 border-b-2 border-white/20 rounded-bl-full"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-r-2 border-t-2 border-white/20 rounded-tr-full"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-l-2 border-t-2 border-white/20 rounded-tl-full"></div>
        </div>

        {/* Subtle grass pattern overlay */}
        <div 
          className="absolute inset-0 opacity-10 rounded-3xl"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 8px,
              rgba(255,255,255,0.05) 8px,
              rgba(255,255,255,0.05) 16px
            )`
          }}
        ></div>

        {/* Formation layout with better spacing */}
        <div className="relative z-10 flex flex-col justify-between h-full min-h-[450px] py-4">
          {/* Goalkeeper - top of the pitch */}
          <div className="flex justify-center mb-4">
            <Row ids={sGK} side="S" />
          </div>
          
          {/* Defenders */}
          <div className="flex justify-center mb-4">
            <Row ids={sDEF} side="S" />
          </div>
          
          {/* Midfielders */}
          <div className="flex justify-center mb-4">
            <Row ids={sMID} side="S" />
          </div>
          
          {/* Forwards - bottom of the pitch */}
          <div className="flex justify-center">
            <Row ids={sFWD} side="S" />
          </div>
        </div>
      </div>
      
      {/* Enhanced Bench */}
      <div className="rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-6 shadow-lg">
        <h3 className="text-lg font-bold mb-4 text-center text-gray-800 dark:text-gray-200 flex items-center justify-center gap-2">
          <span>Bench</span>
          <span className="text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full font-medium">Substitutes</span>
        </h3>
        <Row ids={bench} side="B" />
      </div>
    </div>
  );
}

/* ---------------- Main Page Component ---------------- */
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
  const [gameweek, setGameweek] = useState<any>(null);

  const byId = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const posOf = (id: number) => byId.get(id)?.position as Pos;
  
  const countByPos = (ids: number[]) => {
    const c = { GK: 0, DEF: 0, MID: 0, FWD: 0 } as Record<Pos, number>;
    ids.forEach((id) => { const p = posOf(id); if (p) c[p] += 1; });
    return c;
  };
  
  const sortBenchWithGKFirst = (benchPlayers: number[]) => {
    const gkPlayer = benchPlayers.find(id => posOf(id) === "GK");
    const nonGkPlayers = benchPlayers.filter(id => posOf(id) !== "GK");
    return gkPlayer ? [gkPlayer, ...nonGkPlayers] : benchPlayers;
  };

  const validStarters = (ids: number[]) => {
    if (ids.length !== 11) return false;
    let gk = 0, def = 0, mid = 0, fwd = 0;
    ids.forEach((id) => {
      const p = posOf(id);
      if (p === "GK") gk++;
      else if (p === "DEF") def++;
      else if (p === "MID") mid++;
      else if (p === "FWD") fwd++;
    });
    return gk === 1 && def >= 3 && mid >= 2 && fwd >= 1;
  };

  const validBench = (ids: number[]) => {
    return ids.length === 4 && ids.filter((id) => posOf(id) === "GK").length === 1;
  };

  const ensureCaptainViceInStarters = (s: number[], C: number | null, V: number | null) => {
    let cap = C, vice = V;
    if (!cap || !s.includes(cap)) cap = s[0];
    if (!vice || !s.includes(vice) || vice === cap) {
      vice = s.find((id) => id !== cap) ?? s[0];
    }
    return { C: cap!, V: vice! };
  };

  function buildDefaultFromPicks(ids: number[]) {
    if (!ids || ids.length === 0) {
      console.warn("buildDefaultFromPicks: No player IDs provided");
      return { starters: [], bench: [] };
    }

    const gk: number[] = [], def: number[] = [], mid: number[] = [], fwd: number[] = [];
    
    ids.forEach((id) => {
      const p = posOf(id);
      if (!p) {
        console.warn("buildDefaultFromPicks: No position found for player ID", id);
        return;
      }
      if (p === "GK") gk.push(id);
      else if (p === "DEF") def.push(id);
      else if (p === "MID") mid.push(id);
      else if (p === "FWD") fwd.push(id);
    });
    
    const starters: number[] = [];
    
    // Check if we have enough players for a valid formation  
    if (gk.length < 1 || def.length < 3 || mid.length < 2 || fwd.length < 1) {
      // Don't log error if user simply hasn't selected players yet
      if (ids.length < 15) {
        // User hasn't completed squad selection - return empty formation
        return {
          starters: [],
          bench: []
        };
      }
      
      // Log only if we have players but they're incorrectly distributed
      console.warn("buildDefaultFromPicks: Invalid player distribution for formation:", {
        gk: gk.length, 
        def: def.length, 
        mid: mid.length, 
        fwd: fwd.length,
        totalPlayers: ids.length
      });
      
      // Return whatever we have, even if invalid
      return {
        starters: ids.slice(0, Math.min(11, ids.length)),
        bench: ids.slice(11, Math.min(15, ids.length))
      };
    }
    
    // Build valid formation: 1 GK, 3+ DEF, 2+ MID, 1+ FWD
    starters.push(gk[0]); // Exactly 1 GK
    starters.push(...def.slice(0, 3)); // At least 3 DEF
    starters.push(...mid.slice(0, 2)); // At least 2 MID  
    starters.push(...fwd.slice(0, 1)); // At least 1 FWD
    
    const used = new Set(starters);
    const leftovers = ids.filter((x) => !used.has(x));
    const nonGk = leftovers.filter((x) => posOf(x) !== "GK");
    const gks = leftovers.filter((x) => posOf(x) === "GK");
    
    // Fill remaining spots intelligently up to 11, respecting position limits
    // Max formation: 1 GK, 5 DEF, 5 MID, 3 FWD (but at least 3 DEF, 3 MID, 1 FWD)
    const currentCounts = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
    starters.forEach(id => {
      const pos = posOf(id);
      if (pos) currentCounts[pos]++;
    });

    // Add more players while respecting formation limits
    for (const id of nonGk) {
      if (starters.length >= 11) break;
      
      const pos = posOf(id);
      if (!pos) continue;
      
      // Check if we can add this position without breaking formation rules
      if (pos === "DEF" && currentCounts.DEF >= 5) continue;
      if (pos === "MID" && currentCounts.MID >= 5) continue;
      if (pos === "FWD" && currentCounts.FWD >= 3) continue;
      
      starters.push(id);
      currentCounts[pos]++;
    }
    
    const startersSet = new Set(starters);
    const pool = ids.filter((x) => !startersSet.has(x));
    let benchPlayers: number[] = [];
    
    // Always put goalkeeper first on bench
    const benchGk = gk.find((id) => !startersSet.has(id)) ?? null;
    if (benchGk) benchPlayers.push(benchGk);
    
    // Add other players to bench (excluding GK)
    for (const id of pool) {
      if (benchPlayers.length >= 4) break;
      if (posOf(id) === "GK") continue; // Skip all GKs since we already added the bench GK first
      benchPlayers.push(id);
    }
    
    const uniq = (arr: number[]) => Array.from(new Set(arr));
    const finalStarters = uniq(starters).slice(0, 11);
    const finalBench = uniq(benchPlayers).slice(0, 4);
    
    // Final validation - if formation is still invalid, log error and return defaults
    const starterCounts = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
    finalStarters.forEach(id => {
      const p = posOf(id);
      if (p) starterCounts[p]++;
    });
    
    if (starterCounts.GK !== 1 || starterCounts.DEF < 3 || starterCounts.MID < 2 || starterCounts.FWD < 1) {
      console.error("Invalid formation after buildDefaultFromPicks:", starterCounts);
    }
    
    return { 
      starters: finalStarters, 
      bench: finalBench 
    };
  }

  const load = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const r = await fetch("/api/my-team", { cache: "no-store" });
      const j = await r.json();
      
      if (!r.ok) {
        setError(j.error || "Failed to load");
        setLoading(false);
        return;
      }
      
      setPlayers(j.players || []);
      setGameweek(j.gameweek || null);
      setLocked(Boolean(j.gameweek?.locked));
      setOpponentMap(j.opponentMap ?? {});
      setActiveChip((j.squad?.chip ?? "NONE") as Chip | "NONE");

      const ids: number[] = Array.isArray(j.squad?.picks)
        ? j.squad.picks.map((p: any) => (typeof p === "number" ? p : Number(p?.playerId)))
        : [];
        
      const built = buildDefaultFromPicks(ids);
      
      // Validate the built formation
      if (!validStarters(built.starters)) {
        console.warn("Invalid starters formation detected, rebuilding...", built.starters);
        // Rebuild with stricter validation
        const rebuilt = buildDefaultFromPicks(ids);
        setStarters(rebuilt.starters);
        setBench(sortBenchWithGKFirst(rebuilt.bench));
      } else {
        setStarters(built.starters);
        setBench(sortBenchWithGKFirst(built.bench));
      }
      
      const { C, V } = ensureCaptainViceInStarters(
        built.starters, 
        j.squad?.captainId ?? null, 
        j.squad?.viceId ?? null
      );
      setCaptainId(C);
      setViceId(V);
      setPending(null);
    } catch (err) {
      setError("Failed to load squad");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const orderBySamePosFirst = (candidates: number[], targetId: number) => {
    const p = posOf(targetId);
    return [
      ...candidates.filter((x) => posOf(x) === p),
      ...candidates.filter((x) => posOf(x) !== p)
    ];
  };

  const simulateSwapValid = (outId: number, inId: number, from: "S" | "B") => {
    let newS = [...starters], newB = [...bench];
    if (from === "S") {
      newS = starters.filter((x) => x !== outId).concat(inId);
      newB = bench.filter((x) => x !== inId).concat(outId);
    } else {
      newS = starters.filter((x) => x !== inId).concat(outId);
      newB = bench.filter((x) => x !== outId).concat(inId);
    }
    return validStarters(newS) && validBench(newB);
  };

  const validTargets = useMemo(() => {
    if (!pending) return new Set<number>();
    if (pending.from === "S") {
      return new Set(
        orderBySamePosFirst(bench, pending.id)
          .filter((bid) => simulateSwapValid(pending.id, bid, "S"))
      );
    } else {
      // For bench players, allow swapping with starters AND other bench players
      const validStarters = orderBySamePosFirst(starters, pending.id)
        .filter((sid) => simulateSwapValid(pending.id, sid, "B"));
      const validBenchSwaps = bench.filter((bid) => bid !== pending.id); // Can swap with any other bench player
      return new Set([...validStarters, ...validBenchSwaps]);
    }
  }, [pending, starters, bench]);

  const applySwap = (outId: number, inId: number, from: "S" | "B") => {
    let newS: number[], newB: number[];
    if (from === "S") {
      newS = starters.filter((x) => x !== outId).concat(inId);
      newB = bench.filter((x) => x !== inId).concat(outId);
    } else {
      newS = starters.filter((x) => x !== inId).concat(outId);
      newB = bench.filter((x) => x !== outId).concat(inId);
    }
    
    if (!validStarters(newS) || !validBench(newB)) return false;
    
    // Ensure goalkeeper is always first on bench
    const sortedBench = sortBenchWithGKFirst(newB);
    
    const { C, V } = ensureCaptainViceInStarters(newS, captainId, viceId);
    setStarters(newS);
    setBench(sortedBench);
    setCaptainId(C);
    setViceId(V);
    setPending(null);
    setError(null);
    return true;
  };

  const trySwapBenchPositions = (id1: number, id2: number) => {
    const newBench = [...bench];
    const idx1 = newBench.indexOf(id1);
    const idx2 = newBench.indexOf(id2);
    
    if (idx1 === -1 || idx2 === -1) return;
    
    // Swap positions
    newBench[idx1] = id2;
    newBench[idx2] = id1;
    
    // Ensure goalkeeper is always first on bench
    const sortedBench = sortBenchWithGKFirst(newBench);
    
    setBench(sortedBench);
    setPending(null);
    setError(null);
  };

  const trySwapWith = (targetId: number) => {
    if (!pending) return;
    if (!validTargets.has(targetId)) return;
    
    // Check if this is a bench-to-bench swap
    if (pending.from === "B" && bench.includes(targetId)) {
      trySwapBenchPositions(pending.id, targetId);
    } else {
      applySwap(pending.id, targetId, pending.from);
    }
  };

  const setCaptain = (id: number) => {
    if (!starters.includes(id)) return;
    if (id === viceId) setViceId(captainId!);
    setCaptainId(id);
  };

  const setVice = (id: number) => {
    if (!starters.includes(id)) return;
    if (id === captainId) setCaptainId(viceId!);
    setViceId(id);
  };

  const save = async () => {
    if (locked) {
      setError("Deadline passed. Lineup locked.");
      return;
    }
    
    setError(null);
    
    try {
      const r = await fetch("/api/my-team", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starters, bench, captainId, viceId }),
      });
      
      const txt = await r.text();
      const j = txt ? JSON.parse(txt) : {};
      
      if (!r.ok) {
        setError(j.error || "Save failed");
        return;
      }
      
      alert("Lineup saved!");
      await load();
    } catch (err) {
      setError("Failed to save lineup");
    }
  };

  const openProfile = async (id: number) => {
    setProfileLoading(true);
    setProfile(null);
    
    try {
      const r = await fetch(`/api/players/${id}`, { cache: "no-store" });
      const text = await r.text();
      const data = text ? JSON.parse(text) : null;
      
      if (!r.ok || !data) throw new Error((data && data.error) || "Failed");
      setProfile(data);
    } catch {
      alert("Failed to load player profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  async function setChip(chip: Chip | "NONE") {
    if (locked) return;
    
    try {
      const r = await fetch("/api/chips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chip }),
      });
      
      const t = await r.text();
      const j = t ? JSON.parse(t) : {};
      
      if (!r.ok) {
        alert(j.error || "Failed to set chip");
        return;
      }
      
      setActiveChip(j.chip);
    } catch {
      alert("Failed to set chip");
    }
  }

  if (loading) return <div className="p-6">Loading...</div>;

  const banner = `Starters must have ≥1 GK, ≥3 DEF, ≥2 MID, ≥1 FWD (11 total).`;
  const currentGW = gameweek?.name || "Current";

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto flex gap-6 p-4 sm:p-6">
        {/* Main content */}
        <div className="flex-1 space-y-4">

      {/* Gameweek Info */}
      {gameweek && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-blue-900">{gameweek.name}</h2>
              <p className="text-blue-700 text-sm">
                Deadline: {gameweek.deadline ? new Date(gameweek.deadline).toLocaleDateString('en-GB', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'TBD'}
              </p>
            </div>
            {gameweek.deadline && (
              <div className="text-right">
                <p className="text-xs text-blue-600">Time remaining</p>
                <p className="text-sm font-mono text-blue-800">
                  {new Date(gameweek.deadline) > new Date() ? 'Active' : 'Finished'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modern Chip Buttons */}
      <div className="flex justify-center gap-3 mb-6">
        <button
          className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
            activeChip === "BENCH_BOOST" 
              ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg transform scale-105" 
              : "bg-white text-gray-700 border border-gray-200 hover:border-green-300 hover:bg-green-50"
          }`}
          disabled={locked}
          onClick={() => setChip("BENCH_BOOST")}
        >
          🚀 Bench Boost
        </button>
        <button
          className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
            activeChip === "TRIPLE_CAPTAIN" 
              ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg transform scale-105" 
              : "bg-white text-gray-700 border border-gray-200 hover:border-purple-300 hover:bg-purple-50"
          }`}
          disabled={locked}
          onClick={() => setChip("TRIPLE_CAPTAIN")}
        >
          ⭐ Triple Captain
        </button>
        <button
          className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
            activeChip === "TWO_CAPTAINS" 
              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105" 
              : "bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:bg-blue-50"
          }`}
          disabled={locked}
          onClick={() => setChip("TWO_CAPTAINS")}
        >
          👥 Two Captains
        </button>
        <button
          className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
            activeChip === "NONE" 
              ? "bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg transform scale-105" 
              : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
          }`}
          disabled={locked}
          onClick={() => setChip("NONE")}
        >
          ❌ None
        </button>
      </div>

      {/* Status messages */}
      {pending && (
        <div className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
          {pending.from === "S"
            ? "Click a green-highlighted bench player to swap with the selected starter."
            : "Click a green-highlighted starter to swap with the selected bench player."}
        </div>
      )}

      {!validStarters(starters) && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">{banner}</div>
      )}
      
      {error && (
        <div className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">{error}</div>
      )}

      {/* Pitch */}
      <Pitch
        players={players}
        starters={starters}
        bench={bench}
        captainId={captainId}
        viceId={viceId}
        pending={pending}
        validTargets={validTargets}
        setPending={setPending}
        setCaptain={setCaptain}
        setVice={setVice}
        trySwapWith={trySwapWith}
        openProfile={openProfile}
        opponentMap={opponentMap}
      />

      {/* Save button */}
      <div className="flex justify-center">
        <button
          className="px-6 py-2 rounded bg-black dark:bg-gray-700 text-white font-medium disabled:opacity-40"
          onClick={save}
          disabled={locked || !validStarters(starters) || !validBench(bench)}
        >
          Save Lineup
        </button>
      </div>

      {/* Profile modal */}
      {profileLoading && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center text-white z-50">
          Loading profile...
        </div>
      )}
      
      {profile && (
        <div 
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" 
          onClick={() => setProfile(null)}
        >
          <div 
            className="max-w-4xl w-full max-h-[90vh] rounded-xl bg-white dark:bg-gray-800 overflow-hidden" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{profile.player.name}</h2>
                  <p className="text-green-100 mt-1">
                    {profile.player.team.shortName} • {profile.player.position} • £{Number(profile.player.price).toFixed(1)}m
                    {profile.player.status !== "FIT" && (
                      <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded">
                        {profile.player.status}
                      </span>
                    )}
                  </p>
                </div>
                <button 
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors" 
                  onClick={() => setProfile(null)}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Season Stats */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Season Statistics</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Appearances:</span>
                        <span className="float-right font-medium text-gray-900 dark:text-gray-100">{profile.seasonTotals?.appearances || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Minutes:</span>
                        <span className="float-right font-medium text-gray-900 dark:text-gray-100">{profile.seasonTotals?.minutes || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Goals:</span>
                        <span className="float-right font-medium text-gray-900 dark:text-gray-100">{profile.seasonTotals?.goals || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Assists:</span>
                        <span className="float-right font-medium text-gray-900 dark:text-gray-100">{profile.seasonTotals?.assists || 0}</span>
                      </div>
                      {profile.player.position === "GK" || profile.player.position === "DEF" ? (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Clean Sheets:</span>
                          <span className="float-right font-medium text-gray-900 dark:text-gray-100">{profile.seasonTotals?.cleanSheets || 0}</span>
                        </div>
                      ) : null}
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">MOTM:</span>
                        <span className="float-right font-medium text-gray-900 dark:text-gray-100">{profile.seasonTotals?.motmAwards || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Yellow Cards:</span>
                        <span className="float-right font-medium text-gray-900 dark:text-gray-100">{profile.seasonTotals?.yellowCards || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Red Cards:</span>
                        <span className="float-right font-medium text-gray-900 dark:text-gray-100">{profile.seasonTotals?.redCards || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Upcoming Fixtures */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Upcoming Fixtures</h3>
                  <div className="space-y-2">
                    {profile.upcoming?.length ? (
                      profile.upcoming.slice(0, 5).map((fixture: any, i: number) => (
                        <div key={i} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">GW{fixture.gameweekId}</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">{fixture.opponent}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400 text-sm">No upcoming fixtures available</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Performance */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Performance</h3>
                <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Match</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Mins</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Goals</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Assists</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Points</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {profile.recent?.length ? (
                        profile.recent.map((match: any, i: number) => (
                          <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                              GW{match.fixture?.gameweekId} • {match.opponent}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{match.minutes}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{match.goals}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{match.assists}</td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{match.points}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 text-center">
                            No recent performance data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block w-80 space-y-4">
          {/* Formation Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Formation</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Starters:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{starters.length}/11</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Bench:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{bench.length}/4</span>
              </div>
              {activeChip !== "NONE" && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Active Chip:</span>
                  <span className="font-medium text-yellow-600 dark:text-yellow-400">{activeChip.replace("_", " ")}</span>
                </div>
              )}
            </div>
          </div>

          {/* Squad Value */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Squad Value</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Value</span>
                <span className="font-bold text-green-600 dark:text-green-400">
                  £{(starters.concat(bench).reduce((sum, id) => sum + (Number(byId.get(id)?.price) || 0), 0)).toFixed(1)}m
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Budget Remaining</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  £{(100 - starters.concat(bench).reduce((sum, id) => sum + (Number(byId.get(id)?.price) || 0), 0)).toFixed(1)}m
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Captain</span>
                <span className="font-medium text-yellow-600 dark:text-yellow-400">
                  {byId.get(captainId!)?.name || 'None'}
                </span>
              </div>
            </div>
          </div>

          {/* Position Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Position Breakdown</h3>
            <div className="space-y-2">
              {Object.entries(countByPos(starters)).map(([pos, count]) => (
                <div key={pos} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{pos}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{count}</span>
                    <div className={`w-3 h-3 rounded-full ${
                      pos === 'GK' && count === 1 ? 'bg-green-400' :
                      pos === 'DEF' && count >= 3 ? 'bg-green-400' :
                      pos === 'MID' && count >= 2 ? 'bg-green-400' :
                      pos === 'FWD' && count >= 1 ? 'bg-green-400' :
                      'bg-red-400'
                    }`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}