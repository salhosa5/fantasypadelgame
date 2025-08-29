// src/app/my-team/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, X } from "lucide-react";

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

// Player Profile Modal Component
function PlayerProfileModal({
  player,
  ownershipData,
  playerPoints,
  isOpen,
  onClose
}: {
  player: Player | null;
  ownershipData: Record<number, number>;
  playerPoints: Record<number, number>;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [profileLoading, setProfileLoading] = useState(false);
  const [profile, setProfile] = useState<{
    seasonTotals?: {
      appearances?: number;
      minutes?: number;
      goals?: number;
      assists?: number;
      cleanSheets?: number;
      motmAwards?: number;
      yellowCards?: number;
      redCards?: number;
    };
    upcoming?: Array<{ gameweekId: number; opponent: string }>;
    recent?: Array<{
      fixture?: { gameweekId: number };
      opponent: string;
      minutes: number;
      goals: number;
      assists: number;
      points: number;
    }>;
  } | null>(null);

  useEffect(() => {
    if (isOpen && player) {
      const loadProfile = async () => {
        setProfileLoading(true);
        setProfile(null);
        
        try {
          const r = await fetch(`/api/players/${player.id}`, { cache: "no-store" });
          const text = await r.text();
          const data = text ? JSON.parse(text) : null;
          
          if (!r.ok || !data) throw new Error((data && data.error) || "Failed");
          setProfile(data);
        } catch {
          // Silently fail - use the basic data we have
          setProfile(null);
        } finally {
          setProfileLoading(false);
        }
      };
      loadProfile();
    }
  }, [isOpen, player]);

  if (!isOpen || !player) return null;

  if (profileLoading) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center text-white z-50">
        Loading profile...
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" 
      onClick={onClose}
    >
      <div 
        className="max-w-4xl w-full max-h-[90vh] rounded-xl bg-white dark:bg-gray-800 overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{player.name}</h2>
              <p className="text-green-100 mt-1">
                {player.team.shortName} • {player.position} • £{Number(player.price).toFixed(1)}m
              </p>
            </div>
            <button 
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors" 
              onClick={onClose}
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Current Stats */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Current Stats</h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Price:</span>
                    <span className="float-right font-medium text-green-600">£{Number(player.price).toFixed(1)}m</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Ownership:</span>
                    <span className="float-right font-medium text-blue-600">{ownershipData[player.id] || 0}%</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600 dark:text-gray-400">Current GW Points:</span>
                    <span className="float-right font-medium text-purple-600">{playerPoints[player.id] || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Season Stats */}
            {profile && (
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
                    {player.position === "GK" || player.position === "DEF" ? (
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
            )}
          </div>

          {/* Recent Performance */}
          {profile?.recent?.length > 0 && (
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
                    {profile.recent.map((match, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                          GW{match.fixture?.gameweekId} • {match.opponent}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{match.minutes}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{match.goals}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{match.assists}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{match.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Squad Picker Pitch Component
function SquadPickerPitch({
  players,
  picked,
  onRemovePlayer
}: {
  players: Player[];
  picked: number[];
  onRemovePlayer: (playerId: number) => void;
}) {
  const byId = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);

  // Organize picked players by position for formation display
  const pickedByPosition = useMemo(() => {
    const positions = { GK: [], DEF: [], MID: [], FWD: [] } as Record<string, Player[]>;
    
    picked.forEach(id => {
      const player = byId.get(id);
      if (player) {
        positions[player.position].push(player);
      }
    });
    
    return positions;
  }, [picked, byId]);

  const EmptySlot = ({ position }: { position: string }) => (
    <div className="relative rounded-lg p-3 bg-white/20 border-2 border-dashed border-white/40 text-center min-w-[120px] backdrop-blur-sm hover:bg-white/30 transition-colors">
      <div className="text-white/60 text-xs font-medium mb-1">Empty</div>
      <div className="text-white/80 text-xs">{position}</div>
    </div>
  );

  const PlayerCard = ({ player }: { player: Player }) => (
    <div className="relative rounded-lg p-3 bg-white text-center min-w-[120px] shadow-lg border border-gray-200">
      <button
        onClick={() => onRemovePlayer(player.id)}
        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
      
      <div className="font-bold text-xs text-gray-900 truncate mb-1">{player.name}</div>
      <div className="text-xs text-gray-600 mb-1">
        {player.team.shortName} • {player.position}
      </div>
      <div className="text-xs text-green-600 font-semibold">
        £{Number(player.price).toFixed(1)}m
      </div>
    </div>
  );

  const renderFormationRow = (players: Player[], maxSlots: number, positionName: string) => {
    const slots = [];
    
    // Add existing players
    players.forEach((player) => {
      slots.push(<PlayerCard key={player.id} player={player} />);
    });
    
    // Add empty slots
    const emptySlots = maxSlots - players.length;
    for (let i = 0; i < emptySlots; i++) {
      slots.push(<EmptySlot key={`empty-${positionName}-${i}`} position={positionName} />);
    }
    
    return slots;
  };

  return (
    <div className="bg-gradient-to-b from-green-400 to-green-600 rounded-xl p-6 relative overflow-hidden">
      {/* Pitch Pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(90deg, rgba(255,255,255,0.05) 50%, transparent 50%),
            linear-gradient(rgba(255,255,255,0.05) 50%, transparent 50%)
          `,
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Squad Overview Header */}
      <div className="relative z-10 mb-6">
        <div className="bg-white/90 backdrop-blur rounded-lg p-4">
          <div className="text-center">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Your Squad</h2>
            <div className="text-sm text-gray-600">
              {picked.length}/15 players selected
            </div>
          </div>
        </div>
      </div>

      {/* Formation Layout */}
      <div className="relative z-10 space-y-8">
        {/* Goalkeepers */}
        <div className="flex flex-col items-center gap-3">
          <div className="text-white font-semibold text-sm">
            Goalkeepers ({pickedByPosition.GK.length}/2)
          </div>
          <div className="flex justify-center gap-3 flex-wrap">
            {renderFormationRow(pickedByPosition.GK, 2, "GK")}
          </div>
        </div>
        
        {/* Defenders */}
        <div className="flex flex-col items-center gap-3">
          <div className="text-white font-semibold text-sm">
            Defenders ({pickedByPosition.DEF.length}/5)
          </div>
          <div className="flex justify-center gap-3 flex-wrap">
            {renderFormationRow(pickedByPosition.DEF, 5, "DEF")}
          </div>
        </div>
        
        {/* Midfielders */}
        <div className="flex flex-col items-center gap-3">
          <div className="text-white font-semibold text-sm">
            Midfielders ({pickedByPosition.MID.length}/5)
          </div>
          <div className="flex justify-center gap-3 flex-wrap">
            {renderFormationRow(pickedByPosition.MID, 5, "MID")}
          </div>
        </div>
        
        {/* Forwards */}
        <div className="flex flex-col items-center gap-3">
          <div className="text-white font-semibold text-sm">
            Forwards ({pickedByPosition.FWD.length}/3)
          </div>
          <div className="flex justify-center gap-3 flex-wrap">
            {renderFormationRow(pickedByPosition.FWD, 3, "FWD")}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MyTeamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [picked, setPicked] = useState<number[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<Player["position"] | "ALL">("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "price" | "team" | "ownership" | "totalPts">("name");
  const [filterTeam, setFilterTeam] = useState<string>("");
  const [ownershipData, setOwnershipData] = useState<Record<number, number>>({});
  const [playerPoints, setPlayerPoints] = useState<Record<number, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayerForProfile, setSelectedPlayerForProfile] = useState<Player | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

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
    setOwnershipData(j.ownershipData || {});
    setPlayerPoints(j.playerPoints || {});
    
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

  const addPlayer = (id: number) => {
    setError(null);
    setPicked((curr) => {
      if (curr.includes(id)) return curr;

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

  const removePlayer = (id: number) => {
    setError(null);
    setPicked((curr) => curr.filter((x) => x !== id));
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


  const openPlayerProfile = (player: Player) => {
    setSelectedPlayerForProfile(player);
    setIsProfileModalOpen(true);
  };

  const closePlayerProfile = () => {
    setSelectedPlayerForProfile(null);
    setIsProfileModalOpen(false);
  };

  // Filter and sort players
  const filteredPlayers = players
    .filter((p) => {
      if (selectedPosition !== "ALL" && p.position !== selectedPosition) return false;
      if (filterTeam && p.team.shortName !== filterTeam) return false;
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return p.name.toLowerCase().includes(search) || 
               p.team.name.toLowerCase().includes(search) ||
               p.team.shortName.toLowerCase().includes(search);
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "price") return Number(b.price) - Number(a.price);
      if (sortBy === "team") return a.team.shortName.localeCompare(b.team.shortName);
      if (sortBy === "ownership") return (ownershipData[b.id] || 0) - (ownershipData[a.id] || 0);
      if (sortBy === "totalPts") return (playerPoints[b.id] || 0) - (playerPoints[a.id] || 0);
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Users className="h-7 w-7 text-blue-600" />
                Pick Your Squad
              </h1>
              <p className="text-gray-600 text-sm mt-1">Choose 15 players within your £{BUDGET.toFixed(1)}m budget</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-600">Budget remaining</div>
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

        {/* Error Messages */}
        {error && (
          <div className="mx-6 mb-4">
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          </div>
        )}

        {/* Main Layout */}
        <div className="flex gap-0">
          {/* Pitch Area */}
          <div className="flex-1 p-6">
            <SquadPickerPitch
              players={players}
              picked={picked}
              onRemovePlayer={removePlayer}
            />
          </div>

          {/* Sidebar */}
          <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Player Selection</h3>
                  <p className="text-sm text-gray-600">Click to add players to your squad</p>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="p-4 border-b border-gray-200 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search players or teams..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Position</label>
                <select
                  value={selectedPosition}
                  onChange={(e) => setSelectedPosition(e.target.value as Player["position"] | "ALL")}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ALL">All Positions</option>
                  <option value="GK">Goalkeepers</option>
                  <option value="DEF">Defenders</option>
                  <option value="MID">Midfielders</option>
                  <option value="FWD">Forwards</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Team</label>
                <select
                  value={filterTeam}
                  onChange={(e) => setFilterTeam(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Teams</option>
                  {Array.from(new Set(players.map(p => p.team.shortName))).sort().map(team => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Sort by</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "name" | "price" | "team" | "ownership" | "totalPts")}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="name">Name</option>
                  <option value="price">Price</option>
                  <option value="team">Team</option>
                  <option value="ownership">Ownership</option>
                  <option value="totalPts">Points</option>
                </select>
              </div>
            </div>

            {/* Player List */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-2">
                {filteredPlayers.length > 0 ? (
                  <div className="space-y-2">
                    {filteredPlayers.map(player => {
                      const isSelected = picked.includes(player.id);
                      
                      return (
                        <div
                          key={player.id}
                          className={`relative p-3 rounded-lg border cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-green-50 border-green-200 opacity-50 cursor-not-allowed"
                              : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                          }`}
                          onClick={() => !isSelected && addPlayer(player.id)}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openPlayerProfile(player);
                            }}
                            className="absolute top-1 left-1 w-5 h-5 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-blue-600 transition-colors z-10"
                          >
                            i
                          </button>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0 pl-6">
                              <div className="font-medium text-gray-900 truncate">
                                {player.name} {isSelected && "✓"}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                {player.team.shortName} • {player.position}
                                {player.status !== "FIT" && (
                                  <span className={`ml-2 px-1 py-0.5 text-xs rounded ${
                                    player.status === "INJURED" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                                  }`}>
                                    {player.status}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right ml-3">
                              <div className="text-sm font-semibold text-green-600">
                                £{Number(player.price).toFixed(1)}m
                              </div>
                              <div className="text-xs text-blue-600 mt-1">
                                {ownershipData[player.id] || 0}% owned
                              </div>
                              <div className="text-xs text-purple-600">
                                {playerPoints[player.id] || 0} pts
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No players found</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Player Profile Modal */}
          <PlayerProfileModal
            player={selectedPlayerForProfile}
            ownershipData={ownershipData}
            playerPoints={playerPoints}
            isOpen={isProfileModalOpen}
            onClose={closePlayerProfile}
          />
        </div>
      </div>
    </div>
  );
}