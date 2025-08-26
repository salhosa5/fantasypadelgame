// Quick script to add sample fixtures
// Run with: node add-fixtures.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addFixtures() {
  try {
    // Get all teams
    const teams = await prisma.team.findMany();
    console.log(`Found ${teams.length} teams`);
    
    if (teams.length < 4) {
      console.log("Not enough teams, creating sample teams...");
      await prisma.team.createMany({
        data: [
          { name: "Al Ain FC", shortName: "AIN" },
          { name: "Al Hilal", shortName: "HIL" },
          { name: "Al Nassr", shortName: "NAS" },
          { name: "Al Wahda", shortName: "WAH" },
          { name: "Shabab Al Ahli", shortName: "SHA" },
          { name: "Al Jazira", shortName: "JAZ" },
          { name: "Al Wasl", shortName: "WAS" },
          { name: "Ajman Club", shortName: "AJM" },
        ],
        skipDuplicates: true
      });
    }
    
    // Get updated teams list
    const updatedTeams = await prisma.team.findMany();
    console.log(`Using ${updatedTeams.length} teams`);

    // Get or create gameweeks
    const gameweeks = [];
    for (let i = 1; i <= 3; i++) {
      const gw = await prisma.gameweek.upsert({
        where: { name: `GW${i}` },
        update: {},
        create: {
          name: `GW${i}`,
          deadline: new Date(Date.now() + i * 7 * 24 * 60 * 60 * 1000) // i weeks from now
        }
      });
      gameweeks.push(gw);
    }

    // Generate fixtures for each gameweek
    for (let gwIndex = 0; gwIndex < 3; gwIndex++) {
      const gw = gameweeks[gwIndex];
      console.log(`Generating fixtures for ${gw.name}...`);
      
      // Simple round-robin style fixtures
      const fixtures = [];
      for (let i = 0; i < Math.min(4, Math.floor(updatedTeams.length / 2)); i++) {
        const homeTeam = updatedTeams[(i * 2 + gwIndex) % updatedTeams.length];
        const awayTeam = updatedTeams[(i * 2 + 1 + gwIndex) % updatedTeams.length];
        
        if (homeTeam.id !== awayTeam.id) {
          fixtures.push({
            gameweekId: gw.id,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            kickoff: new Date(gw.deadline.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days before deadline
            status: 'UPCOMING'
          });
        }
      }
      
      // Delete existing fixtures for this GW and create new ones
      await prisma.fixture.deleteMany({
        where: { gameweekId: gw.id }
      });
      
      await prisma.fixture.createMany({
        data: fixtures
      });
      
      console.log(`Created ${fixtures.length} fixtures for ${gw.name}`);
    }

    console.log("Fixtures created successfully!");
    
  } catch (error) {
    console.error("Error creating fixtures:", error);
  } finally {
    await prisma.$disconnect();
  }
}

addFixtures();