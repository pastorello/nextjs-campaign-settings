-- TD-19: png -> npc, matching the identifier rename across the codebase.
-- A pure rename: no columns, types, or data change. Zero rows are lost.
ALTER TABLE "png" RENAME TO "npc";
