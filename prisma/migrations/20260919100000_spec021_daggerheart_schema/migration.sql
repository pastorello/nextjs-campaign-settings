-- SPEC-021 T1 — the Daggerheart catalogue: domains, domain cards, classes,
-- subclasses and their features. Purely additive: six new tables, nothing
-- altered on an existing one, no backfill, nothing seeded (SPEC-018 §5).
-- Reversible by dropping the six tables. Down to the hand-written guards at
-- the end, exactly what `prisma migrate diff --from-schema <main schema>
-- --to-schema prisma/schema.prisma --script` printed.

-- CreateTable
CREATE TABLE "dhDomain" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "colour" TEXT NOT NULL,
    "origin" TEXT NOT NULL DEFAULT 'homebrew',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "imageId" INTEGER,

    CONSTRAINT "dhDomain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dhDomainCard" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "domainId" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "recallCost" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "featureText" TEXT NOT NULL,
    "origin" TEXT NOT NULL DEFAULT 'homebrew',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dhDomainCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dhClass" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "domainAId" INTEGER NOT NULL,
    "domainBId" INTEGER NOT NULL,
    "startingEvasion" INTEGER NOT NULL,
    "startingHp" INTEGER NOT NULL,
    "classItems" TEXT,
    "hopeFeatureName" TEXT NOT NULL,
    "hopeFeatureText" TEXT NOT NULL,
    "origin" TEXT NOT NULL DEFAULT 'homebrew',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dhClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dhClassFeature" (
    "id" SERIAL NOT NULL,
    "classId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "dhClassFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dhSubclass" (
    "id" SERIAL NOT NULL,
    "classId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "spellcastTrait" TEXT,
    "origin" TEXT NOT NULL DEFAULT 'homebrew',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dhSubclass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dhSubclassFeature" (
    "id" SERIAL NOT NULL,
    "subclassId" INTEGER NOT NULL,
    "tier" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "dhSubclassFeature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dhDomain_imageId_key" ON "dhDomain"("imageId");

-- CreateIndex
CREATE INDEX "dhDomain_name_idx" ON "dhDomain"("name");

-- CreateIndex
CREATE INDEX "dhDomainCard_domainId_level_idx" ON "dhDomainCard"("domainId", "level");

-- CreateIndex
CREATE INDEX "dhDomainCard_name_idx" ON "dhDomainCard"("name");

-- CreateIndex
CREATE INDEX "dhClass_domainAId_idx" ON "dhClass"("domainAId");

-- CreateIndex
CREATE INDEX "dhClass_domainBId_idx" ON "dhClass"("domainBId");

-- CreateIndex
CREATE INDEX "dhClass_name_idx" ON "dhClass"("name");

-- CreateIndex
CREATE INDEX "dhClassFeature_classId_idx" ON "dhClassFeature"("classId");

-- CreateIndex
CREATE INDEX "dhSubclass_classId_idx" ON "dhSubclass"("classId");

-- CreateIndex
CREATE INDEX "dhSubclass_name_idx" ON "dhSubclass"("name");

-- CreateIndex
CREATE INDEX "dhSubclassFeature_subclassId_idx" ON "dhSubclassFeature"("subclassId");

-- AddForeignKey
ALTER TABLE "dhDomain" ADD CONSTRAINT "dhDomain_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "recordImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dhDomainCard" ADD CONSTRAINT "dhDomainCard_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "dhDomain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dhClass" ADD CONSTRAINT "dhClass_domainAId_fkey" FOREIGN KEY ("domainAId") REFERENCES "dhDomain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dhClass" ADD CONSTRAINT "dhClass_domainBId_fkey" FOREIGN KEY ("domainBId") REFERENCES "dhDomain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dhClassFeature" ADD CONSTRAINT "dhClassFeature_classId_fkey" FOREIGN KEY ("classId") REFERENCES "dhClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dhSubclass" ADD CONSTRAINT "dhSubclass_classId_fkey" FOREIGN KEY ("classId") REFERENCES "dhClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dhSubclassFeature" ADD CONSTRAINT "dhSubclassFeature_subclassId_fkey" FOREIGN KEY ("subclassId") REFERENCES "dhSubclass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Hand-written below this line: guards the schema language cannot express.
-- `prisma migrate diff` does not know them, so a later generated migration
-- must be checked for not dropping them (schema.prisma says the same).

-- SPEC-021 §5: a domain card's level is 1–10, its recall cost (Stress) ≥ 0.
ALTER TABLE "dhDomainCard" ADD CONSTRAINT "dhDomainCard_level_range" CHECK ("level" BETWEEN 1 AND 10);
ALTER TABLE "dhDomainCard" ADD CONSTRAINT "dhDomainCard_recallCost_nonnegative" CHECK ("recallCost" >= 0);

-- SPEC-018 §5 / SPEC-021 §5: a class's two domains are different.
ALTER TABLE "dhClass" ADD CONSTRAINT "dhClass_distinct_domains" CHECK ("domainAId" <> "domainBId");
