"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { notifyError } from "@/app/lib/notifications/notify";

import type FieldErrors from "@/app/lib/definitions/types/FieldErrors";

/**
 * The save half of a bespoke campaign form (TD-126): the saving flag, the
 * field errors a refused mutation returns, and one `submit` that always
 * clears the flag.
 *
 * Before this, each of the six campaign forms awaited its action and only
 * then cleared `isSaving`, with no try/finally — so an action that threw (a
 * lost connection, an expired session) left the button on "saving" forever
 * and the user saw nothing. A throw now ends in an error toast, the same
 * handling `ZoneEditPanel` already had.
 *
 * `submit` resolves `true` only when the mutation succeeded, so the caller
 * keeps its own success step (refresh, close) behind a single `if`.
 */
export default function useMutationSubmit() {
  const t = useTranslations("common.form");
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  async function submit(
    mutate: () => Promise<MutationResult>
  ): Promise<boolean> {
    setIsSaving(true);
    try {
      const result = await mutate();
      if (!result.ok) {
        setErrors(result.errors);
        return false;
      }
      setErrors({});
      return true;
    } catch (error) {
      console.error("Saving the form failed:", error);
      notifyError(t("saveFailed"));
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  return { isSaving, errors, submit };
}
