import DhEnvironmentMetaField from "@/app/lib/definitions/enums/daggerheart/DhEnvironmentMetaField";

/** The id `getQuery`'s `hasSome` filter names, or null when it holds none. */
function filteredId(condition: unknown): number | null {
  if (typeof condition !== "object" || condition === null) return null;
  const values = (condition as { hasSome?: unknown }).hasSome;
  const id = Array.isArray(values) ? Number(values[0]) : NaN;
  return Number.isInteger(id) && id > 0 ? id : null;
}

/**
 * The environment list's place filter (SPEC-028 §5.2), for the list and
 * its count alike. `getQuery` reads an array field as a scalar list
 * (`hasSome`); an environment's places are a relation, so this turns the
 * filter into a `some` relation filter, as `buildDhCommunityWhere` does.
 */
export default function buildDhEnvironmentWhere(
  where: Record<string, unknown>
): Record<string, unknown> {
  const { [DhEnvironmentMetaField.placeIds]: placeFilter, ...rest } = where;
  const placeId = filteredId(placeFilter);
  return {
    ...rest,
    ...(placeId !== null && { places: { some: { id: placeId } } }),
  };
}
