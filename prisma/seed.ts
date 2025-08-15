// prisma/seed.ts
import { PrismaClient, Position } from "@prisma/client";
const prisma = new PrismaClient();

type TeamSeed = {
  name: string;
  shortName: string;
  logoUrl?: string | null;
};

const TEAMS: TeamSeed[] = [
  { name: "Ajman",             shortName: "AJM" },
  { name: "Al Ain",            shortName: "AIN" },
  { name: "Al Bataeh",         shortName: "BAT" },
  { name: "Al Dhafra",         shortName: "DHF" },
  { name: "Al Jazira",         shortName: "JAZ" },
  { name: "Al Nasr",           shortName: "NAS" },
  { name: "Al Wahda",          shortName: "WAH" },
  { name: "Al Wasl",           shortName: "WAS" },
  { name: "Baniyas",           shortName: "BAN" },
  { name: "Dibba",             shortName: "DIB" },
  { name: "Al-Ittihad Kalba",  shortName: "KAL" },
  { name: "Khor Fakkan",       shortName: "KHO" },
  { name: "Shabab Al-Ahli",    shortName: "AHL" },
  { name: "Sharjah",           shortName: "SHJ" },
];

// price ladders by position (tweak anytime)
const PRICE_GK = [4.0, 4.5];                              // 2 GK
const PRICE_DEF = [4.0, 4.5, 5.0, 5.0, 5.5];              // 5 DEF
const PRICE_MID = [5.5, 6.0, 6.5, 7.0, 7.5];              // 5 MID
const PRICE_FWD = [6.0, 7.0, 7.5];                        // 3 FWD

async function upsertTeams() {
  const out: { id: number; name: string; shortName: string }[] = [];
  for (const t of TEAMS) {
    const team = await prisma.team.upsert({
      where: { name: t.name },
      update: { shortName: t.shortName, logoUrl: t.logoUrl ?? null },
      create: { name: t.name, shortName: t.shortName, logoUrl: t.logoUrl ?? null },
    });
    out.push({ id: team.id, name: team.name, shortName: team.shortName });
  }
  return out;
}

function makePlayersForTeam(team: { id: number; shortName: string }) {
  // helper to build rows with consistent naming
  const rows: {
    teamId: number;
    name: string;
    position: Position;
    price: number;
  }[] = [];

  // GK (2)
  PRICE_GK.forEach((p, i) =>
    rows.push({
      teamId: team.id,
      name: `${team.shortName} GK${i + 1}`,
      position: "GK",
      price: p,
    })
  );

  // DEF (5)
  PRICE_DEF.forEach((p, i) =>
    rows.push({
      teamId: team.id,
      name: `${team.shortName} DEF${i + 1}`,
      position: "DEF",
      price: p,
    })
  );

  // MID (5)
  PRICE_MID.forEach((p, i) =>
    rows.push({
      teamId: team.id,
      name: `${team.shortName} MID${i + 1}`,
      position: "MID",
      price: p,
    })
  );

  // FWD (3)
  PRICE_FWD.forEach((p, i) =>
    rows.push({
      teamId: team.id,
      name: `${team.shortName} FWD${i + 1}`,
      position: "FWD",
      price: p,
    })
  );

  return rows;
}

async function ensureGW1() {
  await prisma.gameweek.upsert({
    where: { id: 1 }, // simplest: anchor on id=1 for the first seed
    update: {},
    create: {
      name: "GW1",
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
}

async function main() {
  console.log("➡️ Upserting teams…");
  const teams = await upsertTeams();
  console.log(`✅ ${teams.length} teams ready`);

  console.log("➡️ Ensuring GW1 exists…");
  await ensureGW1();
  console.log("✅ GW1 ok");

  for (const t of teams) {
    const count = await prisma.player.count({ where: { teamId: t.id } });
    if (count > 0) {
      console.log(`↩️  ${t.shortName} already has ${count} players, skipping`);
      continue;
    }
    const rows = makePlayersForTeam(t);
    await prisma.player.createMany({ data: rows });
    console.log(`✅ Seeded ${rows.length} players for ${t.shortName}`);
  }

  console.log("🎉 Seeding complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
