"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import addCampaignMember from "@/app/lib/data/campaigns/addCampaignMember";
import removeCampaignMember from "@/app/lib/data/campaigns/removeCampaignMember";
import type CampaignPlayers from "@/app/lib/definitions/interfaces/campaign/CampaignPlayers";
import type MutationResult from "@/app/lib/definitions/types/MutationResult";
import { notifyError, notifySuccess } from "@/app/lib/notifications/notify";
import { resolveFirstFieldError } from "@/app/lib/utils/i18n/resolveFieldErrors";
import useGameSystem from "@/app/lib/hooks/useGameSystem";
import { dashboardPath } from "@/i18n/dashboardPath";
import { Link, useRouter } from "@/i18n/navigation";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonSize from "@/app/ui/buttons/BaseButton/ButtonSize";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";
import Select from "@/app/ui/forms/inputs/Select";

/**
 * The campaign's group (SPEC-022 T5): its players, a way to add a player
 * account, and a way to take one out. What the group sees is T6's reveals;
 * here it is only who belongs to it.
 */
export default function CampaignPlayersSection({
  campaignId,
  players,
}: {
  campaignId: number;
  players: CampaignPlayers;
}) {
  const t = useTranslations("campaign.players");
  const tRoot = useTranslations();
  const router = useRouter();
  const system = useGameSystem();
  const [candidateId, setCandidateId] = useState(
    players.candidates[0]?.id ?? ""
  );
  const [busy, setBusy] = useState(false);

  const run = async (
    mutation: () => Promise<MutationResult>,
    success: string
  ) => {
    setBusy(true);
    try {
      const result = await mutation();
      if (!result.ok) {
        notifyError(
          resolveFirstFieldError(result.errors, tRoot) ??
            tRoot("accounts.failed")
        );
        return;
      }
      notifySuccess(success);
      router.refresh();
    } catch (error) {
      console.error("A campaign membership change failed:", error);
      notifyError(tRoot("accounts.failed"));
    } finally {
      setBusy(false);
    }
  };

  // The select keeps its value across a refresh; fall back to the first
  // candidate once the chosen one has joined.
  const selected = players.candidates.some(({ id }) => id === candidateId)
    ? candidateId
    : (players.candidates[0]?.id ?? "");

  return (
    <section aria-labelledby="campaign-players" className="mt-8 space-y-3">
      <h2 id="campaign-players" className="text-lg font-semibold">
        {t("title")}
      </h2>
      <p className="text-sm text-gray-700">{t("intro")}</p>
      {players.members.length === 0 ? (
        <p className="text-sm text-gray-600">{t("empty")}</p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-md border border-gray-200">
          {players.members.map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
            >
              <span>
                <span className="font-medium">{member.name}</span>{" "}
                <span className="text-gray-600">{member.email}</span>
                {!member.active && (
                  <span className="ml-2 text-gray-600">
                    ({tRoot("accounts.statuses.inactive")})
                  </span>
                )}
              </span>
              <BaseButton
                size={ButtonSize.small}
                variant={ButtonVariant.ghostDanger}
                disabled={busy}
                onClick={() =>
                  void run(
                    () =>
                      removeCampaignMember({ campaignId, userId: member.id }),
                    t("removed")
                  )
                }
              >
                {t("remove", { name: member.name })}
              </BaseButton>
            </li>
          ))}
        </ul>
      )}
      {players.candidates.length === 0 ? (
        <p className="text-sm text-gray-600">
          {t("noCandidates")}{" "}
          <Link
            href={dashboardPath(system, "/admin/accounts")}
            className="text-blue-700 underline"
          >
            {t("accountsLink")}
          </Link>
        </p>
      ) : (
        <div className="flex max-w-lg items-end gap-2">
          <Select
            label={t("candidate")}
            value={selected}
            onChange={(value) => setCandidateId(String(value))}
            options={players.candidates.map(({ id, name }) => ({
              value: id,
              label: name,
            }))}
          />
          <BaseButton
            disabled={busy || selected === ""}
            onClick={() =>
              void run(
                () => addCampaignMember({ campaignId, userId: selected }),
                t("added")
              )
            }
          >
            {t("add")}
          </BaseButton>
        </div>
      )}
    </section>
  );
}
