"use client";

import NpcForm from "@/app/ui/npc/NpcForm";
import { useRouter } from "@/i18n/navigation";
import useGameSystem from "@/app/lib/hooks/useGameSystem";
import { dashboardPath } from "@/i18n/dashboardPath";
import OptionBundle from "@/app/lib/definitions/types/OptionBundle";

export default function NewNpcForm({
  optionBundle,
}: {
  optionBundle: OptionBundle;
}) {
  const router = useRouter();
  const system = useGameSystem();
  const onCancel = () => {
    router.push(dashboardPath(system, "/admin/npc"));
  };
  const onSaveFinished = () => {
    router.push(dashboardPath(system, "/admin/npc"));
  };

  return (
    <NpcForm
      optionBundle={optionBundle}
      onCancel={onCancel}
      onSaveFinished={onSaveFinished}
    />
  );
}
