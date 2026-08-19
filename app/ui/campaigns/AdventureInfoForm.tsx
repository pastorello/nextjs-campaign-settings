"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import updateAdventure from "@/app/lib/data/campaigns/updateAdventure";
import adventureMeta from "@/app/lib/config/campaigns/adventureMeta";
import currencyUnits from "@/app/lib/config/campaigns/currency-units";
import AdventureMetaField from "@/app/lib/definitions/enums/campaign/AdventureMetaField";
import Adventure from "@/app/lib/definitions/interfaces/campaign/Adventure";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import {
  CurrencyUnit,
  toDisplayAmount,
  toStoredSilver,
} from "@/app/lib/utils/currency/convertCurrency";
import resolveOptions from "@/app/lib/utils/data/resolveOptions";
import TextInput from "@/app/ui/forms/inputs/TextInput";
import TextareaInput from "@/app/ui/forms/inputs/TextareaInput";
import Select from "@/app/ui/forms/inputs/Select";
import BespokeFormErrorSummary from "@/app/ui/forms/BespokeFormErrorSummary";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";
import ButtonState from "@/app/ui/buttons/BaseButton/ButtonState";

interface AdventureInfoFormProps {
  adventure: Adventure;
  onCancel: () => void;
  onSaved: () => void;
}

function toAmountInput(silver: number | null, unit: CurrencyUnit): string {
  return silver === null ? "" : String(toDisplayAmount(silver, unit));
}

function fromAmountInput(raw: string, unit: CurrencyUnit): number | null {
  if (raw.trim() === "") return null;
  return toStoredSilver(Number(raw), unit);
}

/**
 * Edits an adventure's own fields (SPEC-013 §5.3, T8) — everything the
 * ladder-level `AdventureForm` deliberately leaves out: synopsis, timeline
 * and the four budget targets, plus title and target level. `position` and
 * `status` stay `AdventureLadder`'s business (reorder buttons, inline
 * status Select) and are not part of this form, the same split
 * `CampaignHeader`/`CampaignForm` use. `currencyTarget` is entered and
 * displayed in the adventure's own `currencyUnit` and converted to stored
 * silver at the submit boundary (§6, "Currency: one stored unit, two
 * displayed") — changing the unit here does not rewrite the stored value,
 * it only changes which conversion the next read applies.
 */
export default function AdventureInfoForm({
  adventure,
  onCancel,
  onSaved,
}: AdventureInfoFormProps) {
  const t = useTranslations();
  const router = useRouter();

  const unitOptions = resolveOptions(currencyUnits, t);
  const initialUnit = (adventure.currencyUnit ?? "silver") as CurrencyUnit;

  const [title, setTitle] = useState(adventure.title);
  const [targetLevel, setTargetLevel] = useState(String(adventure.targetLevel));
  const [synopsis, setSynopsis] = useState(adventure.synopsis ?? "");
  const [timeline, setTimeline] = useState(adventure.timeline ?? "");
  const [xpTarget, setXpTarget] = useState(
    adventure.xpTarget === null ? "" : String(adventure.xpTarget)
  );
  const [currencyUnit, setCurrencyUnit] = useState<CurrencyUnit>(initialUnit);
  const [currencyTarget, setCurrencyTarget] = useState(
    toAmountInput(adventure.currencyTarget, initialUnit)
  );
  const [permanentItemTarget, setPermanentItemTarget] = useState(
    adventure.permanentItemTarget === null
      ? ""
      : String(adventure.permanentItemTarget)
  );
  const [consumableTarget, setConsumableTarget] = useState(
    adventure.consumableTarget === null
      ? ""
      : String(adventure.consumableTarget)
  );
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>(
    {}
  );
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    const payload = {
      id: adventure.id,
      title,
      targetLevel: Number(targetLevel),
      synopsis: synopsis.trim() === "" ? null : synopsis,
      timeline: timeline.trim() === "" ? null : timeline,
      xpTarget: xpTarget.trim() === "" ? null : Number(xpTarget),
      currencyTarget: fromAmountInput(currencyTarget, currencyUnit),
      currencyUnit,
      permanentItemTarget:
        permanentItemTarget.trim() === "" ? null : Number(permanentItemTarget),
      consumableTarget:
        consumableTarget.trim() === "" ? null : Number(consumableTarget),
    } as Adventure;

    const result: MutationResult = await updateAdventure(payload);
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
        label={t(adventureMeta[AdventureMetaField.title].labelKey ?? "")}
        value={title}
        onChange={(value) => setTitle(String(value))}
      />
      <TextInput
        label={t(adventureMeta[AdventureMetaField.targetLevel].labelKey ?? "")}
        value={targetLevel}
        onChange={(value) => setTargetLevel(String(value))}
      />
      <TextareaInput
        label={t(adventureMeta[AdventureMetaField.synopsis].labelKey ?? "")}
        value={synopsis}
        onChange={(value) => setSynopsis(String(value))}
      />
      <TextareaInput
        label={t(adventureMeta[AdventureMetaField.timeline].labelKey ?? "")}
        value={timeline}
        onChange={(value) => setTimeline(String(value))}
      />
      <TextInput
        label={t(adventureMeta[AdventureMetaField.xpTarget].labelKey ?? "")}
        value={xpTarget}
        onChange={(value) => setXpTarget(String(value))}
      />
      <Select
        label={t(adventureMeta[AdventureMetaField.currencyUnit].labelKey ?? "")}
        value={currencyUnit}
        options={unitOptions}
        onChange={(value) => {
          const nextUnit = value as CurrencyUnit;
          // Re-derive the displayed target through stored silver as the
          // pivot, so switching units mid-edit never silently changes what
          // gets saved (§6: switching units rewrites no stored value).
          setCurrencyTarget(
            toAmountInput(
              fromAmountInput(currencyTarget, currencyUnit),
              nextUnit
            )
          );
          setCurrencyUnit(nextUnit);
        }}
      />
      <TextInput
        label={t(
          adventureMeta[AdventureMetaField.currencyTarget].labelKey ?? ""
        )}
        value={currencyTarget}
        onChange={(value) => setCurrencyTarget(String(value))}
      />
      <TextInput
        label={t(
          adventureMeta[AdventureMetaField.permanentItemTarget].labelKey ?? ""
        )}
        value={permanentItemTarget}
        onChange={(value) => setPermanentItemTarget(String(value))}
      />
      <TextInput
        label={t(
          adventureMeta[AdventureMetaField.consumableTarget].labelKey ?? ""
        )}
        value={consumableTarget}
        onChange={(value) => setConsumableTarget(String(value))}
      />
      <div className="flex justify-end gap-2">
        <BaseButton
          buttonState={isSaving ? ButtonState.Loading : ButtonState.Default}
        >
          {t("adventure.form.editButton")}
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
