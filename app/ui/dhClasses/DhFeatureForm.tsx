"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import useMutationSubmit from "@/app/lib/hooks/useMutationSubmit";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import DhFeatureMetaField from "@/app/lib/definitions/enums/daggerheart/DhFeatureMetaField";
import DhSubclassFeatureTier from "@/app/lib/definitions/enums/daggerheart/DhSubclassFeatureTier";
import dhSubclassFeatureMeta from "@/app/lib/config/daggerheart/dhSubclassFeatureMeta";
import dhSubclassFeatureTiers from "@/app/lib/config/daggerheart/dh-subclass-feature-tiers";
import resolveOptions from "@/app/lib/utils/data/resolveOptions";
import TextInput from "@/app/ui/forms/inputs/TextInput";
import RichTextInput from "@/app/ui/forms/inputs/RichTextInput";
import Select from "@/app/ui/forms/inputs/Select";
import BespokeFormErrorSummary from "@/app/ui/forms/BespokeFormErrorSummary";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";
import ButtonState from "@/app/ui/buttons/BaseButton/ButtonState";

export interface DhFeatureValues {
  name: string;
  text: string;
  tier: DhSubclassFeatureTier;
}

interface DhFeatureFormProps {
  initial?: Partial<DhFeatureValues> | undefined;
  /** A subclass's features carry a tier; a class's do not. */
  withTier?: boolean;
  save: (values: DhFeatureValues) => Promise<MutationResult>;
  submitLabel: string;
  onCancel: () => void;
  onSaved: () => void;
}

/**
 * Adds or edits one class or subclass feature inline (SPEC-021 §5.4/§5.5,
 * ADR-0011): a name and formatted text, plus the tier for a subclass's.
 * Labels and validators come from `dhSubclassFeatureMeta`, which holds the
 * class feature's three fields and the tier; the caller's `save` supplies
 * the owner and the position.
 */
export default function DhFeatureForm({
  initial,
  withTier = false,
  save,
  submitLabel,
  onCancel,
  onSaved,
}: DhFeatureFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const meta = dhSubclassFeatureMeta;

  const [name, setName] = useState(initial?.name ?? "");
  const [text, setText] = useState(initial?.text ?? "");
  const [tier, setTier] = useState<DhSubclassFeatureTier>(
    initial?.tier ?? DhSubclassFeatureTier.Foundation
  );
  const { errors, isSaving, submit } = useMutationSubmit();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved = await submit(() => save({ name, text, tier }));
    if (!saved) return;

    router.refresh();
    onSaved();
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
      <BespokeFormErrorSummary errors={errors} meta={meta} />
      {withTier && (
        <Select
          label={t(meta[DhFeatureMetaField.tier].labelKey)}
          value={tier}
          options={resolveOptions(dhSubclassFeatureTiers, t)}
          onChange={(value) => setTier(value as DhSubclassFeatureTier)}
        />
      )}
      <TextInput
        label={t(meta[DhFeatureMetaField.name].labelKey)}
        value={name}
        onChange={(value) => setName(String(value))}
      />
      <RichTextInput
        label={t(meta[DhFeatureMetaField.text].labelKey)}
        value={text}
        onChange={(value) => setText(String(value))}
      />
      <div className="flex justify-end gap-2">
        <BaseButton
          buttonState={isSaving ? ButtonState.Loading : ButtonState.Default}
        >
          {submitLabel}
        </BaseButton>
        <BaseButton
          onClick={onCancel}
          variant={ButtonVariant.secondary}
          buttonState={isSaving ? ButtonState.Disabled : ButtonState.Default}
        >
          {t("common.form.cancel")}
        </BaseButton>
      </div>
    </form>
  );
}
