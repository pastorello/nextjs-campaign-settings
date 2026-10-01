import buildLocationWhere from "../maps/buildLocationWhere";
import type { RawSearchParams } from "../validateParams";
import type VisibilityScope from "../visibility/VisibilityScope";
import NpcMetaField from "../../definitions/enums/npc/NpcMetaField";

/**
 * The NPC list's filters on top of `getQuery`'s, for the list and its count
 * alike: the location filter (`buildLocationWhere`), and for a player
 * (SPEC-022 T8b) a faction filter matches no one when the faction has not
 * been shown to them, or it would name the faction's members.
 * `factionIds` is `fetchRevealedIds("faction")`: null for the DM.
 */
export default async function buildNpcWhere<
  TWhere extends Record<string, unknown>,
>(
  where: TWhere,
  params: RawSearchParams,
  scope: VisibilityScope,
  factionIds: ReadonlySet<number> | null
): Promise<TWhere> {
  const located = await buildLocationWhere(where, params, scope);
  const faction = located[NpcMetaField.faction];
  if (
    factionIds !== null &&
    typeof faction === "number" &&
    !factionIds.has(faction)
  ) {
    return { ...located, [NpcMetaField.faction]: { in: [] } };
  }
  return located;
}
