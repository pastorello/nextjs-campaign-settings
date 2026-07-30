"use client";

import MagicItemForm from "@/app/ui/magicitems/MagicItemForm";
import { useRouter } from "@/i18n/navigation";

export default function Page() {
  const router = useRouter();
  const onCancel = () => {
    router.push("/dashboard/admin/magicitems");
  };
  const onSaveFinished = () => {
    router.push("/dashboard/admin/magicitems");
  };

  return <MagicItemForm onCancel={onCancel} onSaveFinished={onSaveFinished} />;
}
