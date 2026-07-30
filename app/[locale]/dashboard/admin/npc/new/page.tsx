"use client";

import NpcForm from "@/app/ui/npc/NpcForm";
import { useRouter } from "@/i18n/navigation";

export default function Page() {
  const router = useRouter();
  const onCancel = () => {
    router.push("/dashboard/admin/npc");
  };
  const onSaveFinished = () => {
    router.push("/dashboard/admin/npc");
  };

  return <NpcForm onCancel={onCancel} onSaveFinished={onSaveFinished} />;
}
