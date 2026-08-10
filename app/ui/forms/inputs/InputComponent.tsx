"use client";

import { useTranslations } from "next-intl";

import MetaValue from "@/app/lib/definitions/types/MetaValue";
import MetaConfigKey from "@/app/lib/definitions/types/MetaConfigKey";
import ControlType from "@/app/lib/definitions/types/ControlType";
import isValidString from "@/app/lib/utils/validators/isValidString";
import pageMetaFields, { fieldMeta } from "@/app/lib/config/pageMetaFields";
import FormField from "@/app/lib/definitions/interfaces/forms/FormField";
import OptionBundle from "@/app/lib/definitions/types/OptionBundle";
import resolveOptions from "@/app/lib/utils/data/resolveOptions";

import controlComponents from "./controlComponents";

/**
 * `MetaValue` has no `null` — every other control's value is always present
 * — so a table-backed field's "no selection" (SPEC-006 decision 8) needs a
 * sentinel in the widget, the same way `SortableHeader`'s own "no filter"
 * option already does. Confined to this one branch: the value this
 * component hands to `setField` on a real choice is the actual `null`, not
 * `-1` — the sentinel never reaches `usePageManager` or the mutation.
 */
const NO_SELECTION = -1;

interface InputComponentProps {
  fieldName: MetaConfigKey;
  setField: (field: MetaConfigKey, value: MetaValue) => void;
  // MetaValue is what the metadata layer actually produces; the narrower
  // union here rejected the mixed arrays it allows.
  value: MetaValue;
  /** Resolves a table-backed field's select — absent renders it empty. */
  optionBundle?: OptionBundle | undefined;
}

const InputComponent = ({
  fieldName,
  setField,
  value,
  optionBundle,
}: InputComponentProps) => {
  const t = useTranslations();

  const getFieldConfig = (): FormField => {
    const meta = pageMetaFields[fieldName];
    const labelKey = meta.labelKey;
    // `optionTable` read through `fieldMeta` (typed as `PageMeta`), not
    // `pageMetaFields` (its literal inferred type): reached through a
    // variable key, the registry's per-field shapes don't all declare
    // `optionTable`/`options` as a literal key, so a union access fails the
    // way `resolveFieldValue`'s own note about `getDatum` describes for the
    // same reason. `fieldMeta[fieldName]` is always defined in practice —
    // `MetaConfigKey` is exactly the set of real keys — the index signature
    // just can't say so.
    const optionTable = fieldMeta[fieldName]?.optionTable;

    const result: FormField = {
      label: labelKey ? t(labelKey) : "",
      // `value` may genuinely be `null` at runtime for a table-backed field
      // (`MetaValue` doesn't say so — see `NO_SELECTION`); the sentinel
      // stands in only for what this control displays and emits.
      value:
        optionTable !== undefined && (value === null || value === "")
          ? NO_SELECTION
          : value,
      onChange: (aValue: MetaValue) =>
        setField(
          fieldName,
          optionTable !== undefined && aValue === NO_SELECTION
            ? (null as unknown as MetaValue)
            : aValue
        ),
      type: meta.controlType,
    };

    if (
      meta.controlType === ControlType.Multiselect ||
      meta.controlType === ControlType.Select
    ) {
      if (optionTable !== undefined) {
        const tableOptions = optionBundle?.[optionTable] ?? [];
        // Only one table-backed field exists today (SPEC-006), so its
        // "none" label is named directly rather than derived — a second one
        // would need its own copy anyway ("no faction" and "no supervisor"
        // are not the same word).
        result.options = [
          { value: NO_SELECTION, label: t("npc.fields.faction.noneOption") },
          ...tableOptions,
        ];
      } else {
        const declaredOptions = fieldMeta[fieldName]?.options;
        if (declaredOptions !== undefined) {
          // The full union of every domain's options array is too wide for
          // TValue to infer (mixes string- and number-valued option lists);
          // FormField.options only ever needs the string | number default.
          result.options = resolveOptions<string | number>(declaredOptions, t);
        }
      }
      if (meta.controlType === ControlType.Multiselect) {
        result.multiple = true;
      }
    }
    if (
      meta.controlType === ControlType.Text ||
      meta.controlType === ControlType.Textarea
    ) {
      const placeholderKey = fieldMeta[fieldName]?.placeholderKey;

      result.placeholder = isValidString(placeholderKey)
        ? t(placeholderKey)
        : "";
    }
    return result;
  };

  const field = getFieldConfig();

  if (!field) {
    throw new Error(`Tipo non supportato: ${fieldName}`);
  }

  const Component = controlComponents[field.type];
  return (
    <Component {...field} name={fieldName} id={fieldName} key={fieldName} />
  );
};

export default InputComponent;
