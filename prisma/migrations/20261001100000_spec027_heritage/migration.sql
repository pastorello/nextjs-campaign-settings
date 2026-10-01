-- SPEC-027: the Daggerheart heritage catalogues (ancestries and communities)
-- and the communities' links to places and factions. Additive only.

-- CreateTable
CREATE TABLE "dhAncestry" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "featureAName" TEXT NOT NULL,
    "featureAText" TEXT NOT NULL,
    "featureBName" TEXT NOT NULL,
    "featureBText" TEXT NOT NULL,
    "origin" TEXT NOT NULL DEFAULT 'homebrew',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "imageId" INTEGER,

    CONSTRAINT "dhAncestry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dhCommunity" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "adjectives" TEXT,
    "featureName" TEXT NOT NULL,
    "featureText" TEXT NOT NULL,
    "origin" TEXT NOT NULL DEFAULT 'homebrew',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "imageId" INTEGER,

    CONSTRAINT "dhCommunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_dhCommunityPlaces" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_dhCommunityPlaces_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_dhCommunityFactions" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_dhCommunityFactions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "dhAncestry_imageId_key" ON "dhAncestry"("imageId");

-- CreateIndex
CREATE INDEX "dhAncestry_name_idx" ON "dhAncestry"("name");

-- CreateIndex
CREATE UNIQUE INDEX "dhCommunity_imageId_key" ON "dhCommunity"("imageId");

-- CreateIndex
CREATE INDEX "dhCommunity_name_idx" ON "dhCommunity"("name");

-- CreateIndex
CREATE INDEX "_dhCommunityPlaces_B_index" ON "_dhCommunityPlaces"("B");

-- CreateIndex
CREATE INDEX "_dhCommunityFactions_B_index" ON "_dhCommunityFactions"("B");

-- AddForeignKey
ALTER TABLE "dhAncestry" ADD CONSTRAINT "dhAncestry_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "recordImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dhCommunity" ADD CONSTRAINT "dhCommunity_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "recordImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_dhCommunityPlaces" ADD CONSTRAINT "_dhCommunityPlaces_A_fkey" FOREIGN KEY ("A") REFERENCES "dhCommunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_dhCommunityPlaces" ADD CONSTRAINT "_dhCommunityPlaces_B_fkey" FOREIGN KEY ("B") REFERENCES "zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_dhCommunityFactions" ADD CONSTRAINT "_dhCommunityFactions_A_fkey" FOREIGN KEY ("A") REFERENCES "dhCommunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_dhCommunityFactions" ADD CONSTRAINT "_dhCommunityFactions_B_fkey" FOREIGN KEY ("B") REFERENCES "faction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

