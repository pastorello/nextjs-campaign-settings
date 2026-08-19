"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import createAdventure from "@/app/lib/data/campaigns/createAdventure";
import adventureMeta from "@/app/lib/config/campaigns/adventureMeta";
import AdventureMetaField from "@/app/lib/definitions/enums/campaign/AdventureMetaField";
import AdventureStatus from "@/app/lib/definitions/enums/campaign/AdventureStatus";
import Adventure from "@/app/lib/definitions/interfaces/campaign/Adventure";
import TextInput from "@/app/ui/forms/inputs/TextInput";
import BespokeFormErrorSummary from "@/app/ui/forms/BespokeFormErrorSummary";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";
import ButtonState from "@/app/ui/buttons/BaseButton/ButtonState";

interface AdventureFormProps {
  campaignId: number;
  nextPosition: number;
  onCancel: () => void;
  onSaved: () => void;
}

/**
 * Adds an adventure to the campaign's ladder — SPEC-013 §5.2: "An adventure
 * is added with a position, a target level and a title." Everything else an
 * adventure can carry (synopsis, timeline, budgets) belongs to the
 * adventure's own page (T8), not this ladder-level create step. `status`
 * always starts `planned` — the ladder's status control (`AdventureLadder`)
 * is where it moves on from there.
 */
export default function AdventureForm({
  campaignId,
  nextPosition,
  onCancel,
  onSaved,
}: AdventureFormProps) {
  const t = useTranslations();
  const router = useRouter();

  const [position, setPosition] = useState(String(nextPosition));
  const [targetLevel, setTargetLevel] = useState(
    String(adventureMeta[AdventureMetaField.targetLevel].defaultValue)
  );
  const [title, setTitle] = useState("");
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>(
    {}
  );
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    const payload: Omit<Adventure, "id"> = {
      campaignId,
      position: Number(position),
      targetLevel: Number(targetLevel),
      title,
      synopsis: null,
      timeline: null,
      status: AdventureStatus.Planned,
      xpTarget: null,
      currencyTarget: null,
      currencyUnit: null,
      permanentItemTarget: null,
      consumableTarget: null,
    };

    const result = await createAdventure(payload as Adventure);
    setIsSaving(false);

    if (!result.ok) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    router.refresh();
    onSaved();
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="max-w-md space-y-4"
    >
      <BespokeFormErrorSummary errors={errors} meta={adventureMeta} />
      <TextInput
        label={t(adventureMeta[AdventureMetaField.position].labelKey ?? "")}
        value={position}
        onChange={(value) => setPosition(String(value))}
      />
      <TextInput
        label={t(adventureMeta[AdventureMetaField.targetLevel].labelKey ?? "")}
        value={targetLevel}
        onChange={(value) => setTargetLevel(String(value))}
      />
      <TextInput
        label={t(adventureMeta[AdventureMetaField.title].labelKey ?? "")}
        value={title}
        onChange={(value) => setTitle(String(value))}
      />
      <div className="flex justify-end gap-2">
        <BaseButton
          buttonState={isSaving ? ButtonState.Loading : ButtonState.Default}
        >
          {t("adventure.form.createButton")}
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
