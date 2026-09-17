"use client";

import DeityForm from "@/app/ui/deities/DeityForm";
import { useRouter } from "@/i18n/navigation";

export default function Page() {
  const router = useRouter();
  const onCancel = () => {
    router.push("/dashboard/admin/deities");
  };
  const onSaveFinished = () => {
    router.push("/dashboard/admin/deities");
  };

  return <DeityForm onCancel={onCancel} onSaveFinished={onSaveFinished} />;
}
