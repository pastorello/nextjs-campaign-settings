"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import createPlaceFromPicker from "@/app/lib/data/maps/createPlaceFromPicker";
import zoneMeta from "@/app/lib/config/geography/zoneMeta";
import { notifyError } from "@/app/lib/notifications/notify";
import type FieldErrors from "@/app/lib/definitions/types/FieldErrors";
import type ZoneOption from "@/app/lib/definitions/interfaces/maps/ZoneOption";
import type { PickerPlace } from "@/app/lib/definitions/interfaces/maps/PickerPlace";
import type { PickerPlaceInput } from "@/app/lib/data/validation/pickerPlaceSchema";
import FormErrorSummary from "@/app/ui/components/FormErrorSummary";
import Select from "@/app/ui/forms/inputs/Select";
import TextInput from "@/app/ui/forms/inputs/TextInput";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonState from "@/app/ui/buttons/BaseButton/ButtonState";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";

type PickerPlaceKind = PickerPlaceInput["kind"];

/**
 * The landmark first, and preselected: the DM's answer of 2026-09-30 — the
 * place a DM creates while writing a character is usually a tavern, a
 * temple, a shop. The navigable kinds follow for a place big enough to
 * have a map of its own.
 */
const KINDS: PickerPlaceKind[] = ["poi", "region", "plane", "city", "dungeon"];

const NO_PARENT = 0;

interface CreatePlaceFormProps {
  /** Every place a new one can sit inside — the picker's own zone list. */
  zones: ZoneOption[];
  /** The most specific place in context (§5.2), or `null` for none. */
  defaultParentId: number | null;
  onCreated: (place: PickerPlace) => void;
  onCancel: () => void;
}

/**
 * "Create a place" from inside a place picker (SPEC-026): a type, a name and
 * a parent — nothing else (§3). The place is created unplaced (§5.4), and
 * the caller selects it; this component only creates it.
 *
 * A domain component, not generic form machinery (`CLAUDE.md` rule 4), and
 * outside the metadata layer's generic forms because it spans two tables:
 * the name reuses `zoneMeta.title`'s label key (the validator is reused by
 * `pickerPlaceSchema` on the server), the type and parent are this flow's
 * own. A failed creation keeps what was typed (§5's edge cases).
 */
export default function CreatePlaceForm({
  zones,
  defaultParentId,
  onCreated,
  onCancel,
}: CreatePlaceFormProps) {
  const t = useTranslations();
  const tCreate = useTranslations("geography.createPlace");

  const [kind, setKind] = useState<PickerPlaceKind>("poi");
  const [title, setTitle] = useState("");
  const [parentId, setParentId] = useState<number | null>(defaultParentId);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleCreate = async () => {
    setIsSaving(true);
    try {
      const result = await createPlaceFromPicker({ title, parentId, kind });
      if (!result.ok) {
        setErrors(result.errors);
        return;
      }
      setErrors({});
      onCreated(result.place);
    } catch (error) {
      console.error("Failed to create a place from the picker:", error);
      notifyError(tCreate("failed"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section
      aria-label={tCreate("title")}
      className="space-y-3 rounded-lg border border-gray-200 p-3"
    >
      <h3 className="text-sm font-semibold text-gray-900">
        {tCreate("title")}
      </h3>
      <FormErrorSummary errors={errors} />
      <Select
        label={tCreate("kindLabel")}
        value={kind}
        onChange={(value) => setKind(String(value) as PickerPlaceKind)}
        options={KINDS.map((option) => ({
          value: option,
          label: t(`geography.placeKinds.${option}`),
        }))}
      />
      <TextInput
        label={t(zoneMeta.title.labelKey)}
        value={title}
        onChange={(value) => setTitle(String(value ?? ""))}
      />
      <Select
        label={tCreate("parentLabel")}
        value={parentId ?? NO_PARENT}
        onChange={(value) => {
          const id = Number(value);
          setParentId(id === NO_PARENT ? null : id);
        }}
        options={[
          { value: NO_PARENT, label: tCreate("parentPlaceholder") },
          ...zones.map((zone) => ({ value: zone.id, label: zone.title })),
        ]}
      />
      <p className="text-xs text-gray-600">{tCreate("unplacedNote")}</p>
      <div className="flex justify-end gap-2">
        <BaseButton variant={ButtonVariant.neutral} onClick={onCancel}>
          {tCreate("cancel")}
        </BaseButton>
        <BaseButton
          buttonState={isSaving ? ButtonState.Loading : ButtonState.Default}
          onClick={() => void handleCreate()}
        >
          {isSaving ? tCreate("creating") : tCreate("create")}
        </BaseButton>
      </div>
    </section>
  );
}
