"use client";

import DhClassForm from "@/app/ui/dhClasses/DhClassForm";
import { useRouter } from "@/i18n/navigation";
import useGameSystem from "@/app/lib/hooks/useGameSystem";
import { dashboardPath } from "@/i18n/dashboardPath";
import OptionBundle from "@/app/lib/definitions/types/OptionBundle";

export default function NewDhClassForm({
  optionBundle,
}: {
  optionBundle: OptionBundle;
}) {
  const router = useRouter();
  const system = useGameSystem();
  const toList = () => {
    router.push(dashboardPath(system, "/admin/classes"));
  };

  return (
    <DhClassForm
      optionBundle={optionBundle}
      onCancel={toList}
      onSaveFinished={toList}
    />
  );
}
