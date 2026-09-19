import RecordLinkDomain, {
  isRecordLinkDomain,
} from "@/app/lib/definitions/types/RecordLinkDomain";
import {
  RECORD_DOMAIN_ATTRIBUTE,
  RECORD_ID_ATTRIBUTE,
} from "./richTextAllowlist";

export interface RecordLinkRef {
  domain: RecordLinkDomain;
  id: number;
}

/** Postgres `integer`'s ceiling: every linked table's id is one. */
const MAX_RECORD_ID = 2_147_483_647;

/**
 * Reads a record link off an anchor's attributes (ADR-0016): a known domain
 * and a positive integer id written in plain decimal digits. Anything else —
 * an unknown domain, `"4.2"`, `"1e3"`, `"042"`, a value past `integer` — is
 * not a link, and the sanitiser unwraps the anchor.
 */
export default function parseRecordLink(
  attributes: Readonly<Record<string, string | undefined>>
): RecordLinkRef | null {
  const domain = attributes[RECORD_DOMAIN_ATTRIBUTE];
  const rawId = attributes[RECORD_ID_ATTRIBUTE];
  if (!isRecordLinkDomain(domain)) return null;
  if (rawId === undefined || !/^[1-9][0-9]*$/.test(rawId)) return null;
  const id = Number(rawId);
  if (id > MAX_RECORD_ID) return null;
  return { domain, id };
}
