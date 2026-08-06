/**
 * SPEC-004 T3 — seeds the world tree's known structure: the universe root
 * and the chain of four legacy maps (`public/maps/*.jpg`, previously the
 * hardcoded four-map switcher M7 removed), then the 33 named locations from
 * `locationList.ts` as unplaced leaves.
 *
 *   pnpm tsx --env-file-if-exists=.env app/seed/migrateWorldTreeT3.ts
 *
 * Idempotent: every place is matched by `(title, kind)` before creating, so
 * a repeated or resumed-after-failure run does not duplicate the tree or
 * re-upload map images.
 *
 * **Parentage for the 33 locations is a best guess, not certainty** — per
 * the spec's migration strategy (§6), only 5 of the 33 have direct evidence
 * (the deity `residence`/`location` pairs in `deities.ts`); the other 28
 * default to `Terra` (the material world) pending DM review. Confirmed with
 * the DM 2026-08-06 as an acceptable, freely-reparentable starting point —
 * not a claim that these locations really sit on the material plane.
 *
 * Does not touch `npc`/`deities` rows or their `location`/`residence`
 * columns — pinning them to these places is SPEC-004 T4. Does not drop any
 * column — that is T5, after T4's pins make the columns provably
 * redundant.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

import prisma from "@/app/lib/connections/prisma";
import defaultMapImageStore from "@/app/lib/storage/defaultMapImageStore";
import type { PlaceKind } from "@/app/modules/maps/types/poi";

interface MapAsset {
  file: string;
  bounds: [[number, number], [number, number]];
  initialView: [number, number];
  initialZoom: number;
}

// Bounds/initialView/initialZoom recovered from the pre-M7 four-map
// switcher (git show 6a505a7^:"app/[locale]/dashboard/geography/page.tsx")
// — M7 removed them from the page without moving them anywhere, since
// migrating the legacy maps into the tree was always deferred to this item.
const ROOT_MAP: MapAsset = {
  file: "piani-esistenza.jpg",
  bounds: [
    [0, 0],
    [1000, 1333],
  ],
  initialView: [700, 655],
  initialZoom: -2,
};
const TERRA_MAP: MapAsset = {
  file: "mondo-materiale.jpg",
  bounds: [
    [0, 0],
    [1000, 1142],
  ],
  initialView: [500, 655],
  initialZoom: 1,
};
const KANG_MAP: MapAsset = {
  file: "regno-di-kang.jpg",
  bounds: [
    [0, 0],
    [500, 1000],
  ],
  initialView: [150, 540],
  initialZoom: 2,
};
const SKREEBARS_MAP: MapAsset = {
  file: "skreebars.jpg",
  bounds: [
    [0, 0],
    [1000, 1333],
  ],
  initialView: [150, 540],
  initialZoom: -2,
};

/**
 * The seven planes (`celestialPlanes.ts`'s values, Italian display names
 * from `messages/it.json`'s `geography.planes.*`). `Terra` is the material
 * world itself — SPEC-004 §6's migration strategy step 2 — so it alone
 * carries `TERRA_MAP`.
 */
const PLANES = [
  "Cieli",
  "Tempo",
  "Terre Oniriche",
  "Selva Fatata",
  "Selva Oscura",
  "Inferi",
  "Terra",
] as const;

/**
 * The 33 `locationList.ts` entries, by their `Location` enum string (the
 * value this script writes as `title`, and what SPEC-004 T4 will match
 * `npc.location`/`deities.location` against). `kind` follows `Location.ts`'s
 * own section comments literally: "Città" → city, "Dungeon" → dungeon,
 * everything else ("Luoghi Divini", "Luoghi Fatati" — no closer kind exists
 * in T2's vocabulary) → region. `parent` is one of `PLANES` above. Skreebars
 * (locationList value 26) is deliberately absent — it is the same place as
 * the map chain's city below, not a second row.
 *
 * Reviewed and confirmed with the DM 2026-08-06.
 */
const LOCATIONS: {
  title: string;
  kind: Extract<PlaceKind, "region" | "city" | "dungeon">;
  parent: (typeof PLANES)[number];
}[] = [
  { title: "Paradiso (Sole)", kind: "region", parent: "Cieli" },
  { title: "Elysium (Luna)", kind: "region", parent: "Cieli" },
  { title: "L'Abisso", kind: "region", parent: "Selva Oscura" },
  { title: "Fiume delle Anime", kind: "region", parent: "Terra" },
  { title: "Inferno", kind: "region", parent: "Inferi" },
  { title: "Regno dei Folletti", kind: "region", parent: "Terra" },
  { title: "Regno delle Fate", kind: "region", parent: "Terra" },
  { title: "Alba dei Tempi", kind: "region", parent: "Terra" },
  { title: "Terre Oniriche", kind: "region", parent: "Terra" },
  { title: "Isola dei Druidi", kind: "region", parent: "Selva Fatata" },
  { title: "Monte An-ki", kind: "city", parent: "Terra" },
  { title: "Deserto di Solenero", kind: "city", parent: "Terra" },
  { title: "Monastero di San Basilio", kind: "city", parent: "Terra" },
  { title: "Ultima casa degli Annunaki", kind: "city", parent: "Terra" },
  { title: "Scuola dell'Invisibile", kind: "city", parent: "Terra" },
  { title: "Villaggio di Torrerossa", kind: "city", parent: "Terra" },
  { title: "Miravia", kind: "city", parent: "Terra" },
  { title: "Norgam", kind: "city", parent: "Terra" },
  { title: "Butwhag", kind: "city", parent: "Terra" },
  { title: "Barak Thor", kind: "city", parent: "Terra" },
  { title: "Circolo druidico di Valleferro", kind: "city", parent: "Terra" },
  { title: "Congrega delle Megere", kind: "city", parent: "Terra" },
  { title: "Tempio dei Demoni Rossi", kind: "city", parent: "Terra" },
  { title: "Montagna dei Cinque Picchi", kind: "city", parent: "Terra" },
  {
    title: "Avamposto clandestino degli orchi",
    kind: "dungeon",
    parent: "Terra",
  },
  { title: "Valleferro", kind: "city", parent: "Terra" },
  { title: "Tana dei Goblin", kind: "dungeon", parent: "Terra" },
  { title: "Torre di Enoch", kind: "city", parent: "Terra" },
  { title: "Ankheet", kind: "city", parent: "Terra" },
  { title: "Cittadella dei Folletti", kind: "region", parent: "Terra" },
  { title: "Quel'Thalas", kind: "city", parent: "Terra" },
  { title: "Isola di Capitan Cork", kind: "region", parent: "Terra" },
];

async function storeMapImage(asset: MapAsset): Promise<string> {
  const bytes = await readFile(
    path.join(process.cwd(), "public", "maps", asset.file)
  );
  return defaultMapImageStore.put(bytes, "image/jpeg");
}

async function findExisting(
  title: string,
  kind: string
): Promise<number | null> {
  const existing = await prisma.poi.findFirst({
    where: { title, kind },
    select: { id: true },
  });
  return existing?.id ?? null;
}

async function createNavigablePlace(params: {
  title: string;
  kind: PlaceKind;
  parentId: number | null;
  asset: MapAsset | null;
}): Promise<number> {
  const existingId = await findExisting(params.title, params.kind);
  if (existingId !== null) return existingId;

  const mapImage = params.asset ? await storeMapImage(params.asset) : null;

  const created = await prisma.poi.create({
    data: {
      title: params.title,
      kind: params.kind,
      parentId: params.parentId,
      mapImage,
      mapInitialZoom: params.asset?.initialZoom ?? null,
      // `Json?` columns: Prisma rejects a plain `null` here (ambiguous
      // between "JSON null" and "SQL NULL") unless the field is simply
      // omitted, which leaves it NULL — exactly what a mapless place needs.
      ...(params.asset && {
        mapBounds: params.asset.bounds,
        mapInitialView: params.asset.initialView,
      }),
    },
    select: { id: true },
  });
  console.log(`  created ${params.kind} "${params.title}" (id ${created.id})`);
  return created.id;
}

async function createLeafPlace(params: {
  title: string;
  kind: PlaceKind;
  parentId: number;
}): Promise<number> {
  const existingId = await findExisting(params.title, params.kind);
  if (existingId !== null) return existingId;

  const created = await prisma.poi.create({
    data: {
      title: params.title,
      kind: params.kind,
      parentId: params.parentId,
    },
    select: { id: true },
  });
  console.log(`  created ${params.kind} "${params.title}" (id ${created.id})`);
  return created.id;
}

async function main() {
  const existingRoot = await prisma.poi.findFirst({
    where: { kind: "region", parentId: null },
    select: { id: true, title: true },
  });
  if (existingRoot && existingRoot.title !== "Piani di Esistenza") {
    console.error(
      `A root place already exists ("${existingRoot.title}", id ${existingRoot.id}) ` +
        "and is not this migration's own root. Refusing to proceed — the tree " +
        "already has a DM-created world, which this script must not touch."
    );
    process.exit(1);
  }

  console.log("Seeding the map chain (root -> Terra -> Kang -> Skreebars)...");
  const rootId = await createNavigablePlace({
    title: "Piani di Esistenza",
    kind: "region",
    parentId: null,
    asset: ROOT_MAP,
  });

  const planeIds = new Map<string, number>();
  for (const name of PLANES) {
    const id = await createNavigablePlace({
      title: name,
      kind: "plane",
      parentId: rootId,
      asset: name === "Terra" ? TERRA_MAP : null,
    });
    planeIds.set(name, id);
  }

  const terraId = planeIds.get("Terra");
  if (terraId === undefined) throw new Error("Terra plane was not created");

  const kangId = await createNavigablePlace({
    title: "Regno di Kang",
    kind: "region",
    parentId: terraId,
    asset: KANG_MAP,
  });

  const skreebarsId = await createNavigablePlace({
    title: "Skreebars",
    kind: "city",
    parentId: kangId,
    asset: SKREEBARS_MAP,
  });

  console.log(`Seeding the ${LOCATIONS.length} named locations...`);
  for (const location of LOCATIONS) {
    const parentId = planeIds.get(location.parent) ?? terraId;
    await createLeafPlace({
      title: location.title,
      kind: location.kind,
      parentId,
    });
  }

  console.log(
    `Done. Root id ${rootId}, ${planeIds.size} planes, Kang id ${kangId}, ` +
      `Skreebars id ${skreebarsId}, ${LOCATIONS.length} locations.`
  );
}

main()
  .catch((error: unknown) => {
    console.error("T3 world-tree migration failed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
