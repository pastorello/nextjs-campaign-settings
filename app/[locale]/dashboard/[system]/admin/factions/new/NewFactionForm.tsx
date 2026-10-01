"use client";

import FactionForm from "@/app/ui/factions/FactionForm";
import { useRouter } from "@/i18n/navigation";
import useGameSystem from "@/app/lib/hooks/useGameSystem";
import { dashboardPath } from "@/i18n/dashboardPath";
import OptionBundle from "@/app/lib/definitions/types/OptionBundle";

export default function NewFactionForm({
  optionBundle,
}: {
  optionBundle: OptionBundle;
}) {
  const router = useRouter();
  const system = useGameSystem();
  const onCancel = () => {
    router.push(dashboardPath(system, "/admin/factions"));
  };
  const onSaveFinished = () => {
    router.push(dashboardPath(system, "/admin/factions"));
  };

  return (
    <FactionForm
      optionBundle={optionBundle}
      onCancel={onCancel}
      onSaveFinished={onSaveFinished}
    />
  );
}
