"use client";

import MagicItemForm from "@/app/ui/magicitems/MagicItemForm";
import { useRouter } from "@/i18n/navigation";
import useGameSystem from "@/app/lib/hooks/useGameSystem";
import { dashboardPath } from "@/i18n/dashboardPath";
import OptionBundle from "@/app/lib/definitions/types/OptionBundle";

export default function NewMagicItemForm({
  optionBundle,
}: {
  optionBundle: OptionBundle;
}) {
  const router = useRouter();
  const system = useGameSystem();
  const onCancel = () => {
    router.push(dashboardPath(system, "/admin/magicitems"));
  };
  const onSaveFinished = () => {
    router.push(dashboardPath(system, "/admin/magicitems"));
  };

  return (
    <MagicItemForm
      optionBundle={optionBundle}
      onCancel={onCancel}
      onSaveFinished={onSaveFinished}
    />
  );
}
