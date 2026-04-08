"use client";

import DeityForm from "@/app/ui/deities/DeityForm";
import { redirect } from "next/navigation";

export default function Page() {
  const onCancel = () => {
    redirect("/dashboard/admin/deities");
  };
  const onSaveFinished = () => {
    redirect("/dashboard/admin/deities");
  };

  return <DeityForm onCancel={onCancel} onSaveFinished={onSaveFinished} />;
}
