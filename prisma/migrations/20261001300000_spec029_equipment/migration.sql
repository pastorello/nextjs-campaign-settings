-- CreateTable
CREATE TABLE "dhWeapon" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "slot" TEXT NOT NULL,
    "trait" TEXT NOT NULL,
    "range" TEXT NOT NULL,
    "damageDie" INTEGER NOT NULL,
    "damageBonus" INTEGER NOT NULL DEFAULT 0,
    "damageType" TEXT NOT NULL,
    "burden" INTEGER NOT NULL,
    "featureName" TEXT,
    "featureText" TEXT,
    "origin" TEXT NOT NULL DEFAULT 'homebrew',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "imageId" INTEGER,

    CONSTRAINT "dhWeapon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dhArmor" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "majorThreshold" INTEGER NOT NULL,
    "severeThreshold" INTEGER NOT NULL,
    "armorScore" INTEGER NOT NULL,
    "featureName" TEXT,
    "featureText" TEXT,
    "origin" TEXT NOT NULL DEFAULT 'homebrew',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "imageId" INTEGER,

    CONSTRAINT "dhArmor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dhLoot" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "rollValue" INTEGER,
    "effectText" TEXT NOT NULL,
    "origin" TEXT NOT NULL DEFAULT 'homebrew',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "imageId" INTEGER,

    CONSTRAINT "dhLoot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dhWeapon_imageId_key" ON "dhWeapon"("imageId");

-- CreateIndex
CREATE INDEX "dhWeapon_name_idx" ON "dhWeapon"("name");

-- CreateIndex
CREATE UNIQUE INDEX "dhArmor_imageId_key" ON "dhArmor"("imageId");

-- CreateIndex
CREATE INDEX "dhArmor_name_idx" ON "dhArmor"("name");

-- CreateIndex
CREATE UNIQUE INDEX "dhLoot_imageId_key" ON "dhLoot"("imageId");

-- CreateIndex
CREATE INDEX "dhLoot_name_idx" ON "dhLoot"("name");

-- CreateIndex
CREATE INDEX "dhLoot_rollValue_idx" ON "dhLoot"("rollValue");

-- AddForeignKey
ALTER TABLE "dhWeapon" ADD CONSTRAINT "dhWeapon_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "recordImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dhArmor" ADD CONSTRAINT "dhArmor_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "recordImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dhLoot" ADD CONSTRAINT "dhLoot_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "recordImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Hand-written below this line: guards the schema language cannot express.
-- `prisma migrate diff` does not know them, so a later generated migration
-- must be checked for not dropping them (schema.prisma says the same).

-- SPEC-029 §5 / daggerheart.md §8: tiers 1–4; a weapon's die, bonus and
-- burden; an armor's score (1–12) and Major < Severe; a loot roll value > 0.
ALTER TABLE "dhWeapon" ADD CONSTRAINT "dhWeapon_tier_range" CHECK ("tier" BETWEEN 1 AND 4);
ALTER TABLE "dhWeapon" ADD CONSTRAINT "dhWeapon_damage_die" CHECK ("damageDie" IN (4, 6, 8, 10, 12, 20));
ALTER TABLE "dhWeapon" ADD CONSTRAINT "dhWeapon_damage_bonus" CHECK ("damageBonus" >= 0);
ALTER TABLE "dhWeapon" ADD CONSTRAINT "dhWeapon_burden" CHECK ("burden" IN (1, 2));
ALTER TABLE "dhArmor" ADD CONSTRAINT "dhArmor_tier_range" CHECK ("tier" BETWEEN 1 AND 4);
ALTER TABLE "dhArmor" ADD CONSTRAINT "dhArmor_score_range" CHECK ("armorScore" BETWEEN 1 AND 12);
ALTER TABLE "dhArmor" ADD CONSTRAINT "dhArmor_thresholds" CHECK ("majorThreshold" < "severeThreshold");
ALTER TABLE "dhLoot" ADD CONSTRAINT "dhLoot_roll_value" CHECK ("rollValue" IS NULL OR "rollValue" > 0);

-- SPEC-029 §6: a feature is a name and a text, or neither.
ALTER TABLE "dhWeapon" ADD CONSTRAINT "dhWeapon_feature_pair" CHECK (("featureName" IS NULL) = ("featureText" IS NULL));
ALTER TABLE "dhArmor" ADD CONSTRAINT "dhArmor_feature_pair" CHECK (("featureName" IS NULL) = ("featureText" IS NULL));
