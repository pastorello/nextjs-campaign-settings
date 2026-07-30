"use client";

import NpcForm from "@/app/ui/npc/NpcForm";
import { redirect } from "next/navigation";

export default function Page() {
  const onCancel = () => {
    redirect("/dashboard/admin/npc");
  };
  const onSaveFinished = () => {
    redirect("/dashboard/admin/npc");
  };

  return <NpcForm onCancel={onCancel} onSaveFinished={onSaveFinished} />;
}
