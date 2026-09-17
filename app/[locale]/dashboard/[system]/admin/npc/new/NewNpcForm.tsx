"use client";

import NpcForm from "@/app/ui/npc/NpcForm";
import { useRouter } from "@/i18n/navigation";
import OptionBundle from "@/app/lib/definitions/types/OptionBundle";

export default function NewNpcForm({
  optionBundle,
}: {
  optionBundle: OptionBundle;
}) {
  const router = useRouter();
  const onCancel = () => {
    router.push("/dashboard/admin/npc");
  };
  const onSaveFinished = () => {
    router.push("/dashboard/admin/npc");
  };

  return (
    <NpcForm
      optionBundle={optionBundle}
      onCancel={onCancel}
      onSaveFinished={onSaveFinished}
    />
  );
}
