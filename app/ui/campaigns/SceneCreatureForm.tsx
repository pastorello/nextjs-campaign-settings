"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import createSceneCreature from "@/app/lib/data/campaigns/createSceneCreature";
import updateSceneCreature from "@/app/lib/data/campaigns/updateSceneCreature";
import sceneCreatureMeta from "@/app/lib/config/campaigns/sceneCreatureMeta";
import SceneCreatureMetaField from "@/app/lib/definitions/enums/campaign/SceneCreatureMetaField";
import SceneCreature from "@/app/lib/definitions/interfaces/campaign/SceneCreature";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { ResolvedOption } from "@/app/lib/definitions/types/SelectOption";
import TextInput from "@/app/ui/forms/inputs/TextInput";
import Select from "@/app/ui/forms/inputs/Select";
import BespokeFormErrorSummary from "@/app/ui/forms/BespokeFormErrorSummary";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";
import ButtonState from "@/app/ui/buttons/BaseButton/ButtonState";

const NONE = 0;

interface SceneCreatureFormProps {
  sceneId: number;
  nextPosition: number;
  npcOptions: ResolvedOption<number>[];
  creature?: SceneCreature | undefined;
  onCancel: () => void;
  onSaved: () => void;
}

/**
 * Adds or edits a creature row on a scene (SPEC-013 §5, T8). `npcId` is a
 * plain nullable FK Select, like `SceneForm`'s `zoneId` — no cross-field
 * invariant to resolve, so `NONE` (0) stands in for "not linked" the same
 * way `AssignLocationModal` uses a sentinel for "no landmark".
 */
export default function SceneCreatureForm({
  sceneId,
  nextPosition,
  npcOptions,
  creature,
  onCancel,
  onSaved,
}: SceneCreatureFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const isEditMode = creature !== undefined;

  const [name, setName] = useState(creature?.name ?? "");
  const [level, setLevel] = useState(
    creature?.level === null || creature?.level === undefined
      ? ""
      : String(creature.level)
  );
  const [xpEach, setXpEach] = useState(
    creature?.xpEach === null || creature?.xpEach === undefined
      ? ""
      : String(creature.xpEach)
  );
  const [quantity, setQuantity] = useState(String(creature?.quantity ?? 1));
  const [note, setNote] = useState(creature?.note ?? "");
  const [npcId, setNpcId] = useState<number>(creature?.npcId ?? NONE);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>(
    {}
  );
  const [isSaving, setIsSaving] = useState(false);

  const npcSelectOptions = [
    { value: NONE, label: t("sceneCreature.fields.npcId.noneOption") },
    ...npcOptions,
  ];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    const payload = {
      ...(isEditMode ? { id: creature.id } : { sceneId }),
      position: isEditMode ? creature.position : nextPosition,
      name,
      level: level.trim() === "" ? null : Number(level),
      xpEach: xpEach.trim() === "" ? null : Number(xpEach),
      quantity: Number(quantity),
      note: note.trim() === "" ? null : note,
      npcId: npcId === NONE ? null : npcId,
    } as SceneCreature;

    const result: MutationResult = isEditMode
      ? await updateSceneCreature(payload)
      : await createSceneCreature(payload);

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
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
      <BespokeFormErrorSummary errors={errors} meta={sceneCreatureMeta} />
      <TextInput
        label={t(sceneCreatureMeta[SceneCreatureMetaField.name].labelKey ?? "")}
        value={name}
        onChange={(value) => setName(String(value))}
      />
      <TextInput
        label={t(
          sceneCreatureMeta[SceneCreatureMetaField.level].labelKey ?? ""
        )}
        value={level}
        onChange={(value) => setLevel(String(value))}
      />
      <TextInput
        label={t(
          sceneCreatureMeta[SceneCreatureMetaField.xpEach].labelKey ?? ""
        )}
        value={xpEach}
        onChange={(value) => setXpEach(String(value))}
      />
      <TextInput
        label={t(
          sceneCreatureMeta[SceneCreatureMetaField.quantity].labelKey ?? ""
        )}
        value={quantity}
        onChange={(value) => setQuantity(String(value))}
      />
      <TextInput
        label={t(sceneCreatureMeta[SceneCreatureMetaField.note].labelKey ?? "")}
        value={note}
        onChange={(value) => setNote(String(value))}
      />
      <Select
        label={t(
          sceneCreatureMeta[SceneCreatureMetaField.npcId].labelKey ?? ""
        )}
        value={npcId}
        options={npcSelectOptions}
        onChange={(value) => setNpcId(Number(value))}
      />
      <div className="flex justify-end gap-2">
        <BaseButton
          buttonState={isSaving ? ButtonState.Loading : ButtonState.Default}
        >
          {isEditMode
            ? t("sceneCreature.form.editButton")
            : t("sceneCreature.form.createButton")}
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
