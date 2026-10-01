"use client";

import DhEnvironmentForm from "@/app/ui/dhEnvironments/DhEnvironmentForm";
import { useRouter } from "@/i18n/navigation";
import useGameSystem from "@/app/lib/hooks/useGameSystem";
import { dashboardPath } from "@/i18n/dashboardPath";
import OptionBundle from "@/app/lib/definitions/types/OptionBundle";

export default function NewDhEnvironmentForm({
  optionBundle,
}: {
  optionBundle: OptionBundle;
}) {
  const router = useRouter();
  const system = useGameSystem();
  const backToList = () => {
    router.push(dashboardPath(system, "/admin/environments"));
  };

  return (
    <DhEnvironmentForm
      optionBundle={optionBundle}
      onCancel={backToList}
      onSaveFinished={backToList}
    />
  );
}
