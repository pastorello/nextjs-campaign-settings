"use client";

import DhLootForm from "@/app/ui/dhLoot/DhLootForm";
import { useRouter } from "@/i18n/navigation";
import useGameSystem from "@/app/lib/hooks/useGameSystem";
import { dashboardPath } from "@/i18n/dashboardPath";

export default function Page() {
  const router = useRouter();
  const system = useGameSystem();
  const backToList = () => {
    router.push(dashboardPath(system, "/admin/loot"));
  };

  return <DhLootForm onCancel={backToList} onSaveFinished={backToList} />;
}
