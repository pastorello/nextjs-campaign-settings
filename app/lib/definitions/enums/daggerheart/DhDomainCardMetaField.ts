/**
 * A domain card's fields (SPEC-021 T3). `cardLevel` and `cardType` are the
 * `level` and `type` columns (Prisma `@map`): the metadata layer's keys are
 * one namespace, and spells' `level` and magic items' `type` hold those names.
 */
enum DhDomainCardMetaField {
  name = "name",
  domainId = "domainId",
  cardLevel = "cardLevel",
  recallCost = "recallCost",
  cardType = "cardType",
  featureText = "featureText",
  origin = "origin",
}

export default DhDomainCardMetaField;
