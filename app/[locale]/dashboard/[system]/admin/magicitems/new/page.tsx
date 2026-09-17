"use client";

import MagicItemForm from "@/app/ui/magicitems/MagicItemForm";
import { useRouter } from "@/i18n/navigation";
import useGameSystem from "@/app/lib/hooks/useGameSystem";
import { dashboardPath } from "@/i18n/dashboardPath";

export default function Page() {
  const router = useRouter();
  const system = useGameSystem();
  const onCancel = () => {
    router.push(dashboardPath(system, "/admin/magicitems"));
  };
  const onSaveFinished = () => {
    router.push(dashboardPath(system, "/admin/magicitems"));
  };

  return <MagicItemForm onCancel={onCancel} onSaveFinished={onSaveFinished} />;
}
