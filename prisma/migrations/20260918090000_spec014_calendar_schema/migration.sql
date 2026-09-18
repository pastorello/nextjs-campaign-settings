-- AlterTable
ALTER TABLE "campaign" ADD COLUMN     "currentDay" INTEGER;

-- CreateTable
CREATE TABLE "dateSystem" (
    "id" SERIAL NOT NULL,
    "isUniversal" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT NOT NULL,
    "anchorEvent" TEXT,
    "anchorYear" INTEGER NOT NULL DEFAULT 0,
    "afterLabel" TEXT NOT NULL,
    "afterAbbrev" TEXT NOT NULL,
    "beforeLabel" TEXT,
    "beforeAbbrev" TEXT,
    "monthNames" TEXT[],
    "weekdayNames" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dateSystem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendarSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "moonNewMoonDay" INTEGER,

    CONSTRAINT "calendarSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendarEvent" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDay" INTEGER NOT NULL,
    "startHour" INTEGER,
    "endDay" INTEGER,
    "endHour" INTEGER,
    "repeatsYearly" BOOLEAN NOT NULL DEFAULT false,
    "campaignId" INTEGER,
    "adventureId" INTEGER,
    "sceneId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_calendarEventTozone" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_calendarEventTozone_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_calendarEventTonpc" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_calendarEventTonpc_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_calendarEventTodeities" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_calendarEventTodeities_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_calendarEventTofaction" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_calendarEventTofaction_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "calendarEvent_campaignId_startDay_idx" ON "calendarEvent"("campaignId", "startDay");

-- CreateIndex
CREATE INDEX "calendarEvent_startDay_idx" ON "calendarEvent"("startDay");

-- CreateIndex
CREATE INDEX "calendarEvent_adventureId_idx" ON "calendarEvent"("adventureId");

-- CreateIndex
CREATE INDEX "calendarEvent_sceneId_idx" ON "calendarEvent"("sceneId");

-- CreateIndex
CREATE INDEX "_calendarEventTozone_B_index" ON "_calendarEventTozone"("B");

-- CreateIndex
CREATE INDEX "_calendarEventTonpc_B_index" ON "_calendarEventTonpc"("B");

-- CreateIndex
CREATE INDEX "_calendarEventTodeities_B_index" ON "_calendarEventTodeities"("B");

-- CreateIndex
CREATE INDEX "_calendarEventTofaction_B_index" ON "_calendarEventTofaction"("B");

-- AddForeignKey
ALTER TABLE "calendarEvent" ADD CONSTRAINT "calendarEvent_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendarEvent" ADD CONSTRAINT "calendarEvent_adventureId_fkey" FOREIGN KEY ("adventureId") REFERENCES "adventure"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendarEvent" ADD CONSTRAINT "calendarEvent_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "scene"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_calendarEventTozone" ADD CONSTRAINT "_calendarEventTozone_A_fkey" FOREIGN KEY ("A") REFERENCES "calendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_calendarEventTozone" ADD CONSTRAINT "_calendarEventTozone_B_fkey" FOREIGN KEY ("B") REFERENCES "zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_calendarEventTonpc" ADD CONSTRAINT "_calendarEventTonpc_A_fkey" FOREIGN KEY ("A") REFERENCES "calendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_calendarEventTonpc" ADD CONSTRAINT "_calendarEventTonpc_B_fkey" FOREIGN KEY ("B") REFERENCES "npc"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_calendarEventTodeities" ADD CONSTRAINT "_calendarEventTodeities_A_fkey" FOREIGN KEY ("A") REFERENCES "calendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_calendarEventTodeities" ADD CONSTRAINT "_calendarEventTodeities_B_fkey" FOREIGN KEY ("B") REFERENCES "deities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_calendarEventTofaction" ADD CONSTRAINT "_calendarEventTofaction_A_fkey" FOREIGN KEY ("A") REFERENCES "calendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_calendarEventTofaction" ADD CONSTRAINT "_calendarEventTofaction_B_fkey" FOREIGN KEY ("B") REFERENCES "faction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Hand-written below this line: guards and rows the Prisma schema language
-- cannot express, so `prisma migrate diff` did not generate them. See the
-- comment above `model dateSystem` in schema.prisma.
-- ---------------------------------------------------------------------------

-- At most one universal count and at most one default date system. The
-- actions keep each "exactly one"; these turn a bug there into an error.
CREATE UNIQUE INDEX "dateSystem_one_universal" ON "dateSystem"("isUniversal") WHERE "isUniversal";
CREATE UNIQUE INDEX "dateSystem_one_default" ON "dateSystem"("isDefault") WHERE "isDefault";

-- Twelve months and seven weekdays (SPEC-014 §5.2). `cardinality` of a NULL
-- array is NULL, which a CHECK lets through, hence the explicit NOT NULL.
ALTER TABLE "dateSystem" ADD CONSTRAINT "dateSystem_monthNames_count" CHECK ("monthNames" IS NOT NULL AND cardinality("monthNames") = 12);
ALTER TABLE "dateSystem" ADD CONSTRAINT "dateSystem_weekdayNames_count" CHECK ("weekdayNames" IS NOT NULL AND cardinality("weekdayNames") = 7);

-- The settings table holds one row, id 1.
ALTER TABLE "calendarSettings" ADD CONSTRAINT "calendarSettings_singleton" CHECK ("id" = 1);

-- Nothing precedes the dawn of time; an end is not before its start; hours
-- are 0–23 (§5.1, §5 edge cases). NULLs pass: both are optional.
ALTER TABLE "calendarEvent" ADD CONSTRAINT "calendarEvent_startDay_nonnegative" CHECK ("startDay" >= 0);
ALTER TABLE "calendarEvent" ADD CONSTRAINT "calendarEvent_endDay_not_before_start" CHECK ("endDay" >= "startDay");
ALTER TABLE "calendarEvent" ADD CONSTRAINT "calendarEvent_startHour_range" CHECK ("startHour" BETWEEN 0 AND 23);
ALTER TABLE "calendarEvent" ADD CONSTRAINT "calendarEvent_endHour_range" CHECK ("endHour" BETWEEN 0 AND 23);

-- The universal count, as the default (§6). Italian placeholder names, which
-- the DM renames in the date systems panel (T3); it has no "before" labels,
-- since nothing precedes its year 0.
INSERT INTO "dateSystem" ("isUniversal", "isDefault", "name", "anchorEvent", "anchorYear", "afterLabel", "afterAbbrev", "beforeLabel", "beforeAbbrev", "monthNames", "weekdayNames", "updatedAt") VALUES (
    true,
    true,
    'Calendario universale',
    NULL,
    0,
    'dall''alba dei tempi',
    'a.T.',
    NULL,
    NULL,
    ARRAY['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'],
    ARRAY['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'],
    CURRENT_TIMESTAMP
);

-- The settings singleton; no reference new moon until the DM sets one.
INSERT INTO "calendarSettings" ("id", "moonNewMoonDay") VALUES (1, NULL);
