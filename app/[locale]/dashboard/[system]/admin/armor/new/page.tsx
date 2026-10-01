"use client";

import DhArmorForm from "@/app/ui/dhArmor/DhArmorForm";
import { useRouter } from "@/i18n/navigation";
import useGameSystem from "@/app/lib/hooks/useGameSystem";
import { dashboardPath } from "@/i18n/dashboardPath";

export default function Page() {
  const router = useRouter();
  const system = useGameSystem();
  const backToList = () => {
    router.push(dashboardPath(system, "/admin/armor"));
  };

  return <DhArmorForm onCancel={backToList} onSaveFinished={backToList} />;
}
