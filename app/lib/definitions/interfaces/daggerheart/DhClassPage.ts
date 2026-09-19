import type DhClass from "./DhClass";
import type DhClassFeature from "./DhClassFeature";
import type DhDomainCard from "./DhDomainCard";
import type DhDomainCardDomain from "./DhDomainCardDomain";
import type DhSubclass from "./DhSubclass";
import type DhSubclassFeature from "./DhSubclassFeature";

/**
 * Everything a class's page shows (SPEC-021 §5.4, T6): the class with its
 * features in order, its two domains, its subclasses with their features, and
 * every card of the two domains, each carrying the domain its card view draws.
 */
interface DhClassPage {
  dhClass: DhClass & { features: DhClassFeature[] };
  /** The first and second domain, in that order. */
  domains: DhDomainCardDomain[];
  /** By name, each with its features in position order. */
  subclasses: (DhSubclass & { features: DhSubclassFeature[] })[];
  /** Both domains' cards, by level, then domain, then name. */
  cards: (DhDomainCard & { domain: DhDomainCardDomain })[];
}

export default DhClassPage;
