"use client";

import SpellForm from "@/app/ui/spells/SpellForm";
import { redirect } from "next/navigation";

export default function Page() {
  const onCancel = () => {
    redirect("/dashboard/admin/spells");
  };
  const onSaveFinished = () => {
    redirect("/dashboard/admin/spells");
  };

  return <SpellForm onCancel={onCancel} onSaveFinished={onSaveFinished} />;
}
