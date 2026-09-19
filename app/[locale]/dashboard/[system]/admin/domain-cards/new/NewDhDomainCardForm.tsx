"use client";

import DhDomainCardForm from "@/app/ui/dhDomainCards/DhDomainCardForm";
import { useRouter } from "@/i18n/navigation";
import useGameSystem from "@/app/lib/hooks/useGameSystem";
import { dashboardPath } from "@/i18n/dashboardPath";
import OptionBundle from "@/app/lib/definitions/types/OptionBundle";

export default function NewDhDomainCardForm({
  optionBundle,
}: {
  optionBundle: OptionBundle;
}) {
  const router = useRouter();
  const system = useGameSystem();
  const backToList = () => {
    router.push(dashboardPath(system, "/admin/domain-cards"));
  };

  return (
    <DhDomainCardForm
      optionBundle={optionBundle}
      onCancel={backToList}
      onSaveFinished={backToList}
    />
  );
}
