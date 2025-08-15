-- CreateEnum
CREATE TYPE "public"."Position" AS ENUM ('GK', 'DEF', 'MID', 'FWD');

-- CreateEnum
CREATE TYPE "public"."PlayerStatus" AS ENUM ('FIT', 'INJURED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."FixtureStatus" AS ENUM ('UPCOMING', 'LIVE', 'FINISHED', 'SCORED');

-- CreateEnum
CREATE TYPE "public"."ChipType" AS ENUM ('NONE', 'WILDCARD', 'BENCH_BOOST', 'TRIPLE_CAPTAIN', 'TWO_CAPTAINS');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "favoriteClub" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Team" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" VARCHAR(8) NOT NULL,
    "logoUrl" TEXT,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Player" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "position" "public"."Position" NOT NULL,
    "price" DECIMAL(6,1) NOT NULL,
    "status" "public"."PlayerStatus" NOT NULL DEFAULT 'FIT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Gameweek" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gameweek_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Fixture" (
    "id" SERIAL NOT NULL,
    "gameweekId" INTEGER NOT NULL,
    "homeTeamId" INTEGER NOT NULL,
    "awayTeamId" INTEGER NOT NULL,
    "kickoff" TIMESTAMP(3) NOT NULL,
    "status" "public"."FixtureStatus" NOT NULL DEFAULT 'UPCOMING',
    "homeGoals" INTEGER,
    "awayGoals" INTEGER,
    "scored" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Fixture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PlayerStat" (
    "id" SERIAL NOT NULL,
    "fixtureId" INTEGER NOT NULL,
    "playerId" INTEGER NOT NULL,
    "minutes" INTEGER NOT NULL DEFAULT 0,
    "goals" INTEGER NOT NULL DEFAULT 0,
    "assists" INTEGER NOT NULL DEFAULT 0,
    "cleanSheet" BOOLEAN NOT NULL DEFAULT false,
    "goalsConceded" INTEGER NOT NULL DEFAULT 0,
    "penSaved" INTEGER NOT NULL DEFAULT 0,
    "penMissed" INTEGER NOT NULL DEFAULT 0,
    "yellowCards" INTEGER NOT NULL DEFAULT 0,
    "redCards" INTEGER NOT NULL DEFAULT 0,
    "ownGoals" INTEGER NOT NULL DEFAULT 0,
    "motm" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PlayerStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserSquad" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "gameweekId" INTEGER NOT NULL,
    "budget" DECIMAL(65,30) NOT NULL DEFAULT 100.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSquad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserPick" (
    "id" SERIAL NOT NULL,
    "squadId" INTEGER NOT NULL,
    "playerId" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "isCaptain" BOOLEAN NOT NULL DEFAULT false,
    "isVice" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserPick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Transfer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gameweekId" INTEGER NOT NULL,
    "outPlayerId" INTEGER NOT NULL,
    "inPlayerId" INTEGER NOT NULL,
    "priceDiff" DECIMAL(6,1),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserPoints" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gameweekId" INTEGER NOT NULL,
    "gwPoints" INTEGER NOT NULL DEFAULT 0,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."League" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,

    CONSTRAINT "League_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LeagueMember" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeagueMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LeagueStanding" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "gameweekId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "gwPoints" INTEGER NOT NULL,
    "totalPoints" INTEGER NOT NULL,

    CONSTRAINT "LeagueStanding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Team_name_key" ON "public"."Team"("name");

-- CreateIndex
CREATE INDEX "PlayerStat_fixtureId_idx" ON "public"."PlayerStat"("fixtureId");

-- CreateIndex
CREATE INDEX "PlayerStat_playerId_idx" ON "public"."PlayerStat"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerStat_fixtureId_playerId_key" ON "public"."PlayerStat"("fixtureId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSquad_userId_gameweekId_key" ON "public"."UserSquad"("userId", "gameweekId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPick_squadId_playerId_key" ON "public"."UserPick"("squadId", "playerId");

-- CreateIndex
CREATE INDEX "Transfer_userId_gameweekId_idx" ON "public"."Transfer"("userId", "gameweekId");

-- CreateIndex
CREATE INDEX "UserPoints_gameweekId_idx" ON "public"."UserPoints"("gameweekId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPoints_userId_gameweekId_key" ON "public"."UserPoints"("userId", "gameweekId");

-- CreateIndex
CREATE UNIQUE INDEX "League_code_key" ON "public"."League"("code");

-- CreateIndex
CREATE INDEX "LeagueMember_userId_idx" ON "public"."LeagueMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LeagueMember_leagueId_userId_key" ON "public"."LeagueMember"("leagueId", "userId");

-- CreateIndex
CREATE INDEX "LeagueStanding_leagueId_gameweekId_idx" ON "public"."LeagueStanding"("leagueId", "gameweekId");

-- CreateIndex
CREATE UNIQUE INDEX "LeagueStanding_leagueId_gameweekId_userId_key" ON "public"."LeagueStanding"("leagueId", "gameweekId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "public"."VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "public"."VerificationToken"("identifier", "token");

-- AddForeignKey
ALTER TABLE "public"."Player" ADD CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Fixture" ADD CONSTRAINT "Fixture_gameweekId_fkey" FOREIGN KEY ("gameweekId") REFERENCES "public"."Gameweek"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Fixture" ADD CONSTRAINT "Fixture_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "public"."Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Fixture" ADD CONSTRAINT "Fixture_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "public"."Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PlayerStat" ADD CONSTRAINT "PlayerStat_fixtureId_fkey" FOREIGN KEY ("fixtureId") REFERENCES "public"."Fixture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PlayerStat" ADD CONSTRAINT "PlayerStat_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserSquad" ADD CONSTRAINT "UserSquad_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserSquad" ADD CONSTRAINT "UserSquad_gameweekId_fkey" FOREIGN KEY ("gameweekId") REFERENCES "public"."Gameweek"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserPick" ADD CONSTRAINT "UserPick_squadId_fkey" FOREIGN KEY ("squadId") REFERENCES "public"."UserSquad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserPick" ADD CONSTRAINT "UserPick_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transfer" ADD CONSTRAINT "Transfer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transfer" ADD CONSTRAINT "Transfer_gameweekId_fkey" FOREIGN KEY ("gameweekId") REFERENCES "public"."Gameweek"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserPoints" ADD CONSTRAINT "UserPoints_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserPoints" ADD CONSTRAINT "UserPoints_gameweekId_fkey" FOREIGN KEY ("gameweekId") REFERENCES "public"."Gameweek"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."League" ADD CONSTRAINT "League_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeagueMember" ADD CONSTRAINT "LeagueMember_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "public"."League"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeagueMember" ADD CONSTRAINT "LeagueMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeagueStanding" ADD CONSTRAINT "LeagueStanding_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "public"."League"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeagueStanding" ADD CONSTRAINT "LeagueStanding_gameweekId_fkey" FOREIGN KEY ("gameweekId") REFERENCES "public"."Gameweek"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeagueStanding" ADD CONSTRAINT "LeagueStanding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
