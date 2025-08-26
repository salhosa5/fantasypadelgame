// src/app/my-team/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Player = {
  id: number;
  name: string;
  position: "GK" | "DEF" | "MID" | "FWD";
  price: number | string;
  status: "FIT" | "INJURED" | "SUSPENDED";
  team: { name: string; shortName: string };
};

const POS_LIMITS = { GK: 2, DEF: 5, MID: 5, FWD: 3 } as const;
const MAX_PER_TEAM = 3;
const BUDGET = 100.0;

const safeJson = async (res: Response) => {
  const txt = await res.text();
  try {
    return txt ? JSON.parse(txt) : {};
  } catch {
    return {};
  }
};

function sumPrice(players: Player[], ids: number[]) {
  return ids.reduce((s, id) => {
    const p = players.find((x) => x.id === id);
    return s + (p ? Number(p.price) : 0);
  }, 0);
}

function countByPos(players: Player[], ids: number[]) {
  const c = { GK: 0, DEF: 0, MID: 0, FWD: 0 } as Record<Player["position"], number>;
  ids.forEach((id) => {
    const p = players.find((x) => x.id === id);
    if (p) c[p.position] += 1;
  });
  return c;
}

function countByTeam(players: Player[], ids: number[]) {
  const m = new Map<string, number>();
  ids.forEach((id) => {
    const p = players.find((x) => x.id === id);
    if (p) m.set(p.team.shortName, (m.get(p.team.shortName) ?? 0) + 1);
  });
  return m;
}

export default function MyTeamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [picked, setPicked] = useState<number[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<Player["position"] | "ALL">("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "price" | "team">("name");
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);

    const r = await fetch("/api/my-team", { cache: "no-store" });

    if (r.status === 401) {
      setLoading(false);
      router.replace("/login?next=/my-team");
      return;
    }

    const j = await safeJson(r);
    if (!r.ok) {
      setError(j.error || "Failed to load");
      setLoading(false);
      return;
    }


    const pickCount = Array.isArray(j.squad?.picks) ? j.squad.picks.length : 0;
    if (pickCount === 15) {
      router.replace("/my-team/lineup");
      return;
    }

    setPlayers(j.players);
    const ids = Array.isArray(j.squad?.picks)
      ? j.squad.picks
          .map((p: unknown) => (typeof p === "number" ? p : Number((p as { playerId?: number })?.playerId)))
          .filter((n: number) => Number.isFinite(n))
      : [];

    setPicked(ids);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id: number) => {
    setError(null);
    setPicked((curr) => {
      if (curr.includes(id)) return curr.filter((x) => x !== id);

      const next = [...curr, id];
      if (next.length > 15) {
        setError("You can only pick 15 players.");
        return curr;
      }

      const posCounts = countByPos(players, next);
      for (const pos of Object.keys(POS_LIMITS) as (keyof typeof POS_LIMITS)[]) {
        if (posCounts[pos] > POS_LIMITS[pos]) {
          setError(`Too many ${pos}: ${posCounts[pos]}/${POS_LIMITS[pos]}`);
          return curr;
        }
      }

      const teamCounts = countByTeam(players, next);
      for (const [tn, c] of teamCounts) {
        if (c > MAX_PER_TEAM) {
          setError(`Max ${MAX_PER_TEAM} from one team (${tn}).`);
          return curr;
        }
      }

      const spentNow = sumPrice(players, next);
      if (spentNow > BUDGET + 1e-9) {
        setError(`Budget exceeded: ${spentNow.toFixed(1)} / ${BUDGET.toFixed(1)} (you can keep picking but must get under to save)`);
      }

      return next;
    });
  };

  const save = async () => {
    setError(null);
    const r = await fetch("/api/my-team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerIds: picked }),
    });
    const j = await safeJson(r);
    if (!r.ok) {
      setError(j.error || "Save failed");
      return;
    }
    alert("Squad saved!");
    router.replace("/my-team/lineup");
  };

  if (loading) return <div className="p-6">Loading…</div>;

  const spent = sumPrice(players, picked);
  const budgetLeft = BUDGET - spent;
  const posCounts = countByPos(players, picked);

  // Filter and sort players
  const filteredPlayers = players
    .filter((p) => {
      if (selectedPosition !== "ALL" && p.position !== selectedPosition) return false;
      if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !p.team.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "price") return Number(b.price) - Number(a.price);
      if (sortBy === "team") return a.team.shortName.localeCompare(b.team.shortName);
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Pick Your Squad</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Choose 15 players within budget</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-600 dark:text-gray-400">Budget remaining</div>
                <div className={`text-lg font-bold ${budgetLeft < 0 ? "text-red-600" : "text-green-600"}`}>
                  £{budgetLeft.toFixed(1)}m
                </div>
              </div>
              <button
                className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={picked.length !== 15 || budgetLeft < 0}
                onClick={save}
              >
                Save Squad ({picked.length}/15)
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Squad Overview - FPL Style */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Squad Overview</h2>
              
              {/* Position Counts */}
              <div className="space-y-3 mb-6">
                {Object.entries(POS_LIMITS).map(([pos, limit]) => (
                  <div key={pos} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{pos}</span>
                    <span className={`text-sm px-2 py-1 rounded ${
                      posCounts[pos as keyof typeof POS_LIMITS] === limit 
                        ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300" 
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                    }`}>
                      {posCounts[pos as keyof typeof POS_LIMITS]} / {limit}
                    </span>
                  </div>
                ))}
              </div>

              {/* Quick Stats */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Players selected:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{picked.length}/15</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Money spent:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">£{spent.toFixed(1)}m</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Avg. per player:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">£{picked.length ? (spent / picked.length).toFixed(1) : "0.0"}m</span>
                </div>
              </div>
            </div>
          </div>

          {/* Player Selection */}
          <div className="lg:col-span-3">
            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
              <div className="flex flex-wrap gap-4 items-center">
                {/* Position Filter */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Position:</label>
                  <select
                    value={selectedPosition}
                    onChange={(e) => setSelectedPosition(e.target.value as Player["position"] | "ALL")}
                    className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="ALL">All Positions</option>
                    <option value="GK">Goalkeepers</option>
                    <option value="DEF">Defenders</option>
                    <option value="MID">Midfielders</option>
                    <option value="FWD">Forwards</option>
                  </select>
                </div>

                {/* Search */}
                <div className="flex items-center gap-2 flex-1 max-w-sm">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Search:</label>
                  <input
                    type="text"
                    placeholder="Player or team name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {/* Sort */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as "name" | "price" | "team")}
                    className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="name">Name</option>
                    <option value="price">Price</option>
                    <option value="team">Team</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Player List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {selectedPosition === "ALL" ? "All Players" : `${selectedPosition}s`}
                  <span className="text-gray-500 dark:text-gray-400 ml-2">({filteredPlayers.length})</span>
                </h3>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {filteredPlayers.map((player) => {
                  const isSelected = picked.includes(player.id);
                  return (
                    <div
                      key={player.id}
                      onClick={() => toggle(player.id)}
                      className={`flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                        isSelected ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" : ""
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full border-2 ${
                          isSelected ? "bg-green-500 border-green-500" : "border-gray-300 dark:border-gray-600"
                        }`} />
                        
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">{player.name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {player.team.shortName} • {player.position}
                            {player.status !== "FIT" && (
                              <span className={`ml-2 px-2 py-0.5 text-xs rounded ${
                                player.status === "INJURED" ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                              }`}>
                                {player.status}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-semibold text-gray-900 dark:text-gray-100">£{Number(player.price).toFixed(1)}m</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}