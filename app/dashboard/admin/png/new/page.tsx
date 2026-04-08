"use client";

import PngForm from "@/app/ui/png/PngForm";
import { redirect } from "next/navigation";

export default function Page() {
  const onCancel = () => {
    redirect("/dashboard/admin/png");
  };
  const onSaveFinished = () => {
    redirect("/dashboard/admin/png");
  };

  return <PngForm onCancel={onCancel} onSaveFinished={onSaveFinished} />;
}
