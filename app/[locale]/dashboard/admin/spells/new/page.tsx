"use client";

import SpellForm from "@/app/ui/spells/SpellForm";
import { useRouter } from "@/i18n/navigation";

export default function Page() {
  const router = useRouter();
  const onCancel = () => {
    router.push("/dashboard/admin/spells");
  };
  const onSaveFinished = () => {
    router.push("/dashboard/admin/spells");
  };

  return <SpellForm onCancel={onCancel} onSaveFinished={onSaveFinished} />;
}
