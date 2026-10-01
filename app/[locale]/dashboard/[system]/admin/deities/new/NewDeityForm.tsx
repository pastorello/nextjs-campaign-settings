"use client";

import DeityForm from "@/app/ui/deities/DeityForm";
import { useRouter } from "@/i18n/navigation";
import useGameSystem from "@/app/lib/hooks/useGameSystem";
import { dashboardPath } from "@/i18n/dashboardPath";
import OptionBundle from "@/app/lib/definitions/types/OptionBundle";

export default function NewDeityForm({
  optionBundle,
}: {
  optionBundle: OptionBundle;
}) {
  const router = useRouter();
  const system = useGameSystem();
  const onCancel = () => {
    router.push(dashboardPath(system, "/admin/deities"));
  };
  const onSaveFinished = () => {
    router.push(dashboardPath(system, "/admin/deities"));
  };

  return (
    <DeityForm
      optionBundle={optionBundle}
      onCancel={onCancel}
      onSaveFinished={onSaveFinished}
    />
  );
}
