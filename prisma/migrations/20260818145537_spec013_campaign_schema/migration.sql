-- AlterTable
ALTER TABLE "magicitems" ADD COLUMN     "consumable" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "campaign" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "synopsis" TEXT,
    "partySize" INTEGER NOT NULL DEFAULT 4,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adventure" (
    "id" SERIAL NOT NULL,
    "campaignId" INTEGER,
    "position" INTEGER NOT NULL,
    "targetLevel" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "synopsis" TEXT,
    "timeline" TEXT,
    "status" TEXT NOT NULL,
    "xpTarget" INTEGER,
    "currencyTarget" INTEGER,
    "currencyUnit" TEXT,
    "permanentItemTarget" INTEGER,
    "consumableTarget" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "adventure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scene" (
    "id" SERIAL NOT NULL,
    "adventureId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "xpAward" INTEGER,
    "grantsHeroPoint" BOOLEAN NOT NULL DEFAULT false,
    "awarded" BOOLEAN NOT NULL DEFAULT false,
    "zoneId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scene_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sceneCreature" (
    "id" SERIAL NOT NULL,
    "sceneId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER,
    "xpEach" INTEGER,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "note" TEXT,
    "awarded" BOOLEAN NOT NULL DEFAULT false,
    "npcId" INTEGER,

    CONSTRAINT "sceneCreature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loot" (
    "id" SERIAL NOT NULL,
    "sceneId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "value" INTEGER,
    "taken" BOOLEAN NOT NULL DEFAULT false,
    "magicItemId" INTEGER,
    "treasureId" INTEGER,

    CONSTRAINT "loot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treasure" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" INTEGER NOT NULL,
    "value" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "treasure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "adventure_campaignId_idx" ON "adventure"("campaignId");

-- CreateIndex
CREATE INDEX "scene_adventureId_idx" ON "scene"("adventureId");

-- CreateIndex
CREATE INDEX "scene_zoneId_idx" ON "scene"("zoneId");

-- CreateIndex
CREATE INDEX "sceneCreature_sceneId_idx" ON "sceneCreature"("sceneId");

-- CreateIndex
CREATE INDEX "loot_sceneId_idx" ON "loot"("sceneId");

-- CreateIndex
CREATE INDEX "treasure_name_idx" ON "treasure"("name");

-- AddForeignKey
ALTER TABLE "adventure" ADD CONSTRAINT "adventure_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene" ADD CONSTRAINT "scene_adventureId_fkey" FOREIGN KEY ("adventureId") REFERENCES "adventure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene" ADD CONSTRAINT "scene_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sceneCreature" ADD CONSTRAINT "sceneCreature_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "scene"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sceneCreature" ADD CONSTRAINT "sceneCreature_npcId_fkey" FOREIGN KEY ("npcId") REFERENCES "npc"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loot" ADD CONSTRAINT "loot_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "scene"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loot" ADD CONSTRAINT "loot_magicItemId_fkey" FOREIGN KEY ("magicItemId") REFERENCES "magicitems"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loot" ADD CONSTRAINT "loot_treasureId_fkey" FOREIGN KEY ("treasureId") REFERENCES "treasure"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- SPEC-013 T2 — backfill magicitems.consumable from the existing tipo column.
-- 6 = scroll, 7 = potion (app/lib/config/magicitem/item-types.ts); every other
-- type keeps the false default. This is a starting point, not a final answer:
-- a wand with charges is permanent and a wondrous item can be single-use, so
-- the derivation from tipo alone is wrong on some real items, and the DM
-- corrects those by hand.
UPDATE "magicitems" SET "consumable" = true WHERE "tipo" IN (6, 7);
