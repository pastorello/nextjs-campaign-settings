import { Prisma, PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import magicitems from "./initial-data/magicitems";
import deities from "./initial-data/deities";
import png from "./initial-data/png";
import spells from "./initial-data/spells";
import ListItem from "../lib/definitions/interfaces/ListItem";
import DBMagicItem from "../lib/definitions/interfaces/magicitem/DBMagicItem";
import DBDeities from "../lib/definitions/interfaces/deities/DBDeities";
import DBPngItem from "../lib/definitions/interfaces/png/DBPngItem";
import DBSpell from "../lib/definitions/interfaces/spells/DBSpell";
import users from "./initial-data/users";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const magicItems: Prisma.magicitemsCreateInput[] = magicitems;

const toDBObject = (collectionItem: ListItem) => {
  const result = Object.keys(collectionItem).reduce(
    (acc: ListItem, key: string) => {
      const parsedKey = key.toLowerCase();
      acc[parsedKey] = collectionItem[key];
      return acc;
    },
    {} as ListItem
  );
  return result;
};

export async function main() {
  for (const u of magicItems) {
    await prisma.magicitems.createMany({
      data: toDBObject(u) as DBMagicItem,
      skipDuplicates: true,
    });
  }
  for (const u of deities) {
    await prisma.deities.createMany({
      data: toDBObject(u) as DBDeities,
      skipDuplicates: true,
    });
  }
  for (const u of png) {
    await prisma.png.createMany({
      data: toDBObject(u) as DBPngItem,
      skipDuplicates: true,
    });
  }
  for (const u of spells) {
    await prisma.spells.createMany({
      data: toDBObject(u) as DBSpell,
      skipDuplicates: true,
    });
  }
  for (const u of users) {
    await prisma.users.createMany({
      data: toDBObject(u) as DBUser,
      skipDuplicates: true,
    });
  }
}

main();
