"use client";

import FactionForm from "@/app/ui/factions/FactionForm";
import { useRouter } from "@/i18n/navigation";

export default function Page() {
  const router = useRouter();
  const onCancel = () => {
    router.push("/dashboard/admin/factions");
  };
  const onSaveFinished = () => {
    router.push("/dashboard/admin/factions");
  };

  return <FactionForm onCancel={onCancel} onSaveFinished={onSaveFinished} />;
}
