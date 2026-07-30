/**
 * Imports a campaign library exported from the app into the database.
 *
 *   pnpm db:import ~/path/to/export-spell-library-2025-11-20.json
 *
 * **Why this is a script and not a seed.** The seed (`app/seed/initial-data/`)
 * is demo data committed to a public repository; a real library is the DM's
 * campaign content, and its spell descriptions are the Italian rulebook text —
 * copyrightable prose that CLAUDE.md is explicit about never committing. So the
 * export file stays on disk, gitignored, and this reads it on demand.
 *
 * **Every record goes through the declared Zod validators**, the same
 * `buildCreateSchema` the Server Actions use. An import is a trust boundary
 * like any other: a hand-edited export must not reach Prisma unchecked, and
 * building the schema from the metadata means this file has no field list of
 * its own to drift out of date.
 *
 * The export keys fields in the app's original Italian camelCase
 * (`tempoDiLancio`, `nome`) — a fixed external contract, since export files
 * already on a DM's disk predate TD-19's identifier rename. The database is
 * now reached through English Prisma field names (`castingTime`, `name`,
 * mapped via Prisma `@map` to the unchanged Italian columns). RENAMES bridges
 * the export's Italian keys to the current internal field names, and is the
 * only translation performed here.
 *
 * Records are matched on `name`, not on the export's `id`: those ids come from
 * whichever database produced the file, and reusing them would collide with
 * whatever the target already holds. Same name means update, otherwise create.
 *
 * The `db:import` script passes `--env-file-if-exists=.env`, and that is not
 * optional: `prisma db seed` is run by the Prisma CLI, which loads `.env`
 * itself, while this runs under tsx, which does not. Loading it from inside
 * this file does not work — ES module imports are hoisted, so the Prisma client
 * is constructed before any statement here executes, and the failure is an
 * opaque `SASL: client password must be a string`.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { Prisma } from "@/generated/prisma/client";

import prisma from "@/app/lib/connections/prisma";
import PageType from "@/app/lib/definitions/types/PageType";
import { buildCreateSchema } from "@/app/lib/data/validation/buildEntitySchema";

/** Export key (Italian, pre-TD-19) → current internal field name (English). */
const RENAMES: Record<string, string> = {
  nome: "name",
  descrizione: "description",
  livello: "level",
  circolo: "circle",
  classi: "classes",
  tempoDiLancio: "castingTime",
  gittata: "range",
  componenti: "components",
  durata: "duration",
  tiroSalvezza: "savingThrow",
  rituale: "ritual",
  concentrazione: "concentration",
  intensificato: "upcast",
  rarita: "rarity",
  tipo: "type",
  sintonia: "attuned",
  titolo: "title",
  allineamento: "alignment",
  dominioAllineamento: "alignmentDomain",
  mansione: "position",
  luogo: "location",
  fazione: "faction",
  aspetto: "appearance",
  personalita: "personality",
  motivazioni: "motivations",
  segreti: "secrets",
};

/**
 * Dropped before validation: `id` belongs to the source database, and
 * `sottoclassi` is the column TD-11 removed — exports predating it still carry
 * the (always empty) field.
 */
const DROPPED = new Set(["id", "sottoclassi"]);

type Row = Record<string, unknown>;

const normalise = (row: Row): Row =>
  Object.fromEntries(
    Object.entries(row)
      .map(([key, value]) => [RENAMES[key] ?? key, value] as const)
      .filter(([column]) => !DROPPED.has(column))
  );

/**
 * One entry per importable domain. Written out rather than indexed as
 * `prisma[domain]`, which produces a union of delegates whose signatures are
 * mutually incompatible — the alternative was an `any`, and CLAUDE.md's rule 3
 * says the count only goes down.
 *
 * `deities` is absent because the export format has no deities section.
 */
const DOMAINS = [
  {
    pageType: PageType.Spell,
    rows: (lib: Library) => lib.spells,
    findByName: (name: string) =>
      prisma.spells.findFirst({ where: { name }, select: { id: true } }),
    update: (id: number, data: Prisma.spellsUpdateInput) =>
      prisma.spells.update({ where: { id }, data }),
    create: (data: Prisma.spellsCreateInput) => prisma.spells.create({ data }),
  },
  {
    pageType: PageType.MagicItem,
    rows: (lib: Library) => lib.magicitems,
    findByName: (name: string) =>
      prisma.magicitems.findFirst({ where: { name }, select: { id: true } }),
    update: (id: number, data: Prisma.magicitemsUpdateInput) =>
      prisma.magicitems.update({ where: { id }, data }),
    create: (data: Prisma.magicitemsCreateInput) =>
      prisma.magicitems.create({ data }),
  },
  {
    pageType: PageType.Npc,
    rows: (lib: Library) => lib.npc,
    findByName: (name: string) =>
      prisma.npc.findFirst({ where: { name }, select: { id: true } }),
    update: (id: number, data: Prisma.npcUpdateInput) =>
      prisma.npc.update({ where: { id }, data }),
    create: (data: Prisma.npcCreateInput) => prisma.npc.create({ data }),
  },
] as const;

interface Library {
  spells?: Row[];
  magicitems?: Row[];
  npc?: Row[];
}

type DomainSpec = (typeof DOMAINS)[number];

async function importDomain(spec: DomainSpec, rows: Row[], dryRun: boolean) {
  const schema = buildCreateSchema(spec.pageType);
  let created = 0;
  let updated = 0;
  const rejected: string[] = [];

  for (const raw of rows) {
    const candidate = normalise(raw);
    const result = schema.safeParse(candidate);

    if (!result.success) {
      const fields = Object.keys(result.error.flatten().fieldErrors).join(", ");
      const name =
        typeof candidate.name === "string" ? candidate.name : "<senza nome>";
      rejected.push(`${name} (${fields})`);
      continue;
    }

    // The one assertion in this file, and it is asserting something that has
    // just been checked rather than assumed: `buildCreateSchema` composes its
    // shape from the metadata at runtime, so Zod infers `ZodRawShape` and
    // cannot hand back a Prisma input type. The validation above is real; only
    // the compiler's view of it is lossy.
    const data = result.data as Prisma.spellsCreateInput &
      Prisma.magicitemsCreateInput &
      Prisma.npcCreateInput;
    const name = data.name;

    if (dryRun) {
      created += 1;
      continue;
    }

    // `name` is not unique in the schema, so this cannot be a Prisma upsert.
    const existing = await spec.findByName(name);

    if (existing) {
      await spec.update(existing.id, data);
      updated += 1;
    } else {
      await spec.create(data);
      created += 1;
    }
  }

  const verb = dryRun
    ? "would import"
    : `${created} created, ${updated} updated`;
  console.log(`  ${spec.pageType}: ${dryRun ? `${verb} ${created}` : verb}`);

  if (rejected.length > 0) {
    console.log(`    ${rejected.length} rejected by validation:`);
    for (const line of rejected.slice(0, 10)) console.log(`      - ${line}`);
    if (rejected.length > 10) {
      console.log(`      … and ${rejected.length - 10} more`);
    }
  }

  return rejected.length;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const path = args.find((arg) => !arg.startsWith("--"));

  if (!path) {
    console.error(
      "Usage: pnpm db:import <path-to-export.json> [--dry-run]\n" +
        "The file is read, never written, and never copied into the repo."
    );
    process.exit(1);
  }

  const parsed: unknown = JSON.parse(readFileSync(resolve(path), "utf8"));

  if (typeof parsed !== "object" || parsed === null) {
    console.error("Expected a JSON object keyed by domain.");
    process.exit(1);
  }

  const library = parsed as Library;

  console.log(
    `${dryRun ? "Validating" : "Importing"} ${resolve(path)}${
      dryRun ? " (no writes)" : ""
    }`
  );

  let rejected = 0;

  for (const spec of DOMAINS) {
    const rows = spec.rows(library);

    if (!Array.isArray(rows)) {
      console.log(`  ${spec.pageType}: absent from the export, skipped`);
      continue;
    }

    rejected += await importDomain(spec, rows, dryRun);
  }

  if (rejected > 0) process.exit(1);
}

main()
  .catch((error: unknown) => {
    console.error("Import failed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
