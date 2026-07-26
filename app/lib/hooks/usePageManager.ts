"use client";

import { useState } from "react";

import formFields from "../config/formFields";
import pageMetaFields from "../config/pageMetaFields";
import isValidDataObject from "../utils/validators/isValidDataObject";
import ListItem from "../definitions/interfaces/ListItem";
import MetaConfigKey from "../definitions/types/MetaConfigKey";
import MetaValue from "../definitions/types/MetaValue";
import PageType from "../definitions/types/PageType";
import { sendErrorNotification } from "../actions/notifications/sendNotification";

interface PageManager<T> {
  /** The edited entity, ready to hand to a create or update mutation. */
  page: T;
  setField: (field: MetaConfigKey, value: MetaValue) => void;
  getField: (field: MetaConfigKey) => MetaValue;
  /** Fields whose value differs from what the form opened with. */
  editedFields: MetaConfigKey[];
}

/**
 * Form state for any domain, driven by `formFields` (TD-09).
 *
 * Replaces `useSpellPageManager`, `usePngPageManager`, `useDeityPageManager`
 * and `useMagicItemPageManager` — 421 lines that differed only in which fields
 * they listed, and had drifted accordingly: the NPC hook keyed two of its
 * entries with `MagicItemMetaField`, harmless only because string enums with
 * equal values compare equal.
 *
 * **One `useState` holding a record, not one per field.** The old hooks called
 * `useState` once per field, which is precisely why they could not be generic:
 * hooks cannot be called from a loop over a list. A single record sidesteps
 * that and leaves the public API unchanged.
 *
 * **`page` is derived, never mutated.** The old hooks did `page.id = item.id`
 * on a value a hook had returned — a direct state mutation React is not
 * guaranteed to observe, and the source of TD-22's four
 * `react-hooks/immutability` warnings. The id is part of the derived object
 * now.
 */
const usePageManager = <T extends ListItem>(
  pageType: PageType,
  pageItem?: T
): PageManager<T> => {
  const fields = formFields[pageType];
  const isCreateMode = !isValidDataObject(pageItem);

  /**
   * What the form opened with: the field's declared default when creating, the
   * record's own value when editing. Derived from props rather than stored, as
   * the hooks this replaces did, so `editedFields` compares against a stable
   * baseline instead of against the previous keystroke.
   */
  const initialValues = (): Record<string, MetaValue> =>
    Object.fromEntries(
      fields.map((field) => [
        field,
        isCreateMode
          ? pageMetaFields[field].defaultValue
          : (pageItem[field] as MetaValue),
      ])
    );

  // Lazy initialiser: runs on the first render only.
  const [values, setValues] =
    useState<Record<string, MetaValue>>(initialValues);

  const setField = (field: MetaConfigKey, value: MetaValue) => {
    if (!(field in values)) {
      sendErrorNotification(`No setter found for field: ${field}`);
      return;
    }

    setValues((current) => ({ ...current, [field]: value }));
  };

  const getField = (field: MetaConfigKey): MetaValue => {
    const value = values[field];

    if (value === undefined) {
      throw new Error(`No value found for field: ${field}`);
    }

    return value;
  };

  const defaults = initialValues();
  const editedFields = fields.filter(
    (field) => values[field] !== defaults[field]
  );

  // Asserted rather than inferred: `values` is assembled from `formFields` at
  // runtime, so the compiler cannot see that it carries exactly the domain's
  // fields. `formFields` is what makes it true, and a test covers each domain.
  const page = {
    ...values,
    ...(isCreateMode ? {} : { id: pageItem.id }),
  } as T;

  return { page, setField, getField, editedFields };
};

export default usePageManager;
