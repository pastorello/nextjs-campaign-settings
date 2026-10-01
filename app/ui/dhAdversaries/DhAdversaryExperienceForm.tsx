"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import useMutationSubmit from "@/app/lib/hooks/useMutationSubmit";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import DhStatBlockRowField from "@/app/lib/definitions/enums/daggerheart/DhStatBlockRowField";
import { dhAdversaryExperienceMeta } from "@/app/lib/config/daggerheart/dhStatBlockRowMetas";
import TextInput from "@/app/ui/forms/inputs/TextInput";
import BespokeFormErrorSummary from "@/app/ui/forms/BespokeFormErrorSummary";
import InlineRowFormButtons from "@/app/ui/daggerheart/InlineRowFormButtons";

export interface ExperienceValues {
  name: string;
  /** As typed: the action coerces and checks it. */
  bonus: string;
}

/** Adds or edits one adversary experience inline (SPEC-028 §5). */
export default function DhAdversaryExperienceForm({
  initial,
  save,
  submitLabel,
  onDone,
}: {
  initial?: { name: string; bonus: number } | undefined;
  save: (values: ExperienceValues) => Promise<MutationResult>;
  submitLabel: string;
  onDone: () => void;
}) {
  const t = useTranslations();
  const router = useRouter();
  const meta = dhAdversaryExperienceMeta;

  const [name, setName] = useState(initial?.name ?? "");
  const [bonus, setBonus] = useState(
    String(initial?.bonus ?? meta[DhStatBlockRowField.bonus].defaultValue)
  );
  const { errors, isSaving, submit } = useMutationSubmit();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved = await submit(() => save({ name, bonus }));
    if (!saved) return;

    router.refresh();
    onDone();
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
      <BespokeFormErrorSummary errors={errors} meta={meta} />
      <TextInput
        label={t(meta[DhStatBlockRowField.name].labelKey)}
        value={name}
        onChange={(value) => setName(String(value))}
      />
      <TextInput
        label={t(meta[DhStatBlockRowField.bonus].labelKey)}
        value={bonus}
        onChange={(value) => setBonus(String(value))}
      />
      <InlineRowFormButtons
        submitLabel={submitLabel}
        isSaving={isSaving}
        onCancel={onDone}
      />
    </form>
  );
}
