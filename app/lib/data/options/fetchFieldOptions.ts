import prisma from "@/app/lib/connections/prisma";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import { OptionTableName } from "@/app/lib/definitions/interfaces/meta/PageMeta";
import { ResolvedOption } from "@/app/lib/definitions/types/SelectOption";

/**
 * Reads a table-backed field's rows and maps them to the shape the metadata
 * layer already speaks. Returns `ResolvedOption`, not `SelectOption`: a row's
 * `name` is already the display string — content, like `zone.title` — so this
 * skips `resolveOptions`' translator step entirely (ADR-0007's boundary
 * holding, not being bypassed: content has no message key to resolve).
 */
export default async function fetchFieldOptions(
  table: OptionTableName
): Promise<ResolvedOption<number>[]> {
  switch (table) {
    case "faction": {
      let rows;
      try {
        rows = await prisma.faction.findMany({
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        });
      } catch (error) {
        throw toDatabaseError("fetching faction options", error);
      }

      return rows.map((row) => ({ value: row.id, label: row.name }));
    }
  }
}
