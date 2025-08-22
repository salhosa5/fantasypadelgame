-- CreateTable
CREATE TABLE "public"."SquadScore" (
    "id" SERIAL NOT NULL,
    "squadId" INTEGER NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SquadScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SquadScore_squadId_key" ON "public"."SquadScore"("squadId");

-- AddForeignKey
ALTER TABLE "public"."SquadScore" ADD CONSTRAINT "SquadScore_squadId_fkey" FOREIGN KEY ("squadId") REFERENCES "public"."UserSquad"("id") ON DELETE CASCADE ON UPDATE CASCADE;
