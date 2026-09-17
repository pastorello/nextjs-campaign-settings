"use client";

import TreasureForm from "@/app/ui/treasures/TreasureForm";
import { useRouter } from "@/i18n/navigation";
import useGameSystem from "@/app/lib/hooks/useGameSystem";
import { dashboardPath } from "@/i18n/dashboardPath";

export default function Page() {
  const router = useRouter();
  const system = useGameSystem();
  const onCancel = () => {
    router.push(dashboardPath(system, "/admin/treasures"));
  };
  const onSaveFinished = () => {
    router.push(dashboardPath(system, "/admin/treasures"));
  };

  return <TreasureForm onCancel={onCancel} onSaveFinished={onSaveFinished} />;
}
