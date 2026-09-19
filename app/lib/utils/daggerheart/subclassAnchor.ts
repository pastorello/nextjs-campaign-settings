/**
 * The fragment a subclass has on its class's page (SPEC-021 T6) — the id of
 * its heading there, and where a link to the subclass lands.
 */
export default function subclassAnchor(id: number): string {
  return `subclass-${id}`;
}
