-- SPEC-022 T6: what each campaign has been shown. One implicit many-to-many
-- relation per revealable domain (Prisma's `_<name>Reveals`, A = campaign
-- and B = the record, or the reverse by model name). Deleting a campaign or a
-- record removes its reveals, and nothing else. No record starts revealed:
-- nothing becomes visible to a player by accident.

-- CreateTable
CREATE TABLE "_zoneReveals" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_zoneReveals_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_poiReveals" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_poiReveals_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_npcReveals" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_npcReveals_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_deityReveals" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_deityReveals_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_magicItemReveals" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_magicItemReveals_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_factionReveals" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_factionReveals_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_zoneReveals_B_index" ON "_zoneReveals"("B");

-- CreateIndex
CREATE INDEX "_poiReveals_B_index" ON "_poiReveals"("B");

-- CreateIndex
CREATE INDEX "_npcReveals_B_index" ON "_npcReveals"("B");

-- CreateIndex
CREATE INDEX "_deityReveals_B_index" ON "_deityReveals"("B");

-- CreateIndex
CREATE INDEX "_magicItemReveals_B_index" ON "_magicItemReveals"("B");

-- CreateIndex
CREATE INDEX "_factionReveals_B_index" ON "_factionReveals"("B");

-- AddForeignKey
ALTER TABLE "_zoneReveals" ADD CONSTRAINT "_zoneReveals_A_fkey" FOREIGN KEY ("A") REFERENCES "campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_zoneReveals" ADD CONSTRAINT "_zoneReveals_B_fkey" FOREIGN KEY ("B") REFERENCES "zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_poiReveals" ADD CONSTRAINT "_poiReveals_A_fkey" FOREIGN KEY ("A") REFERENCES "campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_poiReveals" ADD CONSTRAINT "_poiReveals_B_fkey" FOREIGN KEY ("B") REFERENCES "poi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_npcReveals" ADD CONSTRAINT "_npcReveals_A_fkey" FOREIGN KEY ("A") REFERENCES "campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_npcReveals" ADD CONSTRAINT "_npcReveals_B_fkey" FOREIGN KEY ("B") REFERENCES "npc"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_deityReveals" ADD CONSTRAINT "_deityReveals_A_fkey" FOREIGN KEY ("A") REFERENCES "campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_deityReveals" ADD CONSTRAINT "_deityReveals_B_fkey" FOREIGN KEY ("B") REFERENCES "deities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_magicItemReveals" ADD CONSTRAINT "_magicItemReveals_A_fkey" FOREIGN KEY ("A") REFERENCES "campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_magicItemReveals" ADD CONSTRAINT "_magicItemReveals_B_fkey" FOREIGN KEY ("B") REFERENCES "magicitems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_factionReveals" ADD CONSTRAINT "_factionReveals_A_fkey" FOREIGN KEY ("A") REFERENCES "campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_factionReveals" ADD CONSTRAINT "_factionReveals_B_fkey" FOREIGN KEY ("B") REFERENCES "faction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

