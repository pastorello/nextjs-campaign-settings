import type RecordImageKeys from "@/app/lib/definitions/interfaces/images/RecordImageKeys";

/**
 * What a card view shows of a card's domain (SPEC-021 T3): its name — so the
 * colour is never the only thing naming it — its band colour and its emblem.
 */
interface DhDomainCardDomain {
  id: number;
  name: string;
  colour: string;
  image?: RecordImageKeys | null | undefined;
}

export default DhDomainCardDomain;
