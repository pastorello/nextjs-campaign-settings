-- AlterTable
ALTER TABLE "adventure" ADD COLUMN     "goldTarget" INTEGER;

-- AlterTable
ALTER TABLE "loot" ADD COLUMN     "dhArmorId" INTEGER,
ADD COLUMN     "dhLootId" INTEGER,
ADD COLUMN     "dhWeaponId" INTEGER,
ADD COLUMN     "gold" INTEGER;

-- AlterTable
ALTER TABLE "scene" ADD COLUMN     "battleAdjustments" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "milestone" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "sceneCreature" ADD COLUMN     "dhAdversaryId" INTEGER;

-- AddForeignKey
ALTER TABLE "sceneCreature" ADD CONSTRAINT "sceneCreature_dhAdversaryId_fkey" FOREIGN KEY ("dhAdversaryId") REFERENCES "dhAdversary"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loot" ADD CONSTRAINT "loot_dhWeaponId_fkey" FOREIGN KEY ("dhWeaponId") REFERENCES "dhWeapon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loot" ADD CONSTRAINT "loot_dhArmorId_fkey" FOREIGN KEY ("dhArmorId") REFERENCES "dhArmor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loot" ADD CONSTRAINT "loot_dhLootId_fkey" FOREIGN KEY ("dhLootId") REFERENCES "dhLoot"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Hand-written below this line: guards the schema language cannot express.
-- `prisma migrate diff` does not know them, so a later generated migration
-- must be checked for not dropping them (schema.prisma says the same).

-- SPEC-030 §6: a loot row links at most one catalogue record, of the five.
ALTER TABLE "loot" ADD CONSTRAINT "loot_one_link" CHECK (num_nonnulls("magicItemId", "treasureId", "dhWeaponId", "dhArmorId", "dhLootId") <= 1);

-- SPEC-030 §9 decision 6: gold is a whole number of handfuls, never negative.
ALTER TABLE "loot" ADD CONSTRAINT "loot_gold_nonnegative" CHECK ("gold" IS NULL OR "gold" >= 0);
ALTER TABLE "adventure" ADD CONSTRAINT "adventure_gold_target_nonnegative" CHECK ("goldTarget" IS NULL OR "goldTarget" >= 0);
