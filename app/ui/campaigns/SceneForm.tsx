"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import useMutationSubmit from "@/app/lib/hooks/useMutationSubmit";
import createScene from "@/app/lib/data/campaigns/createScene";
import updateScene from "@/app/lib/data/campaigns/updateScene";
import sceneMeta from "@/app/lib/config/campaigns/sceneMeta";
import sceneKinds from "@/app/lib/config/campaigns/scene-kinds";
import SceneMetaField from "@/app/lib/definitions/enums/campaign/SceneMetaField";
import SceneKind from "@/app/lib/definitions/enums/campaign/SceneKind";
import Scene from "@/app/lib/definitions/interfaces/campaign/Scene";
import { ResolvedOption } from "@/app/lib/definitions/types/SelectOption";
import resolveOptions from "@/app/lib/utils/data/resolveOptions";
import TextInput from "@/app/ui/forms/inputs/TextInput";
import RichTextInput from "@/app/ui/forms/inputs/RichTextInput";
import Select from "@/app/ui/forms/inputs/Select";
import CheckboxInput from "@/app/ui/forms/inputs/CheckboxInput";
import BespokeFormErrorSummary from "@/app/ui/forms/BespokeFormErrorSummary";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";
import ButtonState from "@/app/ui/buttons/BaseButton/ButtonState";
import type GameSystem from "@/app/lib/definitions/GameSystem";
import { dhBattleAdjustments } from "@/app/lib/config/daggerheart/dhBattlePoints";
import { knownAdjustments } from "@/app/lib/utils/daggerheart/battlePoints";
import type DhBattleAdjustment from "@/app/lib/definitions/enums/daggerheart/DhBattleAdjustment";

const NONE = 0;

interface SceneFormProps {
  /** SPEC-030: Daggerheart marks milestones instead of XP and hero points. */
  rulesSystem?: GameSystem;
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
  rulesSystem = "dnd5e",
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
  const [milestone, setMilestone] = useState(scene?.milestone ?? false);
  const [adjustments, setAdjustments] = useState<DhBattleAdjustment[]>(
    knownAdjustments(scene?.battleAdjustments ?? [])
  );
  const isDaggerheart = rulesSystem === "daggerheart";
  const { errors, isSaving, submit } = useMutationSubmit();

  const zoneSelectOptions = [
    { value: NONE, label: t("scene.fields.zoneId.noneOption") },
    ...zoneOptions,
  ];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      ...(isEditMode ? { id: scene.id } : { adventureId }),
      position: isEditMode ? scene.position : nextPosition,
      kind,
      title,
      description: description.trim() === "" ? null : description,
      // Each system writes its own fields (SPEC-030 §9 decision 2).
      ...(isDaggerheart
        ? {
            milestone,
            // Only a fight is budgeted (SPEC-030 T3): another kind keeps
            // no adjustments, so a scene changed away from a fight sheds
            // its ticks rather than hiding them.
            battleAdjustments: kind === SceneKind.Fight ? adjustments : [],
          }
        : {
            xpAward: xpAward.trim() === "" ? null : Number(xpAward),
            grantsHeroPoint,
          }),
      zoneId: zoneId === NONE ? null : zoneId,
    } as Scene;

    const saved = await submit(() =>
      isEditMode ? updateScene(payload) : createScene(payload)
    );
    if (!saved) return;

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
      <RichTextInput
        label={t(sceneMeta[SceneMetaField.description].labelKey ?? "")}
        value={description}
        onChange={(value) => setDescription(String(value))}
      />
      {isDaggerheart ? (
        <>
          <CheckboxInput
            label={t(sceneMeta[SceneMetaField.milestone].labelKey)}
            value={milestone}
            onChange={(value) => setMilestone(value === true)}
          />
          {kind === SceneKind.Fight && (
            <fieldset className="space-y-1">
              <legend className="mb-1 text-sm font-medium">
                {t(sceneMeta[SceneMetaField.battleAdjustments].labelKey)}
              </legend>
              {dhBattleAdjustments.map((option) => (
                <CheckboxInput
                  key={option.value}
                  label={t(option.labelKey)}
                  value={adjustments.includes(option.value)}
                  onChange={(value) =>
                    setAdjustments((current) =>
                      knownAdjustments(
                        value === true
                          ? [...current, option.value]
                          : current.filter((key) => key !== option.value)
                      )
                    )
                  }
                />
              ))}
            </fieldset>
          )}
        </>
      ) : (
        <>
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
        </>
      )}
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
