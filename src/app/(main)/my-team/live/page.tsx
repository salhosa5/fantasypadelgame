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
  breakdown?: {
    minutes: number;
    goals: number;
    assists: number;
    cleanSheet: boolean;
    goalsConceded: number;
    saves?: number;
    penSaved: number;
    penMissed: number;
    yellowCards: number;
    redCards: number;
    ownGoals: number;
    motm: boolean;
  };
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

function PlayerModal({ player, onClose }: { player: LiveRow; onClose: () => void }) {
  if (!player.breakdown) return null;

  const stats = [
    { label: "Minutes played", value: player.breakdown.minutes, points: player.breakdown.minutes >= 60 ? 2 : player.breakdown.minutes > 0 ? 1 : 0 },
    { label: "Goals", value: player.breakdown.goals, points: player.breakdown.goals * (player.position === 'FWD' ? 4 : player.position === 'MID' ? 5 : 6) },
    { label: "Assists", value: player.breakdown.assists, points: player.breakdown.assists * 3 },
    { label: "Clean sheets", value: player.breakdown.cleanSheet ? 1 : 0, points: player.breakdown.cleanSheet ? (player.position === 'GK' || player.position === 'DEF' ? 4 : player.position === 'MID' ? 1 : 0) : 0 },
    ...(player.position === 'GK' || player.position === 'DEF' ? [{ label: "Goals conceded", value: player.breakdown.goalsConceded, points: -Math.floor(player.breakdown.goalsConceded / 2) }] : []),
    ...(player.position === 'GK' && player.breakdown.saves ? [{ label: "Saves", value: player.breakdown.saves, points: Math.floor(player.breakdown.saves / 3) }] : []),
    { label: "Penalties saved", value: player.breakdown.penSaved, points: player.breakdown.penSaved * 5 },
    { label: "Penalties missed", value: player.breakdown.penMissed, points: player.breakdown.penMissed * -2 },
    { label: "Yellow cards", value: player.breakdown.yellowCards, points: player.breakdown.yellowCards * -1 },
    { label: "Red cards", value: player.breakdown.redCards, points: player.breakdown.redCards * -3 },
    { label: "Own goals", value: player.breakdown.ownGoals, points: player.breakdown.ownGoals * -2 },
    { label: "MOTM", value: player.breakdown.motm ? 1 : 0, points: player.breakdown.motm ? 2 : 0 },
  ].filter(stat => stat.value > 0 || stat.points !== 0);

  const basePoints = stats.reduce((sum, stat) => sum + stat.points, 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{player.name}</h2>
            <p className="text-gray-600 dark:text-gray-400">{player.teamShort} • {player.position}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 text-2xl">×</button>
        </div>

        <div className="mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Points breakdown</h3>
          <div className="space-y-2">
            {stats.map((stat, idx) => (
              <div key={idx} className="flex justify-between items-center py-1">
                <span className="text-sm text-gray-900 dark:text-gray-100">{stat.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{stat.value}</span>
                  <span className={`text-sm font-medium ${stat.points > 0 ? 'text-green-600' : stat.points < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                    {stat.points > 0 ? '+' : ''}{stat.points} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-600 mt-3 pt-3">
            <div className="flex justify-between items-center font-semibold">
              <span className="text-gray-900 dark:text-gray-100">Base total:</span>
              <span className="text-blue-600 dark:text-blue-400">{basePoints} pts</span>
            </div>
            {player.isCaptain && (
              <div className="flex justify-between items-center text-sm text-amber-600 dark:text-amber-400 mt-1">
                <span>Captain bonus:</span>
                <span>×{player.points === basePoints * 3 ? '3' : '2'}</span>
              </div>
            )}
            <div className="flex justify-between items-center font-bold text-lg mt-2 border-t border-gray-200 dark:border-gray-600 pt-2">
              <span className="text-gray-900 dark:text-gray-100">Final total:</span>
              <span className="text-blue-600 dark:text-blue-400">{player.points} pts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Pitch({ 
  starters, 
  onPlayerClick
}: { 
  starters: LiveRow[]; 
  onPlayerClick: (player: LiveRow) => void;
}) {
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

  const Card = ({ r }: { r: LiveRow }) => {
    return (
      <div 
        className="relative w-[110px] min-w-[110px] rounded-xl border-2 bg-gradient-to-br from-white to-gray-50 px-2 py-2 shadow-md backdrop-blur-sm cursor-pointer hover:shadow-lg hover:scale-105 hover:from-blue-50 hover:to-blue-100 transition-all duration-300 transform-gpu"
        style={{
          borderColor: r.isCaptain ? '#fbbf24' : r.isVice ? '#6b7280' : '#e5e7eb'
        }}
        onClick={() => onPlayerClick(r)}
      >
        {/* Captain/Vice badges */}
        <div className="absolute -top-2 -left-2 flex gap-1 z-10">
          {r.isCaptain && (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg">
              <span className="text-xs font-black text-black">C</span>
            </div>
          )}
          {r.isVice && (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center shadow-lg">
              <span className="text-xs font-black text-white">V</span>
            </div>
          )}
        </div>

        {/* Player info */}
        <div className="text-xs font-bold leading-tight mb-1 text-gray-800 pr-8">{r.name}</div>
        <div className="text-[11px] text-gray-600 font-medium">{r.teamShort} • {r.position}</div>

        {/* Points display */}
        <div className="absolute -top-3 -right-3 flex flex-col items-center gap-1 z-10">
          <div className={`w-8 h-8 rounded-full text-xs flex items-center justify-center px-1 font-black shadow-lg transform hover:scale-110 transition-transform ${
            r.isCaptain ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black' : 
            'bg-gradient-to-br from-blue-500 to-blue-700 text-white'
          }`}>
            {r.points}
          </div>
          {r.isCaptain && r.points > 0 && (
            <div className="text-[10px] text-gray-700 bg-yellow-100 px-2 py-0.5 rounded-full font-bold border border-yellow-300">
              {Math.floor(r.points / 2)}×2
            </div>
          )}
        </div>

        {/* Subtle glow effect for high scorers */}
        {r.points >= 10 && (
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-400/20 to-blue-400/20 pointer-events-none"></div>
        )}
      </div>
    );
  };

  // Responsive formation layout
  const FormationRow = ({ rows }: { rows: LiveRow[] }) => (
    <div className="flex flex-wrap justify-center gap-2 sm:gap-3 lg:gap-4">
      {rows.map((r) => <Card key={r.id} r={r} />)}
    </div>
  );

  return (
    <div
      className="rounded-2xl border-2 shadow-lg p-4 sm:p-6 relative overflow-hidden max-w-4xl mx-auto"
      style={{ 
        background: "linear-gradient(45deg, #0d4f24 0%, #1a7a3a 25%, #0f6e2d 50%, #1a7a3a 75%, #0d4f24 100%)",
        minHeight: "400px",
        border: "2px solid #ffffff20"
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
      <div className="relative z-10 flex flex-col justify-between h-full min-h-[400px] py-4">

        {/* Goalkeeper - top of the pitch */}
        <div className="flex justify-center mb-3">
          <FormationRow rows={byPos.gk} />
        </div>
        
        {/* Defenders */}
        <div className="flex justify-center mb-3">
          <FormationRow rows={byPos.def} />
        </div>
        
        {/* Midfielders */}
        <div className="flex justify-center mb-3">
          <FormationRow rows={byPos.mid} />
        </div>
        
        {/* Forwards - bottom of the pitch */}
        <div className="flex justify-center">
          <FormationRow rows={byPos.fwd} />
        </div>
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
  const [selectedPlayer, setSelectedPlayer] = useState<LiveRow | null>(null);

  async function load(gw?: string | null) {
    setErr(null);
    const r = await fetch(`/api/my-team/live${gw ? `?gw=${encodeURIComponent(gw)}` : ""}`, { cache: "no-store" });
    const t = await r.text();
    const j = t ? JSON.parse(t) : {};
    if (!r.ok) { setErr(j.error || "Failed to load"); return; }
    setData(j);
  }

  useEffect(() => { load(gwParam); }, [gwParam]);

  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!data) return <div className="p-6">Loading…</div>;

  const goPrev = () => data.prev && router.push(`/my-team/live?gw=${data.prev.id}`);
  const goNext = () => data.next && router.push(`/my-team/live?gw=${data.next.id}`);

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto flex gap-6 p-4 sm:p-6">
        {/* Main content */}
        <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex justify-end">
        <Link 
          href="/my-team/lineup" 
          className="underline text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
        >
          Edit Next GW
        </Link>
      </div>

      {/* Active chip indicator */}
      {data.chip && data.chip !== "NONE" && (
        <div className="bg-yellow-100 dark:bg-yellow-900/20 border-l-4 border-yellow-500 dark:border-yellow-600 p-3 rounded">
          <div className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
            Active chip: <span className="font-bold">{data.chip.replace("_", " ")}</span>
          </div>
        </div>
      )}

      {/* Gameweek Navigation */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <button 
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium text-gray-900 dark:text-gray-100" 
          disabled={!data.prev} 
          onClick={goPrev}
        >
          ← Prev
        </button>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-6 py-2 text-lg font-bold text-gray-900 dark:text-gray-100 shadow-sm">
          {data.gameweek} Live
        </div>
        <button 
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium text-gray-900 dark:text-gray-100" 
          disabled={!data.next} 
          onClick={goNext}
        >
          Next →
        </button>
      </div>

      {/* Pitch */}
      <Pitch 
        starters={data.starters} 
        onPlayerClick={setSelectedPlayer}
      />

      {/* Bench */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          <span>Bench</span>
          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">Substitutes</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {data.bench.map((r, index) => (
            <div 
              key={r.id} 
              className="relative rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 px-3 py-3 hover:shadow-md transition-shadow cursor-pointer hover:scale-105 transition-all duration-200"
              onClick={() => setSelectedPlayer(r)}
            >
              <div className="absolute -top-1 -left-1">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-600 dark:bg-gray-500 text-white">
                  {index === 0 && r.position === "GK" ? "GK" : `B${index + 1}`}
                </span>
              </div>
              <div className="text-sm font-semibold leading-tight mb-1 pr-6 text-gray-900 dark:text-gray-100">{r.name}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">{r.teamShort} • {r.position}</div>
              <div className="absolute -top-2 -right-2 h-6 min-w-6 rounded-full bg-gray-600 dark:bg-gray-500 text-white text-xs flex items-center justify-center px-1 font-bold">
                {r.points}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Total Points - Bottom center */}
      <div className="text-center mt-4">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl shadow-lg">
          <span className="text-lg font-semibold">Total Points:</span>
          <span className="text-2xl font-bold">{data.total}</span>
        </div>
      </div>

      {/* Player Modal */}
      {selectedPlayer && (
        <PlayerModal 
          player={selectedPlayer} 
          onClose={() => setSelectedPlayer(null)} 
        />
      )}
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block w-80 space-y-4">
          {/* Gameweek Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Gameweek Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Current:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{data.gameweek}</span>
              </div>
              {data.chip && data.chip !== "NONE" && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Active Chip:</span>
                  <span className="font-medium text-yellow-600 dark:text-yellow-400">{data.chip.replace("_", " ")}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Playing</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {data.starters.filter(p => p.breakdown?.minutes > 0).length}/11
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Captained</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  {data.starters.find(p => p.isCaptain)?.name || 'None'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Highest Scorer</span>
                <span className="font-medium text-purple-600 dark:text-purple-400">
                  {data.starters.reduce((prev, current) => (prev.points > current.points) ? prev : current).name}
                </span>
              </div>
            </div>
          </div>

          {/* Your Upcoming Fixtures */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Upcoming Fixtures</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {data.starters.concat(data.bench).slice(0, 6).map((player, idx) => (
                <div key={player.id} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {player.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">vs</span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {['AIN', 'WAH', 'SHJ', 'KAL', 'DHF', 'BAT'][Math.abs(player.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 6]}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex flex-col items-end">
                    <span>{['Sun', 'Mon', 'Fri', 'Sat'][idx % 4]}</span>
                    <span>{['8:30pm', '6:00pm', '9:45pm', '7:15pm'][idx % 4]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Performers */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Top Performers</h3>
            <div className="space-y-2">
              {[...data.starters].sort((a, b) => b.points - a.points).slice(0, 3).map((player, idx) => (
                <div key={player.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx === 0 ? 'bg-yellow-100 text-yellow-800' :
                      idx === 1 ? 'bg-gray-100 text-gray-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{player.name}</span>
                  </div>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{player.points}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}