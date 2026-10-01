-- CreateTable
CREATE TABLE "dhAdversary" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "adversaryType" TEXT NOT NULL,
    "hordeDensity" INTEGER,
    "description" TEXT,
    "motives" TEXT,
    "difficulty" INTEGER NOT NULL,
    "majorThreshold" INTEGER,
    "severeThreshold" INTEGER,
    "hp" INTEGER NOT NULL,
    "stress" INTEGER NOT NULL,
    "attackModifier" INTEGER NOT NULL,
    "attackName" TEXT NOT NULL,
    "attackRange" TEXT NOT NULL,
    "attackDamage" TEXT NOT NULL,
    "attackType" TEXT NOT NULL,
    "origin" TEXT NOT NULL DEFAULT 'homebrew',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "imageId" INTEGER,

    CONSTRAINT "dhAdversary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dhAdversaryExperience" (
    "id" SERIAL NOT NULL,
    "adversaryId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "bonus" INTEGER NOT NULL,

    CONSTRAINT "dhAdversaryExperience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dhAdversaryFeature" (
    "id" SERIAL NOT NULL,
    "adversaryId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "fear" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "dhAdversaryFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dhEnvironment" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "environmentType" TEXT NOT NULL,
    "description" TEXT,
    "impulses" TEXT,
    "difficulty" INTEGER NOT NULL,
    "otherAdversaries" TEXT,
    "origin" TEXT NOT NULL DEFAULT 'homebrew',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "imageId" INTEGER,

    CONSTRAINT "dhEnvironment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dhEnvironmentAdversary" (
    "environmentId" INTEGER NOT NULL,
    "adversaryId" INTEGER NOT NULL,

    CONSTRAINT "dhEnvironmentAdversary_pkey" PRIMARY KEY ("environmentId","adversaryId")
);

-- CreateTable
CREATE TABLE "dhEnvironmentFeature" (
    "id" SERIAL NOT NULL,
    "environmentId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "questions" TEXT,

    CONSTRAINT "dhEnvironmentFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_dhEnvironmentPlaces" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_dhEnvironmentPlaces_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "dhAdversary_imageId_key" ON "dhAdversary"("imageId");

-- CreateIndex
CREATE INDEX "dhAdversary_name_idx" ON "dhAdversary"("name");

-- CreateIndex
CREATE INDEX "dhAdversaryExperience_adversaryId_idx" ON "dhAdversaryExperience"("adversaryId");

-- CreateIndex
CREATE INDEX "dhAdversaryFeature_adversaryId_idx" ON "dhAdversaryFeature"("adversaryId");

-- CreateIndex
CREATE UNIQUE INDEX "dhEnvironment_imageId_key" ON "dhEnvironment"("imageId");

-- CreateIndex
CREATE INDEX "dhEnvironment_name_idx" ON "dhEnvironment"("name");

-- CreateIndex
CREATE INDEX "dhEnvironmentAdversary_adversaryId_idx" ON "dhEnvironmentAdversary"("adversaryId");

-- CreateIndex
CREATE INDEX "dhEnvironmentFeature_environmentId_idx" ON "dhEnvironmentFeature"("environmentId");

-- CreateIndex
CREATE INDEX "_dhEnvironmentPlaces_B_index" ON "_dhEnvironmentPlaces"("B");

-- AddForeignKey
ALTER TABLE "dhAdversary" ADD CONSTRAINT "dhAdversary_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "recordImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dhAdversaryExperience" ADD CONSTRAINT "dhAdversaryExperience_adversaryId_fkey" FOREIGN KEY ("adversaryId") REFERENCES "dhAdversary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dhAdversaryFeature" ADD CONSTRAINT "dhAdversaryFeature_adversaryId_fkey" FOREIGN KEY ("adversaryId") REFERENCES "dhAdversary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dhEnvironment" ADD CONSTRAINT "dhEnvironment_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "recordImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dhEnvironmentAdversary" ADD CONSTRAINT "dhEnvironmentAdversary_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "dhEnvironment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dhEnvironmentAdversary" ADD CONSTRAINT "dhEnvironmentAdversary_adversaryId_fkey" FOREIGN KEY ("adversaryId") REFERENCES "dhAdversary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dhEnvironmentFeature" ADD CONSTRAINT "dhEnvironmentFeature_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "dhEnvironment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_dhEnvironmentPlaces" ADD CONSTRAINT "_dhEnvironmentPlaces_A_fkey" FOREIGN KEY ("A") REFERENCES "dhEnvironment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_dhEnvironmentPlaces" ADD CONSTRAINT "_dhEnvironmentPlaces_B_fkey" FOREIGN KEY ("B") REFERENCES "zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Hand-written below this line: guards the schema language cannot express.
-- `prisma migrate diff` does not know them, so a later generated migration
-- must be checked for not dropping them (schema.prisma says the same).

-- SPEC-028 §5 / daggerheart.md §8: tier 1–4; HP 1–12, Stress 0–12.
ALTER TABLE "dhAdversary" ADD CONSTRAINT "dhAdversary_tier_range" CHECK ("tier" BETWEEN 1 AND 4);
ALTER TABLE "dhAdversary" ADD CONSTRAINT "dhAdversary_hp_range" CHECK ("hp" BETWEEN 1 AND 12);
ALTER TABLE "dhAdversary" ADD CONSTRAINT "dhAdversary_stress_range" CHECK ("stress" BETWEEN 0 AND 12);
ALTER TABLE "dhEnvironment" ADD CONSTRAINT "dhEnvironment_tier_range" CHECK ("tier" BETWEEN 1 AND 4);

-- SPEC-018 §5: a horde's density is set, and only a horde's.
ALTER TABLE "dhAdversary" ADD CONSTRAINT "dhAdversary_horde_density" CHECK (("adversaryType" = 'horde') = ("hordeDensity" IS NOT NULL) AND ("hordeDensity" IS NULL OR "hordeDensity" >= 1));

-- SPEC-028 §9 decision 1: thresholds come as a pair, only a minion may have
-- none, and Major < Severe.
ALTER TABLE "dhAdversary" ADD CONSTRAINT "dhAdversary_thresholds" CHECK (("majorThreshold" IS NULL) = ("severeThreshold" IS NULL) AND ("majorThreshold" IS NOT NULL OR "adversaryType" = 'minion') AND ("majorThreshold" IS NULL OR "majorThreshold" < "severeThreshold"));
