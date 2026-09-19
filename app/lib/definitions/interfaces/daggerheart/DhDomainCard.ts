import type DhDomainCardDomain from "./DhDomainCardDomain";

/**
 * A Daggerheart domain card (SPEC-021 T3). `cardType` and `origin` are
 * `DhDomainCardType` / `DhOrigin` values, kept as `string` for the same
 * reason `DhDomain.colour` is.
 */
interface DhDomainCard {
  id: number;
  name: string;
  domainId: number;
  /** 1–10; the `level` column. */
  cardLevel: number;
  /** Stress to recall it from the vault, ≥ 0. */
  recallCost: number;
  /** The `type` column. */
  cardType: string;
  featureText: string;
  origin: string;
  /** The card's domain, when the read included it. */
  domain?: DhDomainCardDomain | undefined;
}

export default DhDomainCard;
