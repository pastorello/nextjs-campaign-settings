import { z } from "zod";

import type FieldErrorKey from "@/app/lib/definitions/types/FieldErrorKey";

/** A loot row's catalogue links (SPEC-013 §6, SPEC-030 §6), in form order. */
const LOOT_LINKS = [
  "magicItemId",
  "treasureId",
  "dhWeaponId",
  "dhArmorId",
  "dhLootId",
] as const;

/**
 * A loot row links at most one catalogue record (SPEC-013 §5's edge case,
 * widened to SPEC-030's three): refused on the last link set, with
 * `lootLinksBoth`. The table's CHECK holds the same rule.
 */
export default function refineOneLootLink(
  data: Record<string, unknown>,
  ctx: z.RefinementCtx
): void {
  const set = LOOT_LINKS.filter((key) => data[key] != null);
  const last = set.at(-1);
  if (set.length > 1 && last) {
    ctx.addIssue({
      code: "custom",
      message: "lootLinksBoth" satisfies FieldErrorKey,
      path: [last],
    });
  }
}
