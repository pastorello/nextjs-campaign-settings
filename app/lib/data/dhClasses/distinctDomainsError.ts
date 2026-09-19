import type FieldErrors from "@/app/lib/definitions/types/FieldErrors";
import fieldError from "@/app/lib/data/validation/fieldError";

/**
 * A class's two domains must differ (SPEC-021 §5, SPEC-018 §5): the field
 * error on the second domain when they do not, else `null`. The table's
 * CHECK (`domainAId <> domainBId`) refuses the same row again; this is what
 * turns the refusal into a field error rather than a database error.
 */
export default function distinctDomainsError(
  domainAId: number | null | undefined,
  domainBId: number | null | undefined
): FieldErrors | null {
  if (domainAId == null || domainBId == null) return null;
  return domainAId === domainBId
    ? { domainBId: [fieldError("domainsMustDiffer")] }
    : null;
}
