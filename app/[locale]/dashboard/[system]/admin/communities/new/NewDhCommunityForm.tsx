"use client";

import DhCommunityForm from "@/app/ui/dhCommunities/DhCommunityForm";
import { useRouter } from "@/i18n/navigation";
import useGameSystem from "@/app/lib/hooks/useGameSystem";
import { dashboardPath } from "@/i18n/dashboardPath";
import OptionBundle from "@/app/lib/definitions/types/OptionBundle";

export default function NewDhCommunityForm({
  optionBundle,
}: {
  optionBundle: OptionBundle;
}) {
  const router = useRouter();
  const system = useGameSystem();
  const backToList = () => {
    router.push(dashboardPath(system, "/admin/communities"));
  };

  return (
    <DhCommunityForm
      optionBundle={optionBundle}
      onCancel={backToList}
      onSaveFinished={backToList}
    />
  );
}
