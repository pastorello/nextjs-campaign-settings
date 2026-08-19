"use client";

import { useRouter } from "@/i18n/navigation";
import { notifyError } from "@/app/lib/notifications/notify";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import CheckboxInput from "@/app/ui/forms/inputs/CheckboxInput";

interface CheckOffControlProps {
  label: string;
  checked: boolean;
  onToggle: (next: boolean) => Promise<MutationResult>;
  errorMessage: string;
}

/**
 * The check-off control SPEC-013 §5.7 puts on every scene, creature and
 * loot row — one click, or Space via the keyboard alone (the DM runs the
 * app from a laptop, never a tablet, §9), marks awarded/taken. Wraps the
 * generic `CheckboxInput` (HeadlessUI's `Checkbox`, already keyboard-
 * operable) with the idempotent server action and a `router.refresh()` so
 * the budget panel updates without a full page reload. `setSceneAwarded`
 * et al. are idempotent by construction, so a rapid repeat click before the
 * previous request resolves is a harmless no-op, never a double count.
 */
export default function CheckOffControl({
  label,
  checked,
  onToggle,
  errorMessage,
}: CheckOffControlProps) {
  const router = useRouter();

  async function handleChange(next: boolean) {
    const result = await onToggle(next);
    if (!result.ok) {
      notifyError(errorMessage);
      return;
    }
    router.refresh();
  }

  return (
    <CheckboxInput
      label={label}
      value={checked}
      onChange={(value) => void handleChange(value === true)}
    />
  );
}
