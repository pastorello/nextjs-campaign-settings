/**
 * An environment row's relations as the stat block and the form read them
 * (SPEC-028 T3): its adversaries and places as `{ id, name }`, and the
 * same as the form's id lists. The DM's alone, so nothing is cut for a
 * reader (§9 decision 3).
 */
export default function withEnvironmentLinks<
  T extends {
    adversaries: { adversary: { id: number; name: string } }[];
    places: { id: number; title: string }[];
  },
>(row: T) {
  const adversaries = row.adversaries.map(({ adversary }) => adversary);
  const places = row.places.map(({ id, title }) => ({ id, name: title }));
  return {
    ...row,
    adversaries,
    places,
    environmentAdversaryIds: adversaries.map(({ id }) => id),
    environmentPlaceIds: places.map(({ id }) => id),
  };
}
