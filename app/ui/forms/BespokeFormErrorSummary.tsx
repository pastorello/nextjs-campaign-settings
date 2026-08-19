import { useTranslations } from "next-intl";

import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";

interface BespokeFormErrorSummaryProps {
  /** Zod's field-keyed error map, as returned by a failed MutationResult. */
  errors: Record<string, string[] | undefined>;
  /** The domain's own meta record — `campaignMeta`, `adventureMeta`, … */
  meta: Record<string, PageMeta>;
}

/**
 * `FormErrorSummary`'s pair for a domain outside the metadata layer
 * (ADR-0011). `FormErrorSummary` resolves a field's label through the
 * global `fieldMeta` registry, which `campaign`/`adventure`/`scene`/
 * `sceneCreature`/`loot` never join — looking a field like `title` up there
 * silently returns whichever *other* domain happens to declare that key,
 * not the one actually being edited. This takes the meta record directly
 * from the caller instead.
 */
export default function BespokeFormErrorSummary({
  errors,
  meta,
}: BespokeFormErrorSummaryProps) {
  const t = useTranslations();
  const entries = Object.entries(errors).filter(
    ([, messages]) => messages && messages.length > 0
  );

  if (entries.length === 0) return null;

  return (
    <div
      role="alert"
      className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800"
    >
      <p className="font-medium">{t("common.formErrors.title")}</p>
      <ul className="mt-1 list-inside list-disc">
        {entries.map(([field, messages]) => (
          <li key={field}>
            <span className="font-medium">
              {meta[field]?.labelKey ? t(meta[field].labelKey) : field}
            </span>
            {": "}
            {messages?.join(", ")}
          </li>
        ))}
      </ul>
    </div>
  );
}
