"use client";

import TreasureForm from "@/app/ui/treasures/TreasureForm";
import { useRouter } from "@/i18n/navigation";

export default function Page() {
  const router = useRouter();
  const onCancel = () => {
    router.push("/dashboard/admin/treasures");
  };
  const onSaveFinished = () => {
    router.push("/dashboard/admin/treasures");
  };

  return <TreasureForm onCancel={onCancel} onSaveFinished={onSaveFinished} />;
}
