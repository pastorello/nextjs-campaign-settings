import { useTranslations } from "next-intl";

import { fieldMeta } from "@/app/lib/config/pageMetaFields";
import type FieldErrors from "@/app/lib/definitions/types/FieldErrors";
import resolveFieldErrors from "@/app/lib/utils/i18n/resolveFieldErrors";

interface FormErrorSummaryProps {
  /** The key-based field errors a failed MutationResult carries (TD-124). */
  errors: FieldErrors;
}

/**
 * Renders the validation errors a mutation rejected a submission with. Field
 * keys are shown using the label already declared in the field's PageMeta, so
 * the user sees "Livello", not "livello"; the messages are catalogue keys,
 * translated here at the render boundary (ADR-0007, TD-124).
 */
export default function FormErrorSummary({ errors }: FormErrorSummaryProps) {
  const t = useTranslations();
  const entries = Object.entries(resolveFieldErrors(errors, t));

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
              {fieldMeta[field]?.labelKey
                ? t(fieldMeta[field].labelKey)
                : field}
            </span>
            {": "}
            {messages.join(", ")}
          </li>
        ))}
      </ul>
    </div>
  );
}
