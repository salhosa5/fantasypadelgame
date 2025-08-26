// src/app/transfers/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  Zap,
  Target,
  Search,
  X,
  Users
} from "lucide-react";

type Pos = "GK" | "DEF" | "MID" | "FWD";
type Player = {
  id: number;
  name: string;
  position: Pos;
  price: number | string;
  team: { name: string; shortName: string; id?: number };
};

const POS_LIMITS = { GK: 2, DEF: 5, MID: 5, FWD: 3 } as const;
const MAX_PER_TEAM = 3;
const BUDGET = 100.0;

type ChipOption = "NONE" | "WILDCARD";

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
            
            {/* Upcoming Fixtures */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Upcoming Fixtures</h3>
              <div className="space-y-2">
                {profile?.upcoming?.length ? (
                  profile.upcoming.slice(0, 5).map((fixture, i) => (
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

// Pitch Component for Transfers
function TransfersPitch({
  players,
  working,
  replaceIndex,
  onSelectPlayer,
  freeTransfers,
  transfersMade,
  budgetLeft,
  chip,
  onOpenPlayerProfile
}: {
  players: Player[];
  working: number[];
  replaceIndex: number | null;
  onSelectPlayer: (index: number) => void;
  freeTransfers: number;
  transfersMade: number;
  budgetLeft: number;
  chip: string;
  onOpenPlayerProfile: (player: Player) => void;
}) {
  const byId = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  
  const positionGroups = useMemo(() => {
    const gk: { id: number; index: number }[] = [];
    const def: { id: number; index: number }[] = [];
    const mid: { id: number; index: number }[] = [];
    const fwd: { id: number; index: number }[] = [];
    
    working.slice(0, 11).forEach((id, index) => {
      const player = byId.get(id);
      if (!player) return;
      
      switch (player.position) {
        case "GK": gk.push({ id, index }); break;
        case "DEF": def.push({ id, index }); break;
        case "MID": mid.push({ id, index }); break;
        case "FWD": fwd.push({ id, index }); break;
      }
    });
    
    return { gk, def, mid, fwd };
  }, [working, byId]);

  const PlayerCard = ({ playerId, index }: { playerId: number; index: number }) => {
    const player = byId.get(playerId);
    if (!player) return null;
    
    const isSelected = replaceIndex === index;
    
    return (
      <div
        onClick={() => onSelectPlayer(index)}
        className={`
          relative rounded-lg p-3 cursor-pointer transition-all duration-200 hover:scale-105 text-center bg-white shadow-sm
          ${isSelected 
            ? "border-2 border-red-500 bg-red-50 shadow-lg" 
            : "border border-gray-300 hover:border-blue-400 hover:shadow-md"
          }
        `}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenPlayerProfile(player);
          }}
          className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-blue-600 transition-colors z-10"
        >
          i
        </button>
        
        <div className="font-bold text-xs text-gray-900 truncate mb-1">{player.name}</div>
        <div className="text-xs text-gray-500 mb-1">
          {player.team.shortName} • {player.position}
        </div>
        <div className="text-xs text-green-600 font-semibold">
            £{Number(player.price).toFixed(1)}m
        </div>
        
        {isSelected && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <X className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
    );
  };

  const FormationRow = ({ players }: { players: { id: number; index: number }[] }) => (
    <div className="flex justify-center gap-3 mb-4">
      {players.map(({ id, index }) => (
        <PlayerCard key={id} playerId={id} index={index} />
      ))}
    </div>
  );

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
      
      {/* Stats Header */}
      <div className="relative z-10 mb-6">
        <div className="bg-white/90 backdrop-blur rounded-lg p-4">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-sm text-gray-600">Free Transfers</div>
              <div className="text-xl font-bold text-blue-600">{freeTransfers}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Transfers Made</div>
              <div className="text-xl font-bold text-green-600">{transfersMade}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Point Hit</div>
              <div className="text-xl font-bold text-red-600">
                -{Math.max(0, transfersMade - freeTransfers) * 4}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Budget Left</div>
              <div className={`text-xl font-bold ${budgetLeft < 0 ? 'text-red-600' : 'text-green-600'}`}>
                £{budgetLeft.toFixed(1)}m
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Formation */}
      <div className="relative z-10 space-y-4">
        {/* Goalkeeper */}
        <FormationRow players={positionGroups.gk} />
        
        {/* Defenders */}
        <FormationRow players={positionGroups.def} />
        
        {/* Midfielders */}
        <FormationRow players={positionGroups.mid} />
        
        {/* Forwards */}
        <FormationRow players={positionGroups.fwd} />
      </div>

      {/* Bench */}
      <div className="relative z-10 mt-6">
        <div className="bg-white/90 backdrop-blur rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Bench
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {working.slice(11, 15).map((id, i) => (
              <PlayerCard key={id} playerId={id} index={11 + i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Sidebar Component for Player Selection
function PlayerSelectionSidebar({
  players,
  working,
  replaceIndex,
  filterTeam,
  setFilterTeam,
  filterPosition,
  setFilterPosition,
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  ownershipData,
  playerPoints,
  onSelectReplacement,
  onCancel,
  onOpenPlayerProfile
}: {
  players: Player[];
  working: number[];
  replaceIndex: number | null;
  filterTeam: string;
  setFilterTeam: (team: string) => void;
  filterPosition: string;
  setFilterPosition: (pos: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  sortOrder: string;
  setSortOrder: (order: string) => void;
  ownershipData: Record<number, number>;
  playerPoints: Record<number, number>;
  onSelectReplacement: (playerId: number) => void;
  onCancel: () => void;
  onOpenPlayerProfile: (player: Player) => void;
}) {
  const byId = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  
  const currentPlayer = replaceIndex !== null ? byId.get(working[replaceIndex]) : null;
  
  // Show top players by default or filtered selection when a player is selected
  const availablePlayers = useMemo(() => {
    const owned = new Set(working);
    let filtered = players.filter(p => !owned.has(p.id));
    
    // If a player is selected for transfer, only show same position
    if (currentPlayer) {
      filtered = filtered.filter(p => p.position === currentPlayer.position);
    } else if (filterPosition && filterPosition !== "ALL") {
      // Otherwise use position filter
      filtered = filtered.filter(p => p.position === filterPosition);
    }
    
    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(term) ||
        p.team.shortName.toLowerCase().includes(term)
      );
    }
    
    // Apply team filter
    if (filterTeam) {
      filtered = filtered.filter(p => p.team.shortName === filterTeam);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case "price":
          aVal = Number(a.price);
          bVal = Number(b.price);
          break;
        case "ownership":
          aVal = ownershipData[a.id] || 0;
          bVal = ownershipData[b.id] || 0;
          break;
        case "totalPts":
          aVal = playerPoints[a.id] || 0;
          bVal = playerPoints[b.id] || 0;
          break;
        default:
          aVal = a.name;
          bVal = b.name;
      }
      
      if (sortBy === "name") {
        const comparison = aVal.toString().localeCompare(bVal.toString());
        return sortOrder === "asc" ? comparison : -comparison;
      } else {
        const comparison = (aVal as number) - (bVal as number);
        return sortOrder === "asc" ? comparison : -comparison;
      }
    });
    
    // If no player selected, show top players from each position (FPL style)
    if (!currentPlayer && !searchTerm && filterPosition === "ALL") {
      const byPosition: Record<string, Player[]> = {};
      filtered.forEach(p => {
        if (!byPosition[p.position]) byPosition[p.position] = [];
        byPosition[p.position].push(p);
      });
      
      // Show top players from each position
      const topPlayers: Player[] = [];
      ["GK", "DEF", "MID", "FWD"].forEach(pos => {
        if (byPosition[pos]) {
          const count = pos === "GK" ? 2 : pos === "FWD" ? 3 : 5;
          topPlayers.push(...byPosition[pos].slice(0, count));
        }
      });
      
      return topPlayers;
    }
    
    return filtered;
  }, [currentPlayer, players, working, filterTeam, filterPosition, searchTerm, sortBy, sortOrder, ownershipData, playerPoints]);

  const uniqueTeams = useMemo(() => {
    const teams = availablePlayers.map(p => p.team.shortName);
    return [...new Set(teams)].sort();
  }, [availablePlayers]);

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">
              {currentPlayer ? `Replace ${currentPlayer.name}` : 'Player Selection'}
            </h3>
            <p className="text-sm text-gray-600">
              {currentPlayer ? `${currentPlayer.position} options` : 'Browse available players'}
            </p>
          </div>
          {currentPlayer && (
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
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
        
        {!currentPlayer && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Position</label>
            <select
              value={filterPosition}
              onChange={(e) => setFilterPosition(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Positions</option>
              <option value="GK">Goalkeepers</option>
              <option value="DEF">Defenders</option>
              <option value="MID">Midfielders</option>
              <option value="FWD">Forwards</option>
            </select>
          </div>
        )}
        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Team</label>
          <select
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Teams</option>
            {uniqueTeams.map(team => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="name">Name</option>
              <option value="price">Price</option>
              <option value="ownership">Ownership</option>
              <option value="totalPts">Points</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="asc">{sortBy === "name" ? "A-Z" : "Low-High"}</option>
              <option value="desc">{sortBy === "name" ? "Z-A" : "High-Low"}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Player List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {availablePlayers.length > 0 ? (
            <div className="space-y-2">
              {availablePlayers.map(player => (
                <div
                  key={player.id}
                  className="relative p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
                  onClick={() => onSelectReplacement(player.id)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenPlayerProfile(player);
                    }}
                    className="absolute top-1 left-1 w-5 h-5 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-blue-600 transition-colors z-10"
                  >
                    i
                  </button>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 pl-8">
                      <div className="font-medium text-gray-900 truncate">
                        {player.name}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {player.team.shortName} • {player.position}
                      </div>
                    </div>
                    <div className="text-right ml-3">
                      <div className="text-sm font-semibold text-green-600">
                        £{Number(player.price).toFixed(1)}m
                      </div>
                      <div className="text-xs text-gray-500">
                        {ownershipData[player.id] || 0}% owned
                      </div>
                      <div className="text-xs text-blue-600 font-medium">
                        {playerPoints[player.id] || 0} pts
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
  );
}

export default function TransfersPage() {
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [initial, setInitial] = useState<number[]>([]);
  const [working, setWorking] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ownershipData, setOwnershipData] = useState<Record<number, number>>({});
  const [playerPoints, setPlayerPoints] = useState<Record<number, number>>({});

  // Player profile modal state
  const [selectedPlayerForProfile, setSelectedPlayerForProfile] = useState<Player | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const openPlayerProfile = (player: Player) => {
    setSelectedPlayerForProfile(player);
    setIsProfileModalOpen(true);
  };

  const closePlayerProfile = () => {
    setSelectedPlayerForProfile(null);
    setIsProfileModalOpen(false);
  };

  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);
  const [freeTransfers, setFreeTransfers] = useState<number>(1);
  const [chip, setChip] = useState<ChipOption>("NONE");
  const [chipAvailability, setChipAvailability] = useState<{
    availableChips?: Array<{ chip: string; available: boolean; reason?: string }>;
  } | null>(null);

  // Filter and sort state for sidebar
  const [filterTeam, setFilterTeam] = useState<string>("");
  const [filterPosition, setFilterPosition] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortBy, setSortBy] = useState<"name" | "price" | "ownership" | "totalPts">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // All hooks must be called before any early returns
  const byId = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  
  const budgetLeft = useMemo(() => {
    const sumPrice = (ids: number[]) => ids.reduce((s, id) => s + (Number(byId.get(id)?.price) || 0), 0);
    return BUDGET - sumPrice(working);
  }, [working, byId]);

  const transfersMade = useMemo(() => {
    if (initial.length !== 15 || working.length !== 15) return 0;
    const setInit = new Set(initial);
    const setWork = new Set(working);
    let diff = 0;
    for (const id of setInit) if (!setWork.has(id)) diff++;
    return diff;
  }, [initial, working]);

  const isWildcardActive = chip === "WILDCARD";
  const projectedHit = isWildcardActive ? 0 : Math.max(0, transfersMade - freeTransfers) * 4;

  const reasons: string[] = [];
  const countByPos = (ids: number[]) => {
    const c = { GK: 0, DEF: 0, MID: 0, FWD: 0 } as Record<Pos, number>;
    ids.forEach((id) => {
      const p = byId.get(id)?.position as Pos;
      if (p) c[p] += 1;
    });
    return c;
  };

  const countByTeam = (ids: number[]) => {
    const m = new Map<string, number>();
    for (const id of ids) {
      const tn = byId.get(id)?.team?.shortName ?? "UNK";
      m.set(tn, (m.get(tn) ?? 0) + 1);
    }
    return m;
  };

  const mTeam = countByTeam(working);
  for (const [t, c] of mTeam) if (c > MAX_PER_TEAM) reasons.push(`Too many from ${t} (${c}/${MAX_PER_TEAM})`);
  const cPos = countByPos(working);
  if (cPos.GK !== POS_LIMITS.GK) reasons.push(`GK ${cPos.GK}/${POS_LIMITS.GK}`);
  if (cPos.DEF !== POS_LIMITS.DEF) reasons.push(`DEF ${cPos.DEF}/${POS_LIMITS.DEF}`);
  if (cPos.MID !== POS_LIMITS.MID) reasons.push(`MID ${cPos.MID}/${POS_LIMITS.MID}`);
  if (cPos.FWD !== POS_LIMITS.FWD) reasons.push(`FWD ${cPos.FWD}/${POS_LIMITS.FWD}`);
  if (budgetLeft < -1e-9) reasons.push(`Budget exceeded by ${(-budgetLeft).toFixed(1)}`);

  const confirmEnabled = reasons.length === 0 && working.length === 15;

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
      setPlayers(j.players);
      setChip(((j.squad?.chip ?? "NONE") === "WILDCARD" ? "WILDCARD" : "NONE") as any);
      setOwnershipData(j.ownershipData || {});
      setPlayerPoints(j.playerPoints || {});

      const ids: number[] = Array.isArray(j.squad?.picks)
        ? j.squad.picks.map((p: any) => (typeof p === "number" ? p : Number(p?.playerId))) : [];
      const fifteen = ids.slice(0, 15);
      setInitial(fifteen);
      setWorking(fifteen);
      setFreeTransfers(Number(j.squad?.freeTransfers ?? 1));
    } catch (e) {
      console.error(e);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const loadChipAvailability = async () => {
    try {
      const r = await fetch("/api/chips", { cache: "no-store" });
      const j = await r.json();
      if (r.ok) setChipAvailability(j);
    } catch (e) {
      console.error("Failed to load chip availability:", e);
    }
  };

  useEffect(() => {
    load();
    loadChipAvailability();
  }, []);

  // Early return for loading - after all hooks
  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
            <div className="flex gap-6">
              <div className="flex-1 h-96 bg-gray-200 rounded-xl"></div>
              <div className="w-96 h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectPlayer = (index: number) => {
    setReplaceIndex(index);
    // Reset filters when selecting a new player
    setFilterTeam("");
    setSortBy("name");
    setSortOrder("asc");
  };

  const selectReplacement = (newPlayerId: number) => {
    if (replaceIndex === null) return;
    
    setWorking((w) => {
      const next = [...w];
      next[replaceIndex] = newPlayerId;
      return next;
    });
    setReplaceIndex(null);
  };

  const cancelSelection = () => {
    setReplaceIndex(null);
  };

  const handleChipChange = (newChip: ChipOption) => {
    // Check availability for WILDCARD
    if (newChip === "WILDCARD" && chipAvailability) {
      const wildcardInfo = chipAvailability.availableChips?.find(c => c.chip === "WILDCARD");
      if (wildcardInfo && !wildcardInfo.available) {
        alert(`Wildcard is not available: ${wildcardInfo.reason}`);
        return;
      }
    }
    setChip(newChip);
  };

  const save = async () => {
    setError(null);
    try {
      const r = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerIds: working, chip }),
      });
      const text = await r.text();
      let j: { 
        error?: string;
        freeTransfers?: number;
        chip?: ChipOption;
        transfers?: number;
        projectedHit?: number;
      } = {};
      if (text) {
        try { 
          j = JSON.parse(text); 
        } catch {
          // Silent catch for invalid JSON
        }
      }
      if (!r.ok) {
        setError(j.error || "Save failed");
        return;
      }

      // Update state immediately with response data
      if (typeof j.freeTransfers === 'number') {
        setFreeTransfers(j.freeTransfers);
      }
      if (j.chip) {
        setChip(j.chip);
      }

      const message = isWildcardActive
        ? `Wildcard used! Unlimited transfers this gameweek.\nTransfers made: ${j.transfers}\nChip: ${j.chip}`
        : `Transfers confirmed.\nTransfers made: ${j.transfers}\nProjected hit: -${j.projectedHit}\nFree transfers remaining: ${j.freeTransfers}\nChip: ${j.chip}`;

      alert(message);
      await load();
      await loadChipAvailability();
    } catch (e) {
      console.error(e);
      setError("Network/parse error while saving.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <TrendingUp className="h-7 w-7 text-blue-600" />
                Transfers
              </h1>
              <p className="text-gray-600 text-sm mt-1">Build your perfect squad</p>
            </div>
            
            <div className="flex items-center gap-3">
              <Link
                href="/my-team/lineup"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Target className="h-4 w-4" />
                Lineup
              </Link>
              <Link
                href="/my-team/live"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Zap className="h-4 w-4" />
                Live Scores
              </Link>
            </div>
          </div>
        </div>

        {/* Chip Selection */}
        <div className="px-6 pb-4">
          <div className="flex justify-center gap-3">
            <button
              className={`px-6 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                chip === "NONE"
                  ? "bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg"
                  : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
              onClick={() => handleChipChange("NONE")}
            >
              Normal Transfers
            </button>
            <button
              className={`px-6 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                chip === "WILDCARD"
                  ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg"
                  : "bg-white text-gray-700 border border-gray-200 hover:border-purple-300 hover:bg-purple-50"
              } ${chipAvailability?.availableChips?.find(c => c.chip === "WILDCARD")?.available === false ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => handleChipChange("WILDCARD")}
            >
              🃏 Wildcard
            </button>
          </div>
        </div>

        {/* Error Messages */}
        {error && (
          <div className="mx-6 mb-4">
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Transfer Error</h3>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {reasons.length > 0 && (
          <div className="mx-6 mb-4">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Squad Issues</h3>
                  <div className="mt-1 text-sm text-yellow-700">
                    {reasons.map((r) => (
                      <div key={r} className="flex items-center gap-1">
                        <span className="text-yellow-500">•</span>
                        {r}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Layout */}
        <div className="flex gap-0">
          {/* Pitch Area */}
          <div className="flex-1 p-6">
            <TransfersPitch
              players={players}
              working={working}
              replaceIndex={replaceIndex}
              onSelectPlayer={selectPlayer}
              freeTransfers={freeTransfers}
              transfersMade={transfersMade}
              budgetLeft={budgetLeft}
              chip={chip}
              onOpenPlayerProfile={openPlayerProfile}
            />
          </div>

          {/* Sidebar */}
          <PlayerSelectionSidebar
            players={players}
            working={working}
            replaceIndex={replaceIndex}
            filterTeam={filterTeam}
            setFilterTeam={setFilterTeam}
            filterPosition={filterPosition}
            setFilterPosition={setFilterPosition}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            ownershipData={ownershipData}
            playerPoints={playerPoints}
            onSelectReplacement={selectReplacement}
            onCancel={cancelSelection}
            onOpenPlayerProfile={openPlayerProfile}
          />
        </div>

        {/* Save Section */}
        <div className="p-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="font-semibold text-gray-900">Confirm Transfers</h3>
                {transfersMade > 0 ? (
                  <p className="text-sm text-gray-600 mt-1">
                    {transfersMade} transfer{transfersMade > 1 ? 's' : ''} ready to save
                    {!isWildcardActive && projectedHit > 0 && (
                      <span className="text-red-600 font-medium"> (-{projectedHit} points)</span>
                    )}
                  </p>
                ) : (
                  <p className="text-sm text-gray-600 mt-1">No changes made yet</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={load}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Reset
                </button>

                <button
                  className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    confirmEnabled
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                  onClick={save}
                  disabled={!confirmEnabled}
                  title={confirmEnabled ? "Save your transfers" : "Fix squad issues first"}
                >
                  {isWildcardActive ? (
                    <>
                      <Zap className="h-4 w-4" />
                      Activate Wildcard
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Confirm Transfers
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Transfer cost breakdown */}
            {transfersMade > 0 && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Transfers made:</span>
                    <span className="font-medium">{transfersMade}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Free transfers:</span>
                    <span className="font-medium">{freeTransfers}</span>
                  </div>
                  {!isWildcardActive && (
                    <div className="flex justify-between items-center border-t border-gray-200 mt-2 pt-2">
                      <span className="text-gray-900 font-medium">Point deduction:</span>
                      <span className={`font-bold ${projectedHit > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        -{projectedHit}
                      </span>
                    </div>
                  )}
                  {isWildcardActive && (
                    <div className="flex justify-between items-center border-t border-gray-200 mt-2 pt-2">
                      <span className="text-green-700 font-medium">Wildcard cost:</span>
                      <span className="font-bold text-green-600">FREE</span>
                    </div>
                  )}
                </div>
              </div>
            )}
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
  );
}