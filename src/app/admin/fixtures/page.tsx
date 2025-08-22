"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

// ✅ Added Match Link to the Enter Stats button

// ✅ Added missing types for safety

type Team = { id: number; name: string; shortName: string };
type Gameweek = { id: number; name: string; deadline: string };
type Fixture = {
  id: number;
  gameweekId: number;
  kickoff: string; // ISO
  status: "UPCOMING" | "LIVE" | "FINISHED" | "SCORED";
  homeTeam: Team;
  awayTeam: Team;
};

export default function FixturesAdmin() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [gws, setGws] = useState<Gameweek[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // new fixture form
  const [newGwId, setNewGwId] = useState<number | "">("");
  const [newHomeId, setNewHomeId] = useState<number | "">("");
  const [newAwayId, setNewAwayId] = useState<number | "">("");
  const [newKickoff, setNewKickoff] = useState("");

  // GW actions
  const [actionGwId, setActionGwId] = useState<number | "">("");
  const [busy, setBusy] = useState(false);

  const gwById = useMemo(() => new Map(gws.map((g) => [g.id, g])), [gws]);

  const safeJson = async (res: Response) => {
    const t = await res.text();
    try {
      return t ? JSON.parse(t) : {};
    } catch {
      return {};
    }
  };

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/admin/fixtures", { cache: "no-store" });
      const j = await safeJson(r);
      if (!r.ok) {
        setErr(j.error || "Failed to load");
        return;
      }
      setTeams(j.teams ?? []);
      setGws(j.gameweeks ?? []);
      setFixtures(j.fixtures ?? []);
    } catch {
      setErr("Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createFixture = async () => {
    setErr(null);
    if (!newGwId || !newHomeId || !newAwayId) {
      setErr("Please select GW, Home, and Away");
      return;
    }
    if (newHomeId === newAwayId) {
      setErr("Home/Away must be different teams");
      return;
    }
    try {
      const r = await fetch("/api/admin/fixtures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameweekId: Number(newGwId),
          homeTeamId: Number(newHomeId),
          awayTeamId: Number(newAwayId),
          kickoffISO: newKickoff || null,
        }),
      });
      const j = await safeJson(r);
      if (!r.ok) {
        setErr(j.error || "Create failed");
        return;
      }
      // reset form
      setNewGwId("");
      setNewHomeId("");
      setNewAwayId("");
      setNewKickoff("");
      await load();
    } catch {
      setErr("Create failed");
    }
  };

  const updateFixture = async (
    id: number,
    patch: Partial<{ gameweekId: number; kickoffISO: string }>
  ) => {
    setErr(null);
    try {
      const r = await fetch("/api/admin/fixtures", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      const j = await safeJson(r);
      if (!r.ok) {
        setErr(j.error || "Update failed");
        return;
      }
      await load();
    } catch {
      setErr("Update failed");
    }
  };

  const removeFixture = async (id: number) => {
    if (!confirm("Delete this fixture?")) return;
    setErr(null);
    try {
      const r = await fetch(`/api/admin/fixtures?id=${id}`, { method: "DELETE" });
      const j = await safeJson(r);
      if (!r.ok) {
        setErr(j.error || "Delete failed");
        return;
      }
      await load();
    } catch {
      setErr("Delete failed");
    }
  };

  // -------- GW action handlers (Auto-subs + Score) --------
  const gwNameFromId = (id?: number | "") =>
    gws.find((g) => g.id === id)?.name ?? undefined;

  const runAutoSubs = async () => {
    if (!actionGwId) {
      setErr("Select a Gameweek for actions");
      return;
    }
    setErr(null);
    setBusy(true);
    try {
      const gwName = gwNameFromId(actionGwId);
      const r = await fetch("/api/admin/apply-autosubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gwName }),
      });
      const j = await safeJson(r);
      if (!r.ok) {
        setErr(j.error || "Auto-subs failed");
        return;
      }
      alert(`Auto-subs applied for ${gwName ?? "selected GW"} — updated: ${j.updatedSquads ?? "?"}`);
    } catch {
      setErr("Auto-subs failed");
    } finally {
      setBusy(false);
    }
  };

  const runScore = async () => {
    if (!actionGwId) {
      setErr("Select a Gameweek for actions");
      return;
    }
    setErr(null);
    setBusy(true);
    try {
      const gwName = gwNameFromId(actionGwId);
      const r = await fetch("/api/admin/score-gw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gwName }),
      });
      const j = await safeJson(r);
      if (!r.ok) {
        setErr(j.error || "Scoring failed");
        return;
      }
      alert(
        `Scored ${gwName ?? "selected GW"}.\nSquads updated: ${j.updatedSquads ?? "?"}\nStandings rows: ${j.updatedStandings ?? "?"}`
      );
      await load();
    } catch {
      setErr("Scoring failed");
    } finally {
      setBusy(false);
    }
  };

  const Input = (p: any) => (
    <input className="border rounded px-2 py-1 text-sm" {...p} />
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Admin — Fixtures</h1>
        <div className="flex gap-3">
          <Link href="/admin/import" className="underline text-blue-600">
            Bulk Import
          </Link>
          <Link href="/admin/fixtures" className="underline text-blue-600">
            Refresh
          </Link>
        </div>
      </div>

      {err && <div className="text-red-600">{err}</div>}
      {loading && <div>Loading…</div>}

      {/* ---------- GW Actions (Auto-subs + Score) ---------- */}
      <div className="border rounded p-4 space-y-3">
        <h2 className="font-semibold">Gameweek Actions</h2>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="border rounded px-2 py-1"
            value={actionGwId}
            onChange={(e) =>
              setActionGwId(e.target.value ? Number(e.target.value) : "")
            }
          >
            <option value="">Select GW</option>
            {gws.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>

          <button
            onClick={runAutoSubs}
            disabled={!actionGwId || busy}
            className="px-3 py-1 rounded border disabled:opacity-40"
            title="Promote bench if starters didn't play and keep valid formation"
          >
            Apply Auto-Subs
          </button>

          <button
            onClick={runScore}
            disabled={!actionGwId || busy}
            className="px-3 py-1 rounded bg-black text-white disabled:opacity-40"
            title="Compute GW points and update league standings"
          >
            Score GW
          </button>
        </div>
      </div>

      {/* Create fixture */}
      <div className="border rounded p-4 space-y-3">
        <h2 className="font-semibold">Create Fixture</h2>
        <div className="grid md:grid-cols-4 gap-2">
          <select
            className="border rounded px-2 py-1"
            value={newGwId}
            onChange={(e) =>
              setNewGwId(e.target.value ? Number(e.target.value) : "")
            }
          >
            <option value="">Select GW</option>
            {gws.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <select
            className="border rounded px-2 py-1"
            value={newHomeId}
            onChange={(e) =>
              setNewHomeId(e.target.value ? Number(e.target.value) : "")
            }
          >
            <option value="">Home</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.shortName}
              </option>
            ))}
          </select>
          <select
            className="border rounded px-2 py-1"
            value={newAwayId}
            onChange={(e) =>
              setNewAwayId(e.target.value ? Number(e.target.value) : "")
            }
          >
            <option value="">Away</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.shortName}
              </option>
            ))}
          </select>
          <Input
            placeholder="Kickoff ISO (optional)"
            value={newKickoff}
            onChange={(e: any) => setNewKickoff(e.target.value)}
          />
        </div>
        <button
          onClick={createFixture}
          className="px-3 py-1 rounded bg-black text-white disabled:opacity-40"
        >
          Add Fixture
        </button>
      </div>

      {/* List fixtures with inline edits */}
      <div className="border rounded">
        <div className="px-3 py-2 border-b font-semibold">All Fixtures</div>
        <div className="divide-y">
          {fixtures.map((f) => {
            const kickoffLocal = new Date(f.kickoff)
              .toISOString()
              .slice(0, 16); // yyyy-MM-ddTHH:mm
            return (
              <div key={f.id} className="p-3 flex flex-wrap items-center gap-3">
                <div className="w-20 text-xs text-gray-600">#{f.id}</div>
                <div className="min-w-[180px]">
                  {f.homeTeam.shortName} vs {f.awayTeam.shortName}
                </div>
                <div>
                  <select
                    className="border rounded px-2 py-1 text-sm"
                    value={f.gameweekId}
                    onChange={(e) =>
                      updateFixture(f.id, {
                        gameweekId: Number(e.target.value),
                      })
                    }
                  >
                    {gws.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="datetime-local"
                    className="border rounded px-2 py-1 text-sm"
                    value={kickoffLocal}
                    onChange={(e) => {
                      // store as ISO UTC string
                      const iso = new Date(e.target.value).toISOString();
                      updateFixture(f.id, { kickoffISO: iso });
                    }}
                  />
                </div>
                <div className="ml-auto flex gap-2">
                  <Link
                    href={`/admin/match/${f.id}`}
                    className="text-sm px-2 py-1 rounded border"
                  >
                    Enter Stats
                  </Link>
                  <button
                    className="text-sm px-2 py-1 rounded border"
                    onClick={() => removeFixture(f.id)}
                  >
                    Delete
                  </button>
                </div>
                <div className="text-xs text-gray-500">
                  GW: {gwById.get(f.gameweekId)?.name}
                </div>
              </div>
            );
          })}
          {fixtures.length === 0 && (
            <div className="p-3 text-sm text-gray-600">
              No fixtures yet. Create some above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
