"use client";

import DhSubclassForm from "@/app/ui/dhSubclasses/DhSubclassForm";
import { useRouter } from "@/i18n/navigation";
import useGameSystem from "@/app/lib/hooks/useGameSystem";
import { dashboardPath } from "@/i18n/dashboardPath";
import OptionBundle from "@/app/lib/definitions/types/OptionBundle";

export default function NewDhSubclassForm({
  optionBundle,
}: {
  optionBundle: OptionBundle;
}) {
  const router = useRouter();
  const system = useGameSystem();
  const toList = () => {
    router.push(dashboardPath(system, "/admin/subclasses"));
  };

  return (
    <DhSubclassForm
      optionBundle={optionBundle}
      onCancel={toList}
      onSaveFinished={toList}
    />
  );
}
