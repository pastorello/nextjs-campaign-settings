import prisma from "@/app/lib/connections/prisma";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import { OptionTableName } from "@/app/lib/definitions/interfaces/meta/PageMeta";
import { ResolvedOption } from "@/app/lib/definitions/types/SelectOption";
import getVisibilityScope from "@/app/lib/data/visibility/getVisibilityScope";
import revealedWhere from "@/app/lib/data/visibility/revealedWhere";

/**
 * Reads a table-backed field's rows and maps them to the shape the metadata
 * layer already speaks. Returns `ResolvedOption`, not `SelectOption`: a row's
 * `name` is already the display string — content, like `zone.title` — so this
 * skips `resolveOptions`' translator step entirely (ADR-0007's boundary
 * holding, not being bypassed: content has no message key to resolve).
 *
 * Under the reader's scope (SPEC-022 T8b, R7): a player is offered only the
 * places and records their campaign has been shown, the rules catalogues in
 * full, and none of the DM's prep (treasures, campaigns, adversaries).
 * Otherwise a secret place's name would sit in a filter's list.
 */
export default async function fetchFieldOptions(
  table: OptionTableName
): Promise<ResolvedOption<number>[]> {
  const scope = await getVisibilityScope();
  // Spread into the four revealed tables' reads: nothing for the DM.
  const revealed = scope.kind === "campaign" && {
    where: revealedWhere(scope),
  };
  if (
    scope.kind === "campaign" &&
    (table === "treasure" ||
      table === "campaign" ||
      table === "dnd5eCampaign" ||
      table === "dhAdversary" ||
      table === "dhLoot")
  ) {
    return [];
  }

  switch (table) {
    case "faction": {
      let rows;
      try {
        rows = await prisma.faction.findMany({
          ...revealed,
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        });
      } catch (error) {
        throw toDatabaseError("fetching faction options", error);
      }

      return rows.map((row) => ({ value: row.id, label: row.name }));
    }
    case "zone": {
      let rows;
      try {
        rows = await prisma.zone.findMany({
          ...(scope.kind === "campaign" && {
            where: { id: { in: [...scope.zones] } },
          }),
          select: { id: true, title: true },
          orderBy: { title: "asc" },
        });
      } catch (error) {
        throw toDatabaseError("fetching zone options", error);
      }

      return rows.map((row) => ({ value: row.id, label: row.title }));
    }
    case "npc": {
      let rows;
      try {
        rows = await prisma.npc.findMany({
          ...revealed,
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        });
      } catch (error) {
        throw toDatabaseError("fetching npc options", error);
      }

      return rows.map((row) => ({ value: row.id, label: row.name }));
    }
    case "deities": {
      let rows;
      try {
        rows = await prisma.deities.findMany({
          ...revealed,
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        });
      } catch (error) {
        throw toDatabaseError("fetching deity options", error);
      }

      return rows.map((row) => ({ value: row.id, label: row.name }));
    }
    case "magicitems": {
      let rows;
      try {
        rows = await prisma.magicitems.findMany({
          ...revealed,
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        });
      } catch (error) {
        throw toDatabaseError("fetching magicitems options", error);
      }

      return rows.map((row) => ({ value: row.id, label: row.name }));
    }
    case "treasure": {
      let rows;
      try {
        rows = await prisma.treasure.findMany({
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        });
      } catch (error) {
        throw toDatabaseError("fetching treasure options", error);
      }

      return rows.map((row) => ({ value: row.id, label: row.name }));
    }
    case "dhDomain": {
      let rows;
      try {
        rows = await prisma.dhDomain.findMany({
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        });
      } catch (error) {
        throw toDatabaseError("fetching domain options", error);
      }

      return rows.map((row) => ({ value: row.id, label: row.name }));
    }
    case "dhClass": {
      let rows;
      try {
        rows = await prisma.dhClass.findMany({
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        });
      } catch (error) {
        throw toDatabaseError("fetching dhClass options", error);
      }

      return rows.map((row) => ({ value: row.id, label: row.name }));
    }
    // SPEC-028: an environment's potential adversaries.
    case "dhAdversary": {
      let rows;
      try {
        rows = await prisma.dhAdversary.findMany({
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        });
      } catch (error) {
        throw toDatabaseError("fetching dhAdversary options", error);
      }

      return rows.map((row) => ({ value: row.id, label: row.name }));
    }
    // SPEC-030: a Daggerheart loot row's catalogue links.
    case "dhWeapon":
    case "dhArmor":
    case "dhLoot": {
      const read = {
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      } as const;
      let rows;
      try {
        rows =
          table === "dhWeapon"
            ? await prisma.dhWeapon.findMany(read)
            : table === "dhArmor"
              ? await prisma.dhArmor.findMany(read)
              : await prisma.dhLoot.findMany(read);
      } catch (error) {
        throw toDatabaseError(`fetching ${table} options`, error);
      }

      return rows.map((row) => ({ value: row.id, label: row.name }));
    }
    // SPEC-022 T6: the campaigns a record can be revealed to.
    case "campaign":
    case "dnd5eCampaign": {
      let rows;
      try {
        rows = await prisma.campaign.findMany({
          ...(table === "dnd5eCampaign" && { where: { system: "dnd5e" } }),
          select: { id: true, title: true },
          orderBy: [{ title: "asc" }, { id: "asc" }],
        });
      } catch (error) {
        throw toDatabaseError("fetching campaign options", error);
      }

      return rows.map((row) => ({ value: row.id, label: row.title }));
    }
  }
}
