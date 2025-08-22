'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { pointsFromStat } from '@/lib/scoring';

type Row = {
  id: number; name: string; position: 'GK'|'DEF'|'MID'|'FWD';
  minutes:number; goals:number; assists:number; cleanSheet:boolean; goalsConceded:number;
  penSaved:number; penMissed:number; yellowCards:number; redCards:number; ownGoals:number; motm:boolean;
};

const COLS =
  'grid grid-cols-[minmax(180px,1.6fr)_repeat(11,minmax(40px,0.7fr))_minmax(50px,0.6fr)_minmax(60px,0.7fr)] items-center gap-2';

export default function MatchEntry() {
  const { id } = useParams<{ id: string }>();
  const fixtureId = Number(id);
  const router = useRouter();

  const [home, setHome] = useState<Row[]>([]);
  const [away, setAway] = useState<Row[]>([]);
  const [fixture, setFixture] = useState<{ id:number; home:string; away:string } | null>(null);

  // Reusable fetch (no cache) + cache-buster
  const fetchFixture = async () => {
    const url = `/api/admin/match?fixtureId=${fixtureId}&t=${Date.now()}`;
    const d = await fetch(url, { cache: 'no-store' }).then(r => r.json());
    setFixture(d.fixture);
    setHome(d.home);
    setAway(d.away);
  };

  useEffect(() => {
    fetchFixture();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixtureId]);

  const update = (side:'home'|'away', idx:number, field:keyof Row, value:any) => {
    const arr = side === 'home' ? [...home] : [...away];
    if (['minutes','goals','assists','goalsConceded','penSaved','penMissed','yellowCards','redCards','ownGoals'].includes(field as string)) {
      value = Number(value || 0);
    }
    if (field === 'cleanSheet' || field === 'motm') value = Boolean(value);
    (arr[idx] as any)[field] = value;
    side === 'home' ? setHome(arr) : setAway(arr);
  };

  const chooseMOTM = (playerId:number) => {
    setHome(h => h.map(r => ({ ...r, motm: r.id === playerId })));
    setAway(a => a.map(r => ({ ...r, motm: r.id === playerId })));
  };

  const save = async (goBack = false) => {
    try {
      const res = await fetch("/api/admin/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fixtureId, homePlayers: home, awayPlayers: away }),
      });

      // tolerate empty body or a non-JSON error page
      const text = await res.text();
      const j = text ? JSON.parse(text) : {};

      if (!res.ok) {
        alert(j.error || "Error");
        return;
      }

      if (goBack) {
        router.push("/admin/fixtures");
      } else {
        await fetchFixture();
        alert("Saved!");
      }
    } catch (e) {
      console.error(e);
      alert("Network/parse error while saving");
    }
  };

  // ---- NEW: Run Auto-Subs (GW1) button handler ----
  const runAutoSubs = async () => {
    try {
      const r = await fetch('/api/admin/apply-autosubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gwName: 'GW1' }), // change if your GW name differs
      });
      const text = await r.text();
      const j = text ? JSON.parse(text) : {};
      if (!r.ok) {
        alert(j.error || 'Auto-subs failed');
        return;
      }
      alert(`Auto-subs done for ${j.gameweek}. Updated squads: ${j.updatedSquads}`);
    } catch (e) {
      console.error(e);
      alert('Network/parse error while running auto-subs');
    }
  };

  const Header = () => (
    <div className={`${COLS} text-[11px] uppercase tracking-wide text-neutral-500 sticky top-0 bg-white/95 backdrop-blur py-1 border-b`}>
      <div>Player</div>
      <div className="text-center">Min</div>
      <div className="text-center">G</div>
      <div className="text-center">A</div>
      <div className="text-center">CS</div>
      <div className="text-center">GC</div>
      <div className="text-center">PS</div>
      <div className="text-center">PM</div>
      <div className="text-center">YC</div>
      <div className="text-center">RC</div>
      <div className="text-center">OG</div>
      <div className="text-center">MOTM</div>
      <div className="text-center">PTS</div>
    </div>
  );

  const Num = (props:any) => (
    <input type="number" className="w-full border rounded px-1 py-0.5 text-sm" {...props} />
  );

  const RowEdit = ({ row, idx, side }: { row: Row; idx: number; side: 'home'|'away' }) => (
    <div className={`${COLS} border-b py-1 text-sm`}>
      <div className="font-medium">{row.name}</div>
      <Num value={row.minutes} onChange={(e:any)=>update(side,idx,'minutes',e.target.value)} />
      <Num value={row.goals} onChange={(e:any)=>update(side,idx,'goals',e.target.value)} />
      <Num value={row.assists} onChange={(e:any)=>update(side,idx,'assists',e.target.value)} />
      <input type="checkbox" className="mx-auto" checked={row.cleanSheet} onChange={e=>update(side,idx,'cleanSheet',e.target.checked)} />
      <Num value={row.goalsConceded} onChange={(e:any)=>update(side,idx,'goalsConceded',e.target.value)} />
      <Num value={row.penSaved} onChange={(e:any)=>update(side,idx,'penSaved',e.target.value)} />
      <Num value={row.penMissed} onChange={(e:any)=>update(side,idx,'penMissed',e.target.value)} />
      <Num value={row.yellowCards} onChange={(e:any)=>update(side,idx,'yellowCards',e.target.value)} />
      <Num value={row.redCards} onChange={(e:any)=>update(side,idx,'redCards',e.target.value)} />
      <Num value={row.ownGoals} onChange={(e:any)=>update(side,idx,'ownGoals',e.target.value)} />
      <input type="radio" name="motm" className="mx-auto" checked={row.motm} onChange={()=>chooseMOTM(row.id)} />
      <div className="text-center font-semibold">
        {pointsFromStat(
          {
            minutes: row.minutes,
            goals: row.goals,
            assists: row.assists,
            cleanSheet: row.cleanSheet,
            goalsConceded: row.goalsConceded,
            penSaved: row.penSaved,
            penMissed: row.penMissed,
            yellowCards: row.yellowCards,
            redCards: row.redCards,
            ownGoals: row.ownGoals,
            motm: row.motm,
          } as any,
          { position: row.position } as any
        )}
      </div>
    </div>
  );

  if (!fixture) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold flex items-center gap-3">
        <Link href="/admin/fixtures" className="text-blue-600 underline">← Fixtures</Link>
        <span>Match Entry — {fixture.home} vs {fixture.away}</span>
      </h1>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h2 className="font-semibold mb-2">Home</h2>
          <Header />
          {home.map((r, i) => <RowEdit key={r.id} row={r} idx={i} side="home" />)}
        </div>
        <div>
          <h2 className="font-semibold mb-2">Away</h2>
          <Header />
          {away.map((r, i) => <RowEdit key={r.id} row={r} idx={i} side="away" />)}
        </div>
      </div>

      <div className="flex gap-3">
        <Link href="/admin/fixtures" className="px-4 py-2 rounded border">← Back to Fixtures</Link>
        <button onClick={()=>save(false)} className="px-4 py-2 rounded bg-black text-white">Save</button>
        <button onClick={()=>save(true)} className="px-4 py-2 rounded bg-blue-600 text-white">Save & Back</button>

        {/* NEW: Run Auto-Subs */}
        <button
          onClick={runAutoSubs}
          className="px-4 py-2 rounded border"
          title="Apply auto-subs for GW1 across all squads"
        >
          Run Auto-Subs (GW1)
        </button>
      </div>
    </div>
  );
}
