-- SPEC-022 T5: a campaign's players. Implicit many-to-many (Prisma's
-- `_campaignMembers`, A = campaign, B = users): deleting a campaign or an
-- account removes its memberships, and nothing else.

-- CreateTable
CREATE TABLE "_campaignMembers" (
    "A" INTEGER NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_campaignMembers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_campaignMembers_B_index" ON "_campaignMembers"("B");

-- AddForeignKey
ALTER TABLE "_campaignMembers" ADD CONSTRAINT "_campaignMembers_A_fkey" FOREIGN KEY ("A") REFERENCES "campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_campaignMembers" ADD CONSTRAINT "_campaignMembers_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

