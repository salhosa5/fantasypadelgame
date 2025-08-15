"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Team = { id: number; name: string };
type Props = {
  teams: Team[];
  defaults?: {
    id?: number;
    name: string;
    teamId: number;
    position: "GK" | "DEF" | "MID" | "FWD";
    price: number;
    status: "FIT" | "INJURED" | "SUSPENDED";
  };
};

export default function PlayerForm({ teams, defaults }: Props) {
  const router = useRouter();
  const [name, setName] = useState(defaults?.name ?? "");
  const [teamId, setTeamId] = useState<number>(defaults?.teamId ?? teams[0]?.id);
  const [position, setPosition] = useState<Props["defaults"]["position"]>(defaults?.position ?? "MID");
  const [price, setPrice] = useState<number>(defaults?.price ?? 5.0);
  const [status, setStatus] = useState<Props["defaults"]["status"]>(defaults?.status ?? "FIT");
  const [saving, setSaving] = useState(false);
  const editing = Boolean(defaults?.id);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const body = { name, teamId, position, price, status };
    const url = editing ? `/api/admin/players/${defaults!.id}` : `/api/admin/players`;
    const method = editing ? "PATCH" : "POST";

  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  setSaving(false);
  if (!res.ok) {
    const j = await res.json().catch(async () => ({ error: await res.text() }));
    alert(j.error || "Failed to save");
    return;
  }


    router.push("/admin/players");
  }

  async function onDelete() {
    if (!editing) return;
    if (!confirm("Delete this player?")) return;
    const res = await fetch(`/api/admin/players/${defaults!.id}`, { method: "DELETE" });
    if (!res.ok) {
      const j = await res.json().catch(async () => ({ error: await res.text() }));
      alert(j.error || "Failed to delete");
      return;
  }

    router.push("/admin/players");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-lg">
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Team</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={teamId}
            onChange={e => setTeamId(Number(e.target.value))}
          >
            {teams.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Position</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={position}
            onChange={e => setPosition(e.target.value as any)}
          >
            <option>GK</option>
            <option>DEF</option>
            <option>MID</option>
            <option>FWD</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Price (millions)</label>
          <input
            type="number"
            step="0.1"
            min="3.5"
            className="w-full border rounded px-3 py-2"
            value={price}
            onChange={e => setPrice(Number(e.target.value))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={status}
            onChange={e => setStatus(e.target.value as any)}
          >
            <option>FIT</option>
            <option>INJURED</option>
            <option>SUSPENDED</option>
          </select>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        >
          {editing ? "Save changes" : "Create player"}
        </button>

        {editing && (
          <button type="button" onClick={onDelete} className="px-4 py-2 rounded border">
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
