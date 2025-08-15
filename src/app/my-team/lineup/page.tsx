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
  team: { shortName: string };
};

type Pending = { from: "S" | "B"; id: number } | null;

/* ---------------- Pitch (inline component) ---------------- */

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
  trySwapWith: (targetId: number) => void;
}) {
  const byId = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const posOf = (id: number) => byId.get(id)?.position as Pos;

  const isPending = (id: number) => pending?.id === id;
  const isTarget = (id: number) => validTargets.has(id);

  // split starters by line
  const sGK = starters.filter((id) => posOf(id) === "GK");
  const sDEF = starters.filter((id) => posOf(id) === "DEF");
  const sMID = starters.filter((id) => posOf(id) === "MID");
  const sFWD = starters.filter((id) => posOf(id) === "FWD");

  function onClickStarter(id: number) {
    // if a bench player is selected and this starter is a valid target, complete swap
    if (isTarget(id) && pending?.from === "B") {
      trySwapWith(id);
      return;
    }
    // otherwise toggle selection
    setPending(pending && pending.id === id ? null : { from: "S", id });
  }

  function onClickBench(id: number) {
    // if a starter is selected and this bench player is a valid target, complete swap
    if (isTarget(id) && pending?.from === "S") {
      trySwapWith(id);
      return;
    }
    // otherwise toggle selection
    setPending(pending && pending.id === id ? null : { from: "B", id });
  }

  const Row = ({ ids, side }: { ids: number[]; side: "S" | "B" }) => (
    <div className="flex flex-wrap justify-center gap-3">
      {ids.map((id) => (
        <PlayerCard key={`${side}-${id}`} id={id} side={side} />
      ))}
    </div>
  );

  const PlayerCard = ({ id, side }: { id: number; side: "S" | "B" }) => {
    const p = byId.get(id)!;
    const isC = id === captainId;
    const isV = id === viceId;
    const pendingClass = isPending(id)
      ? "ring-4 ring-red-500 border-red-500"
      : isTarget(id)
      ? "ring-4 ring-green-500 border-green-500"
      : "";

    const click = () => (side === "S" ? onClickStarter(id) : onClickBench(id));

    return (
      <div
        onClick={click}
        className={`relative w-[128px] min-w-[128px] cursor-pointer select-none rounded-xl border bg-white/95 px-2 py-2 shadow-sm ${pendingClass}`}
      >
        {/* C/VC badges */}
        <div className="absolute -top-2 -left-2 flex gap-1">
          {isC && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-black text-white">
              C
            </span>
          )}
          {isV && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-black text-white">
              VC
            </span>
          )}
        </div>

        <div className="text-sm font-semibold leading-tight">{p.name}</div>
        <div className="text-[11px] text-gray-600">
          {p.team.shortName} • {p.position} • {String(p.price)}
        </div>

        {/* Actions for starters only */}
        {side === "S" && (
          <div className="mt-2 flex gap-2">
            <button
              className={`text-[11px] px-2 py-0.5 rounded border ${
                isC ? "bg-black text-white" : ""
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setCaptain(id);
              }}
            >
              C
            </button>
            <button
              className={`text-[11px] px-2 py-0.5 rounded border ${
                isV ? "bg-black text-white" : ""
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setVice(id);
              }}
            >
              VC
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Pitch background */}
      <div
        className="rounded-2xl border shadow-sm p-6"
        style={{
          background: "linear-gradient(#0a7a32 0%, #128a3c 100%)",
        }}
      >
        <div className="space-y-6">
          <Row ids={sGK} side="S" />
          <Row ids={sDEF} side="S" />
          <Row ids={sMID} side="S" />
          <Row ids={sFWD} side="S" />
        </div>
      </div>

      {/* Bench strip */}
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

  const byId = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const posOf = (id: number) => byId.get(id)?.position as Pos;

  // ---- constraints ----
  const validStarters = (ids: number[]) => {
    if (ids.length !== 11) return false;
    let gk = 0,
      def = 0,
      mid = 0,
      fwd = 0;
    ids.forEach((id) => {
      const p = posOf(id);
      if (p === "GK") gk++;
      else if (p === "DEF") def++;
      else if (p === "MID") mid++;
      else if (p === "FWD") fwd++;
    });
    return gk >= 1 && def >= 3 && mid >= 3 && fwd >= 2;
  };
  const validBench = (ids: number[]) => {
    if (ids.length !== 4) return false;
    return ids.filter((id) => posOf(id) === "GK").length === 1;
  };

  // captain/vice must be starters and distinct
  const ensureCaptainViceInStarters = (
    s: number[],
    C: number | null,
    V: number | null
  ) => {
    let cap = C,
      vice = V;
    if (!cap || !s.includes(cap)) cap = s[0];
    if (!vice || !s.includes(vice) || vice === cap) {
      vice = s.find((id) => id !== cap) ?? s[0];
      if (vice === cap) vice = s[0];
    }
    return { C: cap!, V: vice! };
  };

  // load squad (first 11 default starters)
  const load = async () => {
    setLoading(true);
    setError(null);
    const r = await fetch("/api/my-team", { cache: "no-store" });
    const j = await r.json();
    if (!r.ok) {
      setError(j.error || "Failed to load");
      setLoading(false);
      return;
    }

    setPlayers(j.players);
    setLocked(Boolean(j.gameweek.locked));

    const ids: number[] = Array.isArray(j.squad?.picks)
      ? j.squad.picks.map((p: any) =>
          typeof p === "number" ? p : Number(p?.playerId)
        )
      : [];
    const s = ids.slice(0, 11);
    const b = ids.slice(11, 15);
    setStarters(s);
    setBench(b);
    const { C, V } = ensureCaptainViceInStarters(
      s,
      j.squad?.captainId ?? null,
      j.squad?.viceId ?? null
    );
    setCaptainId(C);
    setViceId(V);

    setPending(null);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  // ---------- Select-to-swap helpers ----------
  const orderBySamePosFirst = (candidates: number[], targetId: number) => {
    const p = posOf(targetId);
    return [
      ...candidates.filter((x) => posOf(x) === p),
      ...candidates.filter((x) => posOf(x) !== p),
    ];
  };

  const simulateSwapValid = (outId: number, inId: number, from: "S" | "B") => {
    let newS = [...starters],
      newB = [...bench];
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
        orderBySamePosFirst(bench, pending.id).filter((bid) =>
          simulateSwapValid(pending.id, bid, "S")
        )
      );
    } else {
      return new Set(
        orderBySamePosFirst(starters, pending.id).filter((sid) =>
          simulateSwapValid(pending.id, sid, "B")
        )
      );
    }
  }, [pending, starters, bench, players]);

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

    const { C, V } = ensureCaptainViceInStarters(newS, captainId, viceId);
    setStarters(newS);
    setBench(newB);
    setCaptainId(C);
    setViceId(V);
    setPending(null);
    setError(null);
    return true;
  };

  // when user clicks a “green” target, execute swap
  const trySwapWith = (targetId: number) => {
    if (!pending) return;
    if (!validTargets.has(targetId)) return;
    const from = pending.from;
    const outId = pending.id;
    applySwap(outId, targetId, from);
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
  };

  if (loading) return <div className="p-6">Loading…</div>;

  const banner = `Starters must have ≥1 GK, ≥3 DEF, ≥3 MID, ≥2 FWD (11 total).`;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Lineup</h1>
        <Link href="/my-team" className="text-blue-600 underline">
          ← Back to Squad
        </Link>
      </div>

      {pending && (
        <div className="text-sm text-gray-700">
          {pending.from === "S"
            ? "Select a green bench player to swap in for the selected starter."
            : "Select a green starter to swap out for the selected bench player."}
        </div>
      )}
      {!validStarters(starters) && (
        <div className="text-sm text-red-600">{banner}</div>
      )}
      {error && <div className="text-red-600">{error}</div>}

      {/* --- Pitch UI --- */}
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
      />

      <div>
        <button
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-40"
          onClick={save}
          disabled={locked || !validStarters(starters) || !validBench(bench)}
        >
          Save Lineup
        </button>
      </div>
    </div>
  );
}
