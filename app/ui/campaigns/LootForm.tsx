"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import createLoot from "@/app/lib/data/campaigns/createLoot";
import updateLoot from "@/app/lib/data/campaigns/updateLoot";
import lootMeta from "@/app/lib/config/campaigns/lootMeta";
import LootMetaField from "@/app/lib/definitions/enums/campaign/LootMetaField";
import Loot from "@/app/lib/definitions/interfaces/campaign/Loot";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import {
  CurrencyUnit,
  toDisplayAmount,
  toStoredSilver,
} from "@/app/lib/utils/currency/convertCurrency";
import { ResolvedOption } from "@/app/lib/definitions/types/SelectOption";
import TextInput from "@/app/ui/forms/inputs/TextInput";
import Select from "@/app/ui/forms/inputs/Select";
import BespokeFormErrorSummary from "@/app/ui/forms/BespokeFormErrorSummary";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";
import ButtonState from "@/app/ui/buttons/BaseButton/ButtonState";

const NONE = 0;

interface LootFormProps {
  sceneId: number;
  nextPosition: number;
  currencyUnit: CurrencyUnit;
  magicItemOptions: ResolvedOption<number>[];
  treasureOptions: ResolvedOption<number>[];
  loot?: Loot | undefined;
  onCancel: () => void;
  onSaved: () => void;
}

/**
 * Adds or edits a loot row on a scene (SPEC-013 §5/§6, T8). `value` is
 * entered and displayed in the adventure's `currencyUnit` and converted to
 * stored silver at the submit boundary, same as `AdventureInfoForm`'s
 * `currencyTarget`. `magicItemId`/`treasureId` are mutually exclusive
 * (§5's edge case) — picking one clears the other client-side, and
 * `createLoot`/`updateLoot` re-enforce it server-side regardless.
 */
export default function LootForm({
  sceneId,
  nextPosition,
  currencyUnit,
  magicItemOptions,
  treasureOptions,
  loot,
  onCancel,
  onSaved,
}: LootFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const isEditMode = loot !== undefined;

  const [description, setDescription] = useState(loot?.description ?? "");
  const [quantity, setQuantity] = useState(String(loot?.quantity ?? 1));
  const [value, setValue] = useState(
    loot?.value === null || loot?.value === undefined
      ? ""
      : String(toDisplayAmount(loot.value, currencyUnit))
  );
  const [magicItemId, setMagicItemId] = useState<number>(
    loot?.magicItemId ?? NONE
  );
  const [treasureId, setTreasureId] = useState<number>(
    loot?.treasureId ?? NONE
  );
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>(
    {}
  );
  const [isSaving, setIsSaving] = useState(false);

  const magicItemSelectOptions = [
    { value: NONE, label: t("loot.fields.magicItemId.noneOption") },
    ...magicItemOptions,
  ];
  const treasureSelectOptions = [
    { value: NONE, label: t("loot.fields.treasureId.noneOption") },
    ...treasureOptions,
  ];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    const parsedValue = value.trim() === "" ? null : Number(value);

    const payload = {
      ...(isEditMode ? { id: loot.id } : { sceneId }),
      position: isEditMode ? loot.position : nextPosition,
      description,
      quantity: Number(quantity),
      value:
        parsedValue === null ? null : toStoredSilver(parsedValue, currencyUnit),
      magicItemId: magicItemId === NONE ? null : magicItemId,
      treasureId: treasureId === NONE ? null : treasureId,
    } as Loot;

    const result: MutationResult = isEditMode
      ? await updateLoot(payload)
      : await createLoot(payload);

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
      <BespokeFormErrorSummary errors={errors} meta={lootMeta} />
      <TextInput
        label={t(lootMeta[LootMetaField.description].labelKey ?? "")}
        value={description}
        onChange={(value) => setDescription(String(value))}
      />
      <TextInput
        label={t(lootMeta[LootMetaField.quantity].labelKey ?? "")}
        value={quantity}
        onChange={(value) => setQuantity(String(value))}
      />
      <TextInput
        label={`${t(lootMeta[LootMetaField.value].labelKey ?? "")} (${t(`adventure.currencyUnits.${currencyUnit}`)})`}
        value={value}
        onChange={(value) => setValue(String(value))}
      />
      <Select
        label={t(lootMeta[LootMetaField.magicItemId].labelKey ?? "")}
        value={magicItemId}
        options={magicItemSelectOptions}
        onChange={(value) => {
          setMagicItemId(Number(value));
          if (Number(value) !== NONE) setTreasureId(NONE);
        }}
      />
      <Select
        label={t(lootMeta[LootMetaField.treasureId].labelKey ?? "")}
        value={treasureId}
        options={treasureSelectOptions}
        onChange={(value) => {
          setTreasureId(Number(value));
          if (Number(value) !== NONE) setMagicItemId(NONE);
        }}
      />
      <div className="flex justify-end gap-2">
        <BaseButton
          buttonState={isSaving ? ButtonState.Loading : ButtonState.Default}
        >
          {isEditMode ? t("loot.form.editButton") : t("loot.form.createButton")}
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
