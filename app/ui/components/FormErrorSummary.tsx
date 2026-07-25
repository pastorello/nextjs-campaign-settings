import { fieldMeta } from "@/app/lib/config/pageMetaFields";

// All user-facing copy for this component, in one place so TD-21 can extract it
// without hunting through JSX.
const COPY = {
  title: "Controlla i campi segnalati:",
};

interface FormErrorSummaryProps {
  /** Zod's field-keyed error map, as returned by a failed MutationResult. */
  errors: Record<string, string[] | undefined>;
}

/**
 * Renders the validation errors a mutation rejected a submission with. Field
 * keys are shown using the label already declared in the field's PageMeta, so
 * the user sees "Livello", not "livello".
 */
export default function FormErrorSummary({ errors }: FormErrorSummaryProps) {
  const entries = Object.entries(errors).filter(
    ([, messages]) => messages && messages.length > 0
  );

  if (entries.length === 0) return null;

  return (
    <div
      role="alert"
      className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800"
    >
      <p className="font-medium">{COPY.title}</p>
      <ul className="mt-1 list-inside list-disc">
        {entries.map(([field, messages]) => (
          <li key={field}>
            <span className="font-medium">
              {fieldMeta[field]?.label ?? field}
            </span>
            {": "}
            {messages?.join(", ")}
          </li>
        ))}
      </ul>
    </div>
  );
}
