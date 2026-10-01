"use client";

import DhAdversaryForm from "@/app/ui/dhAdversaries/DhAdversaryForm";
import { useRouter } from "@/i18n/navigation";
import useGameSystem from "@/app/lib/hooks/useGameSystem";
import { dashboardPath } from "@/i18n/dashboardPath";

export default function Page() {
  const router = useRouter();
  const system = useGameSystem();
  const backToList = () => {
    router.push(dashboardPath(system, "/admin/adversaries"));
  };

  return <DhAdversaryForm onCancel={backToList} onSaveFinished={backToList} />;
}
