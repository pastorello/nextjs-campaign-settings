/**
 * The Prisma write for a record's reveals (SPEC-022 T6). On create, connect
 * the given campaigns; on update, replace the set. Absent ids write nothing,
 * so an update that does not touch the field leaves the reveals as they are.
 */
export function revealedToCreate(ids: number[] | undefined) {
  return ids && ids.length > 0
    ? { revealedTo: { connect: ids.map((id) => ({ id })) } }
    : {};
}

export function revealedToUpdate(ids: number[] | undefined) {
  return ids === undefined
    ? {}
    : { revealedTo: { set: ids.map((id) => ({ id })) } };
}
