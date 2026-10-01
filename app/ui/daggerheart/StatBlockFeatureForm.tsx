"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import useMutationSubmit from "@/app/lib/hooks/useMutationSubmit";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import DhFeatureKind from "@/app/lib/definitions/enums/daggerheart/DhFeatureKind";
import DhStatBlockRowField from "@/app/lib/definitions/enums/daggerheart/DhStatBlockRowField";
import {
  dhAdversaryFeatureMeta,
  dhEnvironmentFeatureMeta,
} from "@/app/lib/config/daggerheart/dhStatBlockRowMetas";
import dhFeatureKinds from "@/app/lib/config/daggerheart/dhFeatureKinds";
import resolveOptions from "@/app/lib/utils/data/resolveOptions";
import TextInput from "@/app/ui/forms/inputs/TextInput";
import RichTextInput from "@/app/ui/forms/inputs/RichTextInput";
import CheckboxInput from "@/app/ui/forms/inputs/CheckboxInput";
import Select from "@/app/ui/forms/inputs/Select";
import BespokeFormErrorSummary from "@/app/ui/forms/BespokeFormErrorSummary";

import InlineRowFormButtons from "./InlineRowFormButtons";

export interface StatBlockFeatureValues {
  kind: DhFeatureKind;
  fear: boolean;
  name: string;
  text: string;
  questions: string;
}

/**
 * Adds or edits one stat block feature inline (SPEC-028 §5, ADR-0011): its
 * kind, name and formatted text, plus the Fear flag on an adversary's and
 * the prompt questions on an environment's. Labels and validators come from
 * the row's meta; the caller's `save` supplies the owner and the position.
 */
export default function StatBlockFeatureForm({
  owner,
  initial,
  save,
  submitLabel,
  onDone,
}: {
  owner: "adversary" | "environment";
  initial?: Partial<StatBlockFeatureValues> | undefined;
  save: (values: StatBlockFeatureValues) => Promise<MutationResult>;
  submitLabel: string;
  onDone: () => void;
}) {
  const t = useTranslations();
  const router = useRouter();
  const meta =
    owner === "adversary" ? dhAdversaryFeatureMeta : dhEnvironmentFeatureMeta;

  const [kind, setKind] = useState<DhFeatureKind>(
    initial?.kind ?? DhFeatureKind.Action
  );
  const [fear, setFear] = useState(initial?.fear ?? false);
  const [name, setName] = useState(initial?.name ?? "");
  const [text, setText] = useState(initial?.text ?? "");
  const [questions, setQuestions] = useState(initial?.questions ?? "");
  const { errors, isSaving, submit } = useMutationSubmit();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved = await submit(() =>
      save({ kind, fear, name, text, questions })
    );
    if (!saved) return;

    router.refresh();
    onDone();
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
      <BespokeFormErrorSummary errors={errors} meta={meta} />
      <Select
        label={t(meta[DhStatBlockRowField.kind].labelKey)}
        value={kind}
        options={resolveOptions(dhFeatureKinds, t)}
        onChange={(value) => setKind(value as DhFeatureKind)}
      />
      {owner === "adversary" && (
        <CheckboxInput
          label={t(dhAdversaryFeatureMeta[DhStatBlockRowField.fear].labelKey)}
          value={fear}
          onChange={(value) => setFear(value === true)}
        />
      )}
      <TextInput
        label={t(meta[DhStatBlockRowField.name].labelKey)}
        value={name}
        onChange={(value) => setName(String(value))}
      />
      <RichTextInput
        label={t(meta[DhStatBlockRowField.text].labelKey)}
        value={text}
        onChange={(value) => setText(String(value))}
      />
      {owner === "environment" && (
        <RichTextInput
          label={t(
            dhEnvironmentFeatureMeta[DhStatBlockRowField.questions].labelKey
          )}
          value={questions}
          onChange={(value) => setQuestions(String(value))}
        />
      )}
      <InlineRowFormButtons
        submitLabel={submitLabel}
        isSaving={isSaving}
        onCancel={onDone}
      />
    </form>
  );
}
