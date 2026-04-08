"use client";

import MagicItemForm from "@/app/ui/magicitems/MagicItemForm";
import { redirect } from "next/navigation";

export default function Page() {
  const onCancel = () => {
    redirect("/dashboard/admin/magicitems");
  };
  const onSaveFinished = () => {
    redirect("/dashboard/admin/magicitems");
  };

  return <MagicItemForm onCancel={onCancel} onSaveFinished={onSaveFinished} />;
}
