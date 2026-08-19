"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import createScene from "@/app/lib/data/campaigns/createScene";
import updateScene from "@/app/lib/data/campaigns/updateScene";
import sceneMeta from "@/app/lib/config/campaigns/sceneMeta";
import sceneKinds from "@/app/lib/config/campaigns/scene-kinds";
import SceneMetaField from "@/app/lib/definitions/enums/campaign/SceneMetaField";
import SceneKind from "@/app/lib/definitions/enums/campaign/SceneKind";
import Scene from "@/app/lib/definitions/interfaces/campaign/Scene";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { ResolvedOption } from "@/app/lib/definitions/types/SelectOption";
import resolveOptions from "@/app/lib/utils/data/resolveOptions";
import TextInput from "@/app/ui/forms/inputs/TextInput";
import TextareaInput from "@/app/ui/forms/inputs/TextareaInput";
import Select from "@/app/ui/forms/inputs/Select";
import CheckboxInput from "@/app/ui/forms/inputs/CheckboxInput";
import BespokeFormErrorSummary from "@/app/ui/forms/BespokeFormErrorSummary";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";
import ButtonState from "@/app/ui/buttons/BaseButton/ButtonState";

const NONE = 0;

interface SceneFormProps {
  adventureId: number;
  nextPosition: number;
  zoneOptions: ResolvedOption<number>[];
  scene?: Scene | undefined;
  onCancel: () => void;
  onSaved: () => void;
}

/**
 * Adds or edits a scene on an adventure (SPEC-013 §5, T8) — one kind of the
 * six (`fight`/`explore`/`clue`/`goal`/`dungeon`/`break`), a title, an
 * optional description, an optional XP award, an optional hero-point flag,
 * and an optional place. `zoneId` is a plain nullable FK Select — `sceneMeta`'s
 * own comment notes there is no cross-field invariant to resolve here, unlike
 * `AssignLocationModal`'s zone/POI pair, so it is a normal form field.
 */
export default function SceneForm({
  adventureId,
  nextPosition,
  zoneOptions,
  scene,
  onCancel,
  onSaved,
}: SceneFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const isEditMode = scene !== undefined;

  const kindOptions = resolveOptions(sceneKinds, t);

  const [kind, setKind] = useState<SceneKind>(
    scene?.kind ?? sceneMeta[SceneMetaField.kind].defaultValue
  );
  const [title, setTitle] = useState(scene?.title ?? "");
  const [description, setDescription] = useState(scene?.description ?? "");
  const [xpAward, setXpAward] = useState(
    scene?.xpAward === null || scene?.xpAward === undefined
      ? ""
      : String(scene.xpAward)
  );
  const [grantsHeroPoint, setGrantsHeroPoint] = useState(
    scene?.grantsHeroPoint ?? false
  );
  const [zoneId, setZoneId] = useState<number>(scene?.zoneId ?? NONE);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>(
    {}
  );
  const [isSaving, setIsSaving] = useState(false);

  const zoneSelectOptions = [
    { value: NONE, label: t("scene.fields.zoneId.noneOption") },
    ...zoneOptions,
  ];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    const payload = {
      ...(isEditMode ? { id: scene.id } : { adventureId }),
      position: isEditMode ? scene.position : nextPosition,
      kind,
      title,
      description: description.trim() === "" ? null : description,
      xpAward: xpAward.trim() === "" ? null : Number(xpAward),
      grantsHeroPoint,
      zoneId: zoneId === NONE ? null : zoneId,
    } as Scene;

    const result: MutationResult = isEditMode
      ? await updateScene(payload)
      : await createScene(payload);

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
      <BespokeFormErrorSummary errors={errors} meta={sceneMeta} />
      <Select
        label={t(sceneMeta[SceneMetaField.kind].labelKey ?? "")}
        value={kind}
        options={kindOptions}
        onChange={(value) => setKind(value as SceneKind)}
      />
      <TextInput
        label={t(sceneMeta[SceneMetaField.title].labelKey ?? "")}
        value={title}
        onChange={(value) => setTitle(String(value))}
      />
      <TextareaInput
        label={t(sceneMeta[SceneMetaField.description].labelKey ?? "")}
        value={description}
        onChange={(value) => setDescription(String(value))}
      />
      <TextInput
        label={t(sceneMeta[SceneMetaField.xpAward].labelKey ?? "")}
        value={xpAward}
        onChange={(value) => setXpAward(String(value))}
      />
      <CheckboxInput
        label={t(sceneMeta[SceneMetaField.grantsHeroPoint].labelKey ?? "")}
        value={grantsHeroPoint}
        onChange={(value) => setGrantsHeroPoint(value === true)}
      />
      <Select
        label={t(sceneMeta[SceneMetaField.zoneId].labelKey ?? "")}
        value={zoneId}
        options={zoneSelectOptions}
        onChange={(value) => setZoneId(Number(value))}
      />
      <div className="flex justify-end gap-2">
        <BaseButton
          buttonState={isSaving ? ButtonState.Loading : ButtonState.Default}
        >
          {isEditMode
            ? t("scene.form.editButton")
            : t("scene.form.createButton")}
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
