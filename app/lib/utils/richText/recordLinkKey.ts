import type RecordLinkDomain from "@/app/lib/definitions/types/RecordLinkDomain";

/** The `RecordLinkTargets` key of one record: `"npc:42"`. */
export default function recordLinkKey(
  domain: RecordLinkDomain,
  id: number
): string {
  return `${domain}:${id}`;
}
