import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import magicitems from "./initial-data/magicitems";
import deities from "./initial-data/deities";
import npc from "./initial-data/npc";
import spells from "./initial-data/spells";
import ListItem from "../lib/definitions/interfaces/ListItem";
import DBMagicItem from "../lib/definitions/interfaces/magicitem/DBMagicItem";
import DBDeities from "../lib/definitions/interfaces/deities/DBDeities";
import DBNpcItem from "../lib/definitions/interfaces/npc/DBNpcItem";
import DBSpell from "../lib/definitions/interfaces/spells/DBSpell";
import users from "./initial-data/users";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

/**
 * The seed data carries **no ids** (TD-28). Records to be created should get
 * their id the same way a record created through the UI does — from the
 * database. Explicit ids left the `SERIAL` sequences sitting at 1 while ids far
 * above were already taken, because Postgres only advances a sequence when it
 * generates the value itself. The next insert that let the database choose then
 * failed with `Unique constraint failed on the fields: (id)` — not only in
 * scripts but in the app: "Nuova divinità" was unusable on a freshly seeded
 * database.
 *
 * That change costs the old idempotency, which came from `skipDuplicates` on a
 * primary-key collision and worked *only* because the ids were fixed. Re-runs
 * are kept safe by matching on `name` instead, the same rule `db:import` uses.
 */

const toDBObject = (collectionItem: ListItem) =>
  Object.keys(collectionItem).reduce((acc: ListItem, key: string) => {
    acc[key] = collectionItem[key];
    return acc;
  }, {} as ListItem);

/**
 * Written out per domain rather than indexed as `prisma[domain]`: that produces
 * a union of delegates whose signatures are mutually incompatible, and the only
 * way round it is an `any`, which CLAUDE.md rule 3 forbids.
 */
const DOMAINS = [
  {
    label: "magicitems",
    rows: magicitems,
    exists: (name: string) => prisma.magicitems.findFirst({ where: { name } }),
    create: (data: ListItem) =>
      prisma.magicitems.create({ data: data as unknown as DBMagicItem }),
  },
  {
    label: "deities",
    rows: deities,
    exists: (name: string) => prisma.deities.findFirst({ where: { name } }),
    create: (data: ListItem) =>
      prisma.deities.create({ data: data as unknown as DBDeities }),
  },
  {
    label: "npc",
    rows: npc,
    exists: (name: string) => prisma.npc.findFirst({ where: { name } }),
    create: (data: ListItem) =>
      prisma.npc.create({ data: data as unknown as DBNpcItem }),
  },
  {
    label: "spells",
    rows: spells,
    exists: (name: string) => prisma.spells.findFirst({ where: { name } }),
    create: (data: ListItem) =>
      prisma.spells.create({ data: data as unknown as DBSpell }),
  },
] as const;

export async function main() {
  for (const domain of DOMAINS) {
    let created = 0;

    for (const row of domain.rows) {
      const data = toDBObject(row);
      const name = data.name as string;

      if (await domain.exists(name)) continue;

      await domain.create(data);
      created += 1;
    }

    console.log(`  ${domain.label}: ${created} created`);
  }

  // `users` is matched on `email`, which is unique in the schema.
  let createdUsers = 0;

  for (const user of users) {
    const existing = await prisma.users.findUnique({
      where: { email: user.email },
    });

    if (existing) continue;

    await prisma.users.create({ data: user });
    createdUsers += 1;
  }

  console.log(`  users: ${createdUsers} created`);
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
