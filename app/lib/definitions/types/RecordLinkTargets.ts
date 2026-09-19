/**
 * The records formatted-text links on a page may lead to (SPEC-019 T2):
 * `recordLinkKey(domain, id)` → the record's current name. A link whose key is
 * absent renders as plain text — its record was deleted, or it is a catalogue
 * outside the current game system. A plain object rather than a `Map` so a
 * Server Component can hand it to the client tree.
 */
type RecordLinkTargets = Readonly<Record<string, string>>;

export default RecordLinkTargets;
