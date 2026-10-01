import recordImageKeysInclude from "@/app/lib/data/recordImages/recordImageKeysInclude";

/**
 * What a community read includes (SPEC-027 T3): its image keys and its
 * linked places and factions, named for the card. `withCommunityLinks`
 * turns the relations into the form's id lists.
 */
const dhCommunityLinksInclude = {
  ...recordImageKeysInclude,
  places: { select: { id: true, title: true }, orderBy: { title: "asc" } },
  factions: { select: { id: true, name: true }, orderBy: { name: "asc" } },
} as const;

export default dhCommunityLinksInclude;
