// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

/**
 * ADR-0013 rule 5: every dashboard path is built by `dashboardPath`. A link
 * spelled out by hand does not break when it drops the system — `proxy.ts`
 * quietly lands it on the default system — so nothing but this test notices.
 *
 * It walks the TypeScript AST rather than grepping, so a comment describing a
 * URL is not an offence and a literal split across a template is still one.
 */
const ROOT = join(__dirname, "..");
const SKIPPED_DIRS = new Set([
  "node_modules",
  "e2e",
  "generated",
  "coverage",
  "playwright-report",
  "test-results",
  "storage",
  "public",
]);
const HELPER = "i18n/dashboardPath.ts";

/**
 * Files that spelled out a dashboard path when the system segment landed
 * (SPEC-018 T2, part A). They still work through the proxy's redirect.
 * Part B rewrites each onto `dashboardPath` and removes it from here; the
 * test fails on an entry that no longer offends, so this list only shrinks.
 */
const ALLOWLIST = new Set([
  "app/[locale]/dashboard/[system]/admin/deities/new/page.tsx",
  "app/[locale]/dashboard/[system]/admin/factions/new/page.tsx",
  "app/[locale]/dashboard/[system]/admin/magicitems/new/page.tsx",
  "app/[locale]/dashboard/[system]/admin/npc/new/NewNpcForm.tsx",
  "app/[locale]/dashboard/[system]/admin/spells/new/page.tsx",
  "app/[locale]/dashboard/[system]/admin/treasures/new/page.tsx",
  "app/[locale]/dashboard/[system]/geography/page.tsx",
  "app/[locale]/dashboard/[system]/not-found.tsx",
  "app/lib/data/campaigns/createAdventure.ts",
  "app/lib/data/campaigns/createCampaign.ts",
  "app/lib/data/campaigns/createLoot.ts",
  "app/lib/data/campaigns/createScene.ts",
  "app/lib/data/campaigns/createSceneCreature.ts",
  "app/lib/data/campaigns/deleteAdventureById.ts",
  "app/lib/data/campaigns/deleteLootById.ts",
  "app/lib/data/campaigns/deleteSceneById.ts",
  "app/lib/data/campaigns/deleteSceneCreatureById.ts",
  "app/lib/data/campaigns/reorderAdventures.ts",
  "app/lib/data/campaigns/reorderLoot.ts",
  "app/lib/data/campaigns/reorderSceneCreatures.ts",
  "app/lib/data/campaigns/reorderScenes.ts",
  "app/lib/data/campaigns/setLootTaken.ts",
  "app/lib/data/campaigns/setSceneAwarded.ts",
  "app/lib/data/campaigns/setSceneCreatureAwarded.ts",
  "app/lib/data/campaigns/updateAdventure.ts",
  "app/lib/data/campaigns/updateCampaign.ts",
  "app/lib/data/campaigns/updateLoot.ts",
  "app/lib/data/campaigns/updateScene.ts",
  "app/lib/data/campaigns/updateSceneCreature.ts",
  "app/lib/data/maps/createPlace.ts",
  "app/lib/data/maps/createRootPlace.ts",
  "app/lib/data/maps/deletePlace.ts",
  "app/lib/data/maps/placeLandmark.ts",
  "app/lib/data/maps/placeZone.ts",
  "app/lib/data/maps/unplaceLandmark.ts",
  "app/lib/data/maps/unplacePlace.ts",
  "app/lib/data/maps/updateZoneDetails.ts",
  "app/lib/data/maps/updateZoneGrid.ts",
  "app/lib/data/maps/updateZoneMap.ts",
  "app/lib/data/maps/updateZonePosition.ts",
  "app/modules/maps/constants/linkable-entities.ts",
  "app/not-found.tsx",
  "app/ui/campaigns/AdventureHeader.tsx",
  "app/ui/campaigns/AdventureLadder.tsx",
  "app/ui/campaigns/SceneList.tsx",
  "app/ui/dashboard/cards.tsx",
  "app/ui/factions/FactionCard.tsx",
  "app/ui/npc/NpcCard.tsx",
  "app/ui/search/CrossEntitySearchResults.tsx",
]);

function isSourceFile(name: string) {
  return /\.tsx?$/.test(name) && !/\.(test|spec)\.tsx?$/.test(name);
}

function* sourceFiles(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || SKIPPED_DIRS.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* sourceFiles(path);
    else if (isSourceFile(entry.name)) yield relative(ROOT, path);
  }
}

function spellsOutDashboardPath(file: string) {
  const source = ts.createSourceFile(
    file,
    readFileSync(join(ROOT, file), "utf8"),
    ts.ScriptTarget.Latest,
    false,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );
  let found = false;
  const visit = (node: ts.Node) => {
    if (found) return;
    if (
      (ts.isStringLiteralLike(node) || ts.isTemplateLiteralToken(node)) &&
      node.text.startsWith("/dashboard")
    ) {
      found = true;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

const offenders = [...sourceFiles(ROOT)]
  .filter((file) => file !== HELPER && spellsOutDashboardPath(file))
  .sort();

describe("dashboard paths (ADR-0013 rule 5)", () => {
  it("are built by dashboardPath, never spelled out", () => {
    expect(offenders.filter((file) => !ALLOWLIST.has(file))).toEqual([]);
  });

  it("allowlists only files that still spell one out", () => {
    expect([...ALLOWLIST].filter((file) => !offenders.includes(file))).toEqual(
      []
    );
  });
});
