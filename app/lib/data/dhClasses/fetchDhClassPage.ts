import { z } from "zod";

import PageType from "@/app/lib/definitions/types/PageType";
import DhClass from "@/app/lib/definitions/interfaces/daggerheart/DhClass";
import DhClassPage from "@/app/lib/definitions/interfaces/daggerheart/DhClassPage";
import DhDomainCard from "@/app/lib/definitions/interfaces/daggerheart/DhDomainCard";
import DhDomainCardDomain from "@/app/lib/definitions/interfaces/daggerheart/DhDomainCardDomain";
import DhSubclass from "@/app/lib/definitions/interfaces/daggerheart/DhSubclass";
import DhSubclassFeature from "@/app/lib/definitions/interfaces/daggerheart/DhSubclassFeature";
import DatabaseError from "@/app/lib/errors/DatabaseError";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import prisma from "../../connections/prisma";
import { buildResultSchema } from "../validation/buildEntitySchema";
import dhDomainCardDomainSchema, {
  dhDomainCardDomainSelect,
} from "../validation/dhDomainCardDomainSchema";

const byPosition = { orderBy: { position: "asc" } } as const;

/**
 * One class and everything its page shows (SPEC-021 §5.4, T6), or `null`
 * when there is no such class: two reads — the class with its features,
 * domains and subclasses, then the two domains' cards.
 *
 * Features are not fields, so the result schemas would strip them; they are
 * put back beside each parsed row, as `fetchFilteredDhClasses` does.
 */
export default async function fetchDhClassPage(
  id: number
): Promise<DhClassPage | null> {
  let row;
  try {
    row = await prisma.dhClass.findUnique({
      where: { id },
      include: {
        features: byPosition,
        domainA: { select: dhDomainCardDomainSelect },
        domainB: { select: dhDomainCardDomainSelect },
        subclasses: {
          orderBy: { name: "asc" },
          include: { features: byPosition },
        },
      },
    });
  } catch (error) {
    throw toDatabaseError("fetching class page", error);
  }

  if (!row) return null;

  let cardRows;
  try {
    cardRows = await prisma.dhDomainCard.findMany({
      where: { domainId: { in: [row.domainAId, row.domainBId] } },
      include: { domain: { select: dhDomainCardDomainSelect } },
      orderBy: [{ cardLevel: "asc" }, { domainId: "asc" }, { name: "asc" }],
    });
  } catch (error) {
    throw toDatabaseError("fetching class page cards", error);
  }

  const dhClass = buildResultSchema(PageType.DhClass).safeParse(row);
  if (!dhClass.success) {
    throw new DatabaseError("validating fetched class", dhClass.error);
  }
  const domains = z
    .array(dhDomainCardDomainSchema)
    .safeParse([row.domainA, row.domainB]);
  if (!domains.success) {
    throw new DatabaseError("validating fetched class domains", domains.error);
  }
  const subclasses = z
    .array(buildResultSchema(PageType.DhSubclass))
    .safeParse(row.subclasses);
  if (!subclasses.success) {
    throw new DatabaseError("validating fetched subclasses", subclasses.error);
  }
  const cards = z
    .array(
      buildResultSchema(PageType.DhDomainCard).extend({
        domain: dhDomainCardDomainSchema,
      })
    )
    .safeParse(cardRows);
  if (!cards.success) {
    throw new DatabaseError("validating fetched class cards", cards.error);
  }

  // The schemas are built from runtime field lists, so their output types
  // are widened; these assertions narrow them back.
  return {
    dhClass: {
      ...(dhClass.data as unknown as DhClass),
      features: row.features,
    },
    domains: domains.data,
    subclasses: (subclasses.data as unknown as DhSubclass[]).map(
      (subclass, index) => ({
        ...subclass,
        // `tier` is a raw `String` column; the vocabulary is enforced on write.
        features: (row.subclasses[index]?.features ??
          []) as DhSubclassFeature[],
      })
    ),
    cards: cards.data as unknown as (DhDomainCard & {
      domain: DhDomainCardDomain;
    })[],
  };
}
