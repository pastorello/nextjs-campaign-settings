"use client";

import SpellForm from "@/app/ui/spells/SpellForm";
import { useRouter } from "@/i18n/navigation";
import useGameSystem from "@/app/lib/hooks/useGameSystem";
import { dashboardPath } from "@/i18n/dashboardPath";

export default function Page() {
  const router = useRouter();
  const system = useGameSystem();
  const onCancel = () => {
    router.push(dashboardPath(system, "/admin/spells"));
  };
  const onSaveFinished = () => {
    router.push(dashboardPath(system, "/admin/spells"));
  };

  return <SpellForm onCancel={onCancel} onSaveFinished={onSaveFinished} />;
}
