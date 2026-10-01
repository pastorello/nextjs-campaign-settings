import recordImageKeysInclude from "@/app/lib/data/recordImages/recordImageKeysInclude";

/**
 * What an environment read includes (SPEC-028 T3): its image keys, its
 * potential adversaries and places named for the stat block, and its
 * features in order for the block and the inline editor.
 * `withEnvironmentLinks` flattens the relations.
 */
const dhEnvironmentInclude = {
  ...recordImageKeysInclude,
  adversaries: {
    select: { adversary: { select: { id: true, name: true } } },
    orderBy: { adversary: { name: "asc" } },
  },
  places: { select: { id: true, title: true }, orderBy: { title: "asc" } },
  features: { orderBy: { position: "asc" } },
} as const;

export default dhEnvironmentInclude;
