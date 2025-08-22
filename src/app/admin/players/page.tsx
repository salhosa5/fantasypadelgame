// src/app/admin/players/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Team = { id: number; shortName: string; name: string };
type Player = {
  id: number;
  name: string;
  teamId: number;
  position: "GK"|"DEF"|"MID"|"FWD";
  price: string; // from API as string
  status: "FIT"|"INJURED"|"SUSPENDED";
  team: Team;
};

export default function PlayersAdmin() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // filters
  const [q, setQ] = useState("");
  const [fTeam, setFTeam] = useState<number | "">("");
  const [fPos, setFPos] = useState<""|"GK"|"DEF"|"MID"|"FWD">("");

  // new player
  const [nName, setNName] = useState("");
  const [nTeam, setNTeam] = useState<number | "">("");
  const [nPos, setNPos] = useState<"GK"|"DEF"|"MID"|"FWD">("MID");
  const [nPrice, setNPrice] = useState("5.0");
  const [nStatus, setNStatus] = useState<"FIT"|"INJURED"|"SUSPENDED">("FIT");

  const safeJson = async (res: Response) => {
    const t = await res.text();
    try { return t ? JSON.parse(t) : {}; } catch { return {}; }
  };

  const load = async () => {
    setLoading(true); setErr(null);
    try {
      const r = await fetch("/api/admin/players", { cache: "no-store" });
      const j = await safeJson(r);
      if (!r.ok) { setErr(j.error || "Failed to load"); return; }
      setTeams(j.teams ?? []);
      setPlayers(j.players ?? []);
    } catch {
      setErr("Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return players.filter(p => {
      if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false;
      if (fTeam && p.teamId !== fTeam) return false;
      if (fPos && p.position !== fPos) return false;
      return true;
    });
  }, [players, q, fTeam, fPos]);

  const createPlayer = async () => {
    if (!nName || !nTeam || !nPos) { setErr("Fill name/team/pos"); return; }
    setErr(null);
    try {
      const r = await fetch("/api/admin/players", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({
          name: nName,
          teamId: Number(nTeam),
          position: nPos,
          price: Number(nPrice || 0),
          status: nStatus,
        })
      });
      const j = await safeJson(r);
      if (!r.ok) { setErr(j.error || "Create failed"); return; }
      setNName(""); setNTeam(""); setNPos("MID"); setNPrice("5.0"); setNStatus("FIT");
      await load();
    } catch {
      setErr("Create failed");
    }
  };

  const updatePlayer = async (id: number, patch: Partial<{ teamId:number; position: Player["position"]; price:number; status: Player["status"] }>) => {
    setErr(null);
    try {
      const r = await fetch("/api/admin/players", {
        method: "PATCH",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      const j = await safeJson(r);
      if (!r.ok) { setErr(j.error || "Update failed"); return; }
      await load();
    } catch {
      setErr("Update failed");
    }
  };

  const removePlayer = async (id: number) => {
    if (!confirm("Delete this player? This also removes any picks and stats for him.")) return;
    setErr(null);
    try {
      const r = await fetch(`/api/admin/players?id=${id}`, { method: "DELETE" });
      const j = await safeJson(r);
      if (!r.ok) { setErr(j.error || "Delete failed"); return; }
      await load();
    } catch {
      setErr("Delete failed");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Admin — Players</h1>
        <div className="text-sm text-gray-600">{players.length} players</div>
      </div>

      {err && <div className="text-red-600">{err}</div>}
      {loading && <div>Loading…</div>}

      {/* Create */}
      <div className="border rounded p-4 space-y-2">
        <h2 className="font-semibold">Create Player</h2>
        <div className="grid md:grid-cols-5 gap-2">
          <input className="border rounded px-2 py-1" placeholder="Name" value={nName} onChange={e=>setNName(e.target.value)} />
          <select className="border rounded px-2 py-1" value={nTeam} onChange={e=>setNTeam(e.target.value ? Number(e.target.value) : "")}>
            <option value="">Team</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.shortName}</option>)}
          </select>
          <select className="border rounded px-2 py-1" value={nPos} onChange={e=>setNPos(e.target.value as any)}>
            <option value="GK">GK</option><option value="DEF">DEF</option><option value="MID">MID</option><option value="FWD">FWD</option>
          </select>
          <input className="border rounded px-2 py-1" type="number" step="0.1" min="3.5" value={nPrice} onChange={e=>setNPrice(e.target.value)} />
          <select className="border rounded px-2 py-1" value={nStatus} onChange={e=>setNStatus(e.target.value as any)}>
            <option value="FIT">FIT</option><option value="INJURED">INJURED</option><option value="SUSPENDED">SUSPENDED</option>
          </select>
        </div>
        <button onClick={createPlayer} className="px-3 py-1 rounded bg-black text-white">Add Player</button>
      </div>

      {/* Filters */}
      <div className="border rounded p-3 flex flex-wrap gap-2 items-center">
        <input className="border rounded px-2 py-1" placeholder="Search name…" value={q} onChange={e=>setQ(e.target.value)} />
        <select className="border rounded px-2 py-1" value={fTeam} onChange={e=>setFTeam(e.target.value ? Number(e.target.value) : "")}>
          <option value="">All teams</option>
          {teams.map(t => <option key={t.id} value={t.id}>{t.shortName}</option>)}
        </select>
        <select className="border rounded px-2 py-1" value={fPos} onChange={e=>setFPos(e.target.value as any)}>
          <option value="">All positions</option>
          <option value="GK">GK</option><option value="DEF">DEF</option><option value="MID">MID</option><option value="FWD">FWD</option>
        </select>
      </div>

      {/* List */}
      <div className="border rounded">
        <div className="px-3 py-2 border-b font-semibold">Players</div>
        <div className="divide-y">
          {filtered.map(p => (
            <div key={p.id} className="p-3 grid md:grid-cols-7 items-center gap-2">
              <div className="font-medium">{p.name}</div>
              <div className="text-sm">{p.team.shortName}</div>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={p.teamId}
                onChange={e=>updatePlayer(p.id, { teamId: Number(e.target.value) })}
              >
                {teams.map(t => <option key={t.id} value={t.id}>{t.shortName}</option>)}
              </select>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={p.position}
                onChange={e=>updatePlayer(p.id, { position: e.target.value as any })}
              >
                <option value="GK">GK</option><option value="DEF">DEF</option>
                <option value="MID">MID</option><option value="FWD">FWD</option>
              </select>
              <input
                className="border rounded px-2 py-1 text-sm"
                type="number" step="0.1"
                value={p.price}
                onChange={e=>updatePlayer(p.id, { price: Number(e.target.value || 0) })}
              />
              <select
                className="border rounded px-2 py-1 text-sm"
                value={p.status}
                onChange={e=>updatePlayer(p.id, { status: e.target.value as any })}
              >
                <option value="FIT">FIT</option><option value="INJURED">INJURED</option><option value="SUSPENDED">SUSPENDED</option>
              </select>
              <div className="flex justify-end">
                <button className="text-sm px-2 py-1 rounded border" onClick={()=>removePlayer(p.id)}>Delete</button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-3 text-sm text-gray-600">No players match filters.</div>
          )}
        </div>
      </div>
    </div>
  );
}
