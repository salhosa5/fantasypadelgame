// src/app/admin/gws/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type GW = { id: number; name: string; deadline: string };

export default function AdminGameweeks() {
  const [items, setItems] = useState<GW[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // create form
  const [name, setName] = useState("");
  const [deadline, setDeadline] = useState(""); // datetime-local

  const safeJson = async (r: Response) => {
    const t = await r.text();
    try { return t ? JSON.parse(t) : {}; } catch { return {}; }
  };

  const load = async () => {
    setLoading(true); setErr(null);
    try {
      const r = await fetch("/api/admin/gws", { cache: "no-store" });
      const j = await safeJson(r);
      if (!r.ok) { setErr(j.error || "Failed to load"); return; }
      setItems(j.gameweeks ?? []);
    } catch {
      setErr("Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!name.trim() || !deadline) { setErr("Enter name and deadline"); return; }
    setErr(null);
    try {
      const r = await fetch("/api/admin/gws", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ name, deadlineISO: new Date(deadline).toISOString() }),
      });
      const j = await safeJson(r);
      if (!r.ok) { setErr(j.error || "Create failed"); return; }
      setName(""); setDeadline("");
      await load();
    } catch {
      setErr("Create failed");
    }
  };

  const update = async (id: number, patch: Partial<{ name: string; deadlineISO: string }>) => {
    setErr(null);
    try {
      const r = await fetch("/api/admin/gws", {
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

  const removeOne = async (id: number) => {
    if (!confirm("Delete this gameweek? (Fixtures tied to it will need reassigning)")) return;
    setErr(null);
    try {
      const r = await fetch(`/api/admin/gws?id=${id}`, { method: "DELETE" });
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
        <h1 className="text-xl font-bold">Admin — Gameweeks</h1>
        <div className="flex gap-3">
          <Link href="/admin/fixtures" className="underline text-blue-600">Fixtures</Link>
          <Link href="/admin/players" className="underline text-blue-600">Players</Link>
        </div>
      </div>

      {err && <div className="text-red-600">{err}</div>}
      {loading && <div>Loading…</div>}

      {/* Create */}
      <div className="border rounded p-4 space-y-2">
        <h2 className="font-semibold">Create Gameweek</h2>
        <div className="grid md:grid-cols-3 gap-2">
          <input
            className="border rounded px-2 py-1"
            placeholder="Name (e.g., GW2)"
            value={name}
            onChange={e=>setName(e.target.value)}
          />
        <input
            type="datetime-local"
            className="border rounded px-2 py-1"
            value={deadline}
            onChange={e=>setDeadline(e.target.value)}
          />
          <button onClick={create} className="px-3 py-1 rounded bg-black text-white">Add</button>
        </div>
      </div>

      {/* List */}
      <div className="border rounded">
        <div className="px-3 py-2 border-b font-semibold">All Gameweeks</div>
        <div className="divide-y">
          {items.map(gw => {
            const local = new Date(gw.deadline).toISOString().slice(0,16);
            return (
              <div key={gw.id} className="p-3 grid md:grid-cols-4 items-center gap-2">
                <input
                  className="border rounded px-2 py-1"
                  value={gw.name}
                  onChange={e=>update(gw.id, { name: e.target.value })}
                />
                <input
                  type="datetime-local"
                  className="border rounded px-2 py-1"
                  value={local}
                  onChange={e=>update(gw.id, { deadlineISO: new Date(e.target.value).toISOString() })}
                />
                <div className="text-sm text-gray-600">#{gw.id}</div>
                <div className="flex justify-end">
                  <button className="text-sm px-2 py-1 rounded border" onClick={()=>removeOne(gw.id)}>Delete</button>
                </div>
              </div>
            );
          })}
          {items.length === 0 && <div className="p-3 text-sm text-gray-600">No gameweeks yet.</div>}
        </div>
      </div>
    </div>
  );
}
