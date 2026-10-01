"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import useMutationSubmit from "@/app/lib/hooks/useMutationSubmit";
import createLoot from "@/app/lib/data/campaigns/createLoot";
import updateLoot from "@/app/lib/data/campaigns/updateLoot";
import lootMeta from "@/app/lib/config/campaigns/lootMeta";
import LootMetaField from "@/app/lib/definitions/enums/campaign/LootMetaField";
import Loot from "@/app/lib/definitions/interfaces/campaign/Loot";
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
import type GameSystem from "@/app/lib/definitions/GameSystem";

const NONE = 0;

const idOrNull = (id: number) => (id === NONE ? null : id);

/** SPEC-029's catalogues a Daggerheart loot row may link, one at most. */
export interface DhEquipmentOptions {
  weapons: ResolvedOption<number>[];
  armor: ResolvedOption<number>[];
  loot: ResolvedOption<number>[];
}

const NO_EQUIPMENT: DhEquipmentOptions = { weapons: [], armor: [], loot: [] };

interface LootFormProps {
  /** SPEC-030 T4: Daggerheart trades silver and 5e's links for gold and gear. */
  rulesSystem?: GameSystem;
  equipmentOptions?: DhEquipmentOptions;
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
 *
 * Under Daggerheart the row holds gold, a whole number of handfuls, and at
 * most one of a weapon, an armor or a piece of loot — the same one-link
 * rule, across three selects.
 */
export default function LootForm({
  rulesSystem = "dnd5e",
  equipmentOptions = NO_EQUIPMENT,
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
  const [gold, setGold] = useState(
    loot?.gold === null || loot?.gold === undefined ? "" : String(loot.gold)
  );
  const [equipment, setEquipment] = useState({
    dhWeaponId: loot?.dhWeaponId ?? NONE,
    dhArmorId: loot?.dhArmorId ?? NONE,
    dhLootId: loot?.dhLootId ?? NONE,
  });
  const isDaggerheart = rulesSystem === "daggerheart";
  const { errors, isSaving, submit } = useMutationSubmit();

  // Picking one link clears the other two, as `magicItemId` and
  // `treasureId` clear each other.
  function chooseEquipment(field: keyof typeof equipment, id: number) {
    setEquipment(
      id === NONE
        ? { ...equipment, [field]: NONE }
        : { dhWeaponId: NONE, dhArmorId: NONE, dhLootId: NONE, [field]: id }
    );
  }
  const equipmentSelects = [
    {
      field: "dhWeaponId",
      metaField: LootMetaField.dhWeaponId,
      options: equipmentOptions.weapons,
    },
    {
      field: "dhArmorId",
      metaField: LootMetaField.dhArmorId,
      options: equipmentOptions.armor,
    },
    {
      field: "dhLootId",
      metaField: LootMetaField.dhLootId,
      options: equipmentOptions.loot,
    },
  ] as const;

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
    const parsedValue = value.trim() === "" ? null : Number(value);

    const payload = {
      ...(isEditMode ? { id: loot.id } : { sceneId }),
      position: isEditMode ? loot.position : nextPosition,
      description,
      quantity: Number(quantity),
      // Each system writes its own fields (SPEC-030 §9 decision 2).
      ...(isDaggerheart
        ? {
            gold: gold.trim() === "" ? null : Number(gold),
            dhWeaponId: idOrNull(equipment.dhWeaponId),
            dhArmorId: idOrNull(equipment.dhArmorId),
            dhLootId: idOrNull(equipment.dhLootId),
          }
        : {
            value:
              parsedValue === null
                ? null
                : toStoredSilver(parsedValue, currencyUnit),
            magicItemId: idOrNull(magicItemId),
            treasureId: idOrNull(treasureId),
          }),
    } as Loot;

    const saved = await submit(() =>
      isEditMode ? updateLoot(payload) : createLoot(payload)
    );
    if (!saved) return;

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
      {isDaggerheart ? (
        <>
          <TextInput
            label={t(lootMeta[LootMetaField.gold].labelKey)}
            value={gold}
            onChange={(value) => setGold(String(value))}
          />
          {equipmentSelects.map(({ field, metaField, options }) => (
            <Select
              key={field}
              label={t(lootMeta[metaField].labelKey)}
              value={equipment[field]}
              options={[
                {
                  value: NONE,
                  label: t(`loot.fields.${field}.noneOption`),
                },
                ...options,
              ]}
              onChange={(value) => chooseEquipment(field, Number(value))}
            />
          ))}
        </>
      ) : (
        <>
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
        </>
      )}
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
