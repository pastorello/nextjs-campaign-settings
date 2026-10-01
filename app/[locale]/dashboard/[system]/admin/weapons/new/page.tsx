"use client";

import DhWeaponForm from "@/app/ui/dhWeapons/DhWeaponForm";
import { useRouter } from "@/i18n/navigation";
import useGameSystem from "@/app/lib/hooks/useGameSystem";
import { dashboardPath } from "@/i18n/dashboardPath";

export default function Page() {
  const router = useRouter();
  const system = useGameSystem();
  const backToList = () => {
    router.push(dashboardPath(system, "/admin/weapons"));
  };

  return <DhWeaponForm onCancel={backToList} onSaveFinished={backToList} />;
}
