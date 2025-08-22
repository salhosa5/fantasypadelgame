-- AlterTable
ALTER TABLE "public"."UserSquad" ADD COLUMN     "chip" "public"."ChipType" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "freeTransfers" INTEGER NOT NULL DEFAULT 1;
