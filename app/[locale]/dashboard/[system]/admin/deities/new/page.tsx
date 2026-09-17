"use client";

import DeityForm from "@/app/ui/deities/DeityForm";
import { useRouter } from "@/i18n/navigation";
import useGameSystem from "@/app/lib/hooks/useGameSystem";
import { dashboardPath } from "@/i18n/dashboardPath";

export default function Page() {
  const router = useRouter();
  const system = useGameSystem();
  const onCancel = () => {
    router.push(dashboardPath(system, "/admin/deities"));
  };
  const onSaveFinished = () => {
    router.push(dashboardPath(system, "/admin/deities"));
  };

  return <DeityForm onCancel={onCancel} onSaveFinished={onSaveFinished} />;
}
