// src/app/my-team/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Player = {
  id: number;
  name: string;
  position: "GK" | "DEF" | "MID" | "FWD";
  price: any; // Prisma Decimal; cast to Number where needed
  status: "FIT" | "INJURED" | "SUSPENDED";
  team: { name: string; shortName: string };
};

const POS_LIMITS = { GK: 2, DEF: 5, MID: 5, FWD: 3 } as const;
const MAX_PER_TEAM = 3;
const BUDGET = 100.0;

/* ---------- helpers ---------- */
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
/* ----------------------------- */

export default function MyTeamPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [picked, setPicked] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);

    const r = await fetch("/api/my-team", { cache: "no-store" });

    // If not logged in, bounce to login and return early.
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

    // 🚪 If user already has a full squad, go straight to Transfers
    const pickCount = Array.isArray(j.squad?.picks) ? j.squad.picks.length : 0;
    if (pickCount === 15) {
      router.replace("/transfers");
      return;
    }

    setPlayers(j.players);

    // Normalize to a clean number[] of player IDs
    const ids =
      Array.isArray(j.squad?.picks)
        ? j.squad.picks
            .map((p: any) => (typeof p === "number" ? p : Number(p?.playerId)))
            .filter((n: any) => Number.isFinite(n))
        : [];

    setPicked(ids);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (id: number) => {
    setError(null);
    setPicked((curr) => {
      // remove
      if (curr.includes(id)) return curr.filter((x) => x !== id);

      // add
      const next = [...curr, id];

      // total cap
      if (next.length > 15) {
        setError("You can only pick 15 players.");
        return curr;
      }

      // position caps
      const posCounts = countByPos(players, next);
      for (const pos of Object.keys(POS_LIMITS) as (keyof typeof POS_LIMITS)[]) {
        if (posCounts[pos] > POS_LIMITS[pos]) {
          setError(`Too many ${pos}: ${posCounts[pos]}/${POS_LIMITS[pos]}`);
          return curr;
        }
      }

      // team cap
      const teamCounts = countByTeam(players, next);
      for (const [tn, c] of teamCounts) {
        if (c > MAX_PER_TEAM) {
          setError(`Max ${MAX_PER_TEAM} from one team (${tn}).`);
          return curr;
        }
      }

      // ✅ allow going over budget — just warn
      const spentNow = sumPrice(players, next);
      if (spentNow > BUDGET + 1e-9) {
        setError(
          `Budget exceeded: ${spentNow.toFixed(1)} / ${BUDGET.toFixed(
            1
          )} (you can keep picking but must get under to save)`
        );
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
  const budgetLeftNum = BUDGET - spent;
  const budgetLeft = budgetLeftNum.toFixed(1);
  const byPos = (pos: Player["position"]) => players.filter((p) => p.position === pos);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">Pick Your Initial Squad</h1>
      <p className="text-sm text-gray-600">Choose 15 players. You won’t return to this page after saving.</p>
      {error && <div className="text-red-600">{error}</div>}

      <div className="flex items-center gap-3">
        <span className="font-medium">Selected:</span>
        <span>{picked.length} / 15</span>

        <span
          className={`ml-4 ${budgetLeftNum < 0 ? "text-red-600 font-semibold" : "text-gray-700"}`}
          title={budgetLeftNum < 0 ? "You are over budget" : "Budget remaining"}
        >
          Budget left: {budgetLeft} / {BUDGET.toFixed(1)}
        </span>

        <button
          className="px-3 py-1 rounded bg-black text-white disabled:opacity-40"
          disabled={picked.length !== 15 || budgetLeftNum < 0}
          onClick={save}
        >
          Save squad
        </button>
      </div>

      {(["GK", "DEF", "MID", "FWD"] as const).map((pos) => (
        <div key={pos}>
          <h2 className="font-semibold mt-4 mb-2">{pos}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {byPos(pos).map((p) => {
              const sel = picked.includes(p.id);
              return (
                <div key={p.id} className="border rounded p-2 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-gray-600">
                      {p.team.shortName} • {p.position} • {String(p.price)}
                    </div>
                  </div>
                  <button
                    onClick={() => toggle(p.id)}
                    className={`px-2 py-1 rounded border ${sel ? "bg-green-600 text-white" : ""}`}
                  >
                    {sel ? "Remove" : "Add"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
