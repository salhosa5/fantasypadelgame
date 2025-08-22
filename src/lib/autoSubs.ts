// src/lib/autoSubs.ts
type Pos = "GK" | "DEF" | "MID" | "FWD";

export type AutoSubsInput = {
  starters: number[];  // 11 playerIds, any order
  bench: number[];     // 4 playerIds, order = B1..B4
  positions: Map<number, Pos>;       // playerId -> position
  minutesPlayed: Map<number, number>;// playerId -> minutes for this GW
  captainId: number | null;
  viceId: number | null;
};

export type AutoSubsResult = {
  starters: number[];
  bench: number[];
  captainId: number | null;
  viceId: number | null;
};

/** Formation is valid if starters have ≥1 GK, ≥3 DEF, ≥3 MID, ≥2 FWD. */
function validStarters(ids: number[], positions: Map<number, Pos>) {
  let gk = 0, def = 0, mid = 0, fwd = 0;
  for (const id of ids) {
    const p = positions.get(id);
    if (p === "GK") gk++;
    else if (p === "DEF") def++;
    else if (p === "MID") mid++;
    else if (p === "FWD") fwd++;
  }
  return gk >= 1 && def >= 3 && mid >= 3 && fwd >= 2;
}

/** Bench must be exactly 4 with exactly 1 GK. */
function validBench(ids: number[], positions: Map<number, Pos>) {
  if (ids.length !== 4) return false;
  return ids.filter(id => positions.get(id) === "GK").length === 1;
}

/**
 * Apply auto-subs:
 * - Iterate starters who have 0 minutes (in any order, but we’ll left-to-right).
 * - For each, try B1->B4 first eligible swap that preserves formation and bench rule.
 * - Captain/vice: If captain 0 mins, captain -> vice (if vice > 0). If both 0, captain null.
 */
export function applyAutoSubs(input: AutoSubsInput): AutoSubsResult {
  let { starters, bench, positions, minutesPlayed, captainId, viceId } = input;

  const plays = (id: number) => (minutesPlayed.get(id) ?? 0) > 0;

  // Handle captain/vice first logically, but final armbands depend on final starters.
  // We'll recompute at the end after swaps.

  // Process each starter with 0 minutes in the current starters array order.
  for (let i = 0; i < starters.length; i++) {
    const sid = starters[i];
    if (plays(sid)) continue;

    // Find first eligible bench replacement B1->B4
    let replaced = false;
    for (let b = 0; b < bench.length; b++) {
      const bid = bench[b];
      if (!plays(bid)) continue;

      const nextStarters = [...starters];
      const nextBench = [...bench];

      // swap sid <-> bid
      nextStarters[i] = bid;
      nextBench[b] = sid;

      if (validStarters(nextStarters, positions) && validBench(nextBench, positions)) {
        starters = nextStarters;
        bench = nextBench;
        replaced = true;
        break;
      }
    }
    // If no eligible bench replacement, the 0-min starter stays (no change).
    // Continue to next zero-min starter.
  }

  // Captain / Vice resolution
  // If captain didn't play or isn't a starter anymore, promote vice if possible.
  const startersSet = new Set(starters);
  const capPlays = captainId != null && startersSet.has(captainId) && plays(captainId);
  const vicePlays = viceId != null && startersSet.has(viceId) && plays(viceId);

  if (!capPlays) {
    if (vicePlays) {
      // promote vice to captain
      captainId = viceId!;
      // pick a new vice among starters who played and are not captain
      const newVice = starters.find(id => id !== captainId && plays(id)) ?? null;
      viceId = newVice;
    } else {
      // neither played -> no captain, pick any starter who played as captain if exists
      const anyPlayed = starters.find(id => plays(id)) ?? null;
      captainId = anyPlayed;
      // pick another played as vice if possible
      const second = starters.find(id => id !== captainId && plays(id)) ?? null;
      viceId = second;
    }
  } else {
    // captain played; ensure vice is valid & distinct
    if (!vicePlays || viceId === captainId) {
      const newVice = starters.find(id => id !== captainId && plays(id)) ?? null;
      viceId = newVice;
    }
  }

  // Final sanity (should already be true)
  if (!validStarters(starters, positions)) {
    // fallback: do nothing (should not happen with logic above)
  }
  if (!validBench(bench, positions)) {
    // fallback: do nothing
  }

  return { starters, bench, captainId, viceId };
}
