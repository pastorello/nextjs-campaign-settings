"use client";

import { ReactNode, useState } from "react";
import Form from "next/form";

import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";
import FormErrorSummary from "@/app/ui/components/FormErrorSummary";
import InputComponent from "@/app/ui/forms/inputs/InputComponent";
import isValidDataArray from "@/app/lib/utils/validators/isValidDataArray";
import isValidDataObject from "@/app/lib/utils/validators/isValidDataObject";
import isValidFunction from "@/app/lib/utils/validators/isValidFunction";
import usePageManager from "@/app/lib/hooks/usePageManager";
import MetaConfigKey from "@/app/lib/definitions/types/MetaConfigKey";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import PageType from "@/app/lib/definitions/types/PageType";

const CANCEL_LABEL = "Annulla";

/** The four strings a domain form shows. Kept together so TD-21 can lift them. */
interface EntityFormCopy {
  createTitle: string;
  editTitle: string;
  createButton: string;
  editButton: string;
}

/**
 * Renders one field's control. Handed to the layout so a domain form never has
 * to know about `InputComponent`, `setField` or `getField`.
 */
type FieldRenderer = (fieldName: MetaConfigKey) => ReactNode;

/**
 * The domain's two write paths. Passed in rather than selected inside, which
 * keeps this component free of assertions: `usePageManager<T>` already returns
 * the domain's own type, so these accept it directly.
 */
interface EntityMutations<T> {
  create: (page: T) => Promise<MutationResult>;
  update: (page: T) => Promise<MutationResult>;
}

interface EntityFormProps<T extends object> {
  pageType: PageType;
  formData?: T;
  mutations: EntityMutations<T>;
  copy: EntityFormCopy;
  onCancel: () => void;
  onSaveFinished: (page: T) => void;

  /**
   * Whether the submit button stays disabled until something is edited.
   *
   * Defaults to true because three of the four forms did that; the magic item
   * form did not, and passes `false` to keep behaving as it always has. That
   * divergence is worth a decision rather than a silent unification: with
   * TD-02's validators as lax as they are (`nome` is a bare `z.string()`), an
   * always-enabled submit means an empty magic item can be created in one
   * click.
   */
  disableUntilEdited?: boolean;

  /** The domain's field layout — the one part that genuinely differs. */
  children: (field: FieldRenderer) => ReactNode;
}

/**
 * The shell every domain form shared (TD-09): state, submit, validation errors,
 * title and buttons. About 60 lines repeated four times, differing only in
 * which mutations it called and what it was called.
 *
 * **The layout deliberately stays per-domain.** TD-09 says to keep a
 * per-domain component only where the domain genuinely differs, and the field
 * arrangement is exactly that — a 40/60 split with a nested pair for magic
 * items, four columns of varying width for NPCs. Encoding that as data would
 * move CSS into config and make it harder to change, not easier. What is
 * removed here is the boilerplate around it.
 */
export default function EntityForm<T extends object>({
  pageType,
  formData,
  mutations,
  copy,
  onCancel,
  onSaveFinished,
  disableUntilEdited = true,
  children,
}: EntityFormProps<T>) {
  const isEditMode = isValidDataObject(formData);
  const { page, setField, getField, editedFields } = usePageManager<T>(
    pageType,
    formData
  );

  const [errors, setErrors] = useState<Record<string, string[] | undefined>>(
    {}
  );

  const field: FieldRenderer = (fieldName) => (
    <InputComponent
      fieldName={fieldName}
      setField={setField}
      value={getField(fieldName)}
    />
  );

  const onSubmit = async () => {
    // An update carries only what changed plus the id; a create carries the
    // whole page. The seed is asserted through `unknown` because `{ id }`
    // alone is not yet a T — the reduce fills the rest from `editedFields`,
    // and the mutation validates the result with the domain's Zod schema
    // before anything reaches Prisma.
    const result = isEditMode
      ? await mutations.update(
          editedFields.reduce<T>(
            (acc, item) => ({ ...acc, [item]: getField(item) }),
            { id: (page as { id?: number }).id } as unknown as T
          )
        )
      : await mutations.create(page);

    if (!result.ok) {
      setErrors(result.errors);
      return;
    }

    setErrors({});

    if (isValidFunction(onSaveFinished)) {
      onSaveFinished(page);
    }
  };

  return (
    <div className="w-[900px] mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">
        {isEditMode ? copy.editTitle : copy.createTitle}
      </h1>
      <Form action={onSubmit} className="space-y-6">
        <FormErrorSummary errors={errors} />
        {children(field)}
        <div className="flex justify-end gap-2">
          <BaseButton
            disabled={disableUntilEdited && !isValidDataArray(editedFields)}
          >
            {isEditMode ? copy.editButton : copy.createButton}
          </BaseButton>
          <BaseButton onClick={onCancel} variant={ButtonVariant.secondary}>
            {CANCEL_LABEL}
          </BaseButton>
        </div>
      </Form>
    </div>
  );
}
