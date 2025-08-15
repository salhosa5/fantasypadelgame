// src/lib/scoring.ts
import { Position, ChipType, PlayerStat, Player } from '@prisma/client';

export function pointsFromStat(stat: PlayerStat, player: Player) {
  let pts = 0;

  // Appearance
  if (stat.minutes >= 60) pts += 2;
  else if (stat.minutes > 0) pts += 1;

  // Goals (by position)
  const goalPts = { GK: 6, DEF: 6, MID: 5, FWD: 4 } as const;
  pts += stat.goals * goalPts[player.position];

  // Assists
  pts += stat.assists * 3;

  // Clean sheets
  if (stat.cleanSheet) {
    if (player.position === 'GK' || player.position === 'DEF') pts += 4;
    else if (player.position === 'MID') pts += 1;
  }

  // Conceded (GK/DEF): -1 per 2
  if (player.position === 'GK' || player.position === 'DEF') {
    pts += -Math.floor((stat.goalsConceded ?? 0) / 2);
  }

  // Penalties
  pts += stat.penSaved * 5;
  pts += stat.penMissed * -2;

  // Cards
  pts += stat.yellowCards * -1;
  pts += stat.redCards * -3;

  // Own goals
  pts += stat.ownGoals * -2;

  // MOTM
  if (stat.motm) pts += 2;

  return pts;
}

/** Captain multipliers helper */
export function applyCaptainMultipliers({
  base,
  captainPoints,
  vicePoints,
  chip,
  twoCaptainsActive,
}: {
  base: number;
  captainPoints: number;
  vicePoints: number;
  chip: ChipType;
  twoCaptainsActive: boolean;
}) {
  // Captain is always x2 (so we add +captainPoints again)
  let total = base + captainPoints;

  if (chip === 'TRIPLE_CAPTAIN') {
    // Tripled: add one more captainPoints (x3 total)
    total += captainPoints;
  } else if (twoCaptainsActive) {
    // Two Captains: add x2 for VC (we add the VC points once more)
    total += vicePoints;
  }
  return total;
}
