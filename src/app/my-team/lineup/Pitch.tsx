// src/app/my-team/lineup/Pitch.tsx
"use client";

import React, { useMemo } from "react";

type Pos = "GK" | "DEF" | "MID" | "FWD";
type Player = {
  id: number;
  name: string;
  position: Pos;
  price: any;
  team: { shortName: string };
};

type Pending = { from: "S" | "B"; id: number } | null;

type Props = {
  players: Player[];
  starters: number[];
  bench: number[];
  captainId: number | null;
  viceId: number | null;
  pending: Pending;
  validTargets: Set<number>;
  // helpers
  setPending: (p: Pending) => void;
  setCaptain: (id: number) => void;
  setVice: (id: number) => void;
  trySwapWith: (targetId: number) => void;
};

export default function Pitch({
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
}: Props) {
  const byId = useMemo(() => new Map(players.map(p => [p.id, p])), [players]);

  const posOf = (id: number) => byId.get(id)?.position as Pos;

  const sGK = starters.filter(id => posOf(id) === "GK");
  const sDEF = starters.filter(id => posOf(id) === "DEF");
  const sMID = starters.filter(id => posOf(id) === "MID");
  const sFWD = starters.filter(id => posOf(id) === "FWD");

  const isPending = (id: number) => pending?.id === id;
  const isTarget  = (id: number) => validTargets.has(id);

  function onClickStarter(id: number) {
    if (isTarget(id) && pending?.from === "B") {
      trySwapWith(id);
      return;
    }
    // select/deselect this starter
    setPending(pending && pending.id === id ? null : { from: "S", id });
  }
  function onClickBench(id: number) {
    if (isTarget(id) && pending?.from === "S") {
      trySwapWith(id);
      return;
    }
    // select/deselect this bench player
    setPending(pending && pending.id === id ? null : { from: "B", id });
  }

  const PitchRow = ({ ids }: { ids: number[] }) => (
    <div className="flex flex-wrap justify-center gap-3">
      {ids.map(id => <PlayerCard key={id} id={id} side="S" />)}
    </div>
  );

  const BenchRow = ({ ids }: { ids: number[] }) => (
    <div className="flex flex-wrap justify-center gap-3">
      {ids.map(id => <PlayerCard key={id} id={id} side="B" />)}
    </div>
  );

  const PlayerCard = ({ id, side }: { id: number; side: "S" | "B" }) => {
    const p = byId.get(id)!;
    const pendingClass =
      isPending(id) ? "ring-4 ring-red-500 border-red-500" :
      isTarget(id)  ? "ring-4 ring-green-500 border-green-500" : "";

    const onClick = () => side === "S" ? onClickStarter(id) : onClickBench(id);

    const isC = id === captainId;
    const isV = id === viceId;

    return (
      <div
        onClick={onClick}
        className={`relative w-[128px] min-w-[128px] cursor-pointer select-none
                    rounded-xl border bg-white/90 px-2 py-2 shadow-sm ${pendingClass}`}
      >
        {/* C/VC badges */}
        <div className="absolute -top-2 -left-2 flex gap-1">
          {isC && <span className="text-[10px] px-1.5 py-0.5 rounded bg-black text-white">C</span>}
          {isV && <span className="text-[10px] px-1.5 py-0.5 rounded bg-black text-white">VC</span>}
        </div>

        <div className="text-sm font-semibold leading-tight">{p.name}</div>
        <div className="text-[11px] text-gray-600">
          {p.team.shortName} • {p.position} • {String(p.price)}
        </div>

        {/* Actions (only for starters) */}
        {side === "S" && (
          <div className="mt-2 flex gap-2">
            <button
              className={`text-[11px] px-2 py-0.5 rounded border ${isC ? "bg-black text-white" : ""}`}
              onClick={(e) => { e.stopPropagation(); setCaptain(id); }}
            >
              C
            </button>
            <button
              className={`text-[11px] px-2 py-0.5 rounded border ${isV ? "bg-black text-white" : ""}`}
              onClick={(e) => { e.stopPropagation(); setVice(id); }}
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
        className="rounded-2xl border shadow-sm p-4"
        style={{
          background:
            "linear-gradient(#0a7a32 0%, #128a3c 100%)",
        }}
      >
        <div className="space-y-6">
          {/* GK */}
          <PitchRow ids={sGK} />
          {/* DEF */}
          <PitchRow ids={sDEF} />
          {/* MID */}
          <PitchRow ids={sMID} />
          {/* FWD */}
          <PitchRow ids={sFWD} />
        </div>
      </div>

      {/* Bench strip */}
      <div className="rounded-xl border p-3 bg-white">
        <h3 className="text-sm font-semibold mb-2">Bench</h3>
        <BenchRow ids={bench} />
      </div>
    </div>
  );
}
