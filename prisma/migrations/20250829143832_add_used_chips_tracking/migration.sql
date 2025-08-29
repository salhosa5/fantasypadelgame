-- CreateTable
CREATE TABLE "public"."UsedChip" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chip" "public"."ChipType" NOT NULL,
    "gameweekId" INTEGER NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsedChip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UsedChip_userId_idx" ON "public"."UsedChip"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UsedChip_userId_chip_key" ON "public"."UsedChip"("userId", "chip");

-- AddForeignKey
ALTER TABLE "public"."UsedChip" ADD CONSTRAINT "UsedChip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UsedChip" ADD CONSTRAINT "UsedChip_gameweekId_fkey" FOREIGN KEY ("gameweekId") REFERENCES "public"."Gameweek"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
