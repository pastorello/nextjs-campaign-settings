import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Metadata } from "next";

import fetchAdventureWithScenes from "@/app/lib/data/campaigns/fetchAdventureWithScenes";
import fetchFieldOptions from "@/app/lib/data/options/fetchFieldOptions";
import { CurrencyUnit } from "@/app/lib/utils/currency/convertCurrency";
import AdventureHeader from "@/app/ui/campaigns/AdventureHeader";
import SceneList from "@/app/ui/campaigns/SceneList";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("adventure.page");
  return { title: t("title") };
}

interface AdventurePageProps {
  params: Promise<{ adventureId: string }>;
}

/**
 * The adventure page (SPEC-013 §5.3/§5.4, T8): the adventure's own
 * information plus its scenes, each with its own creatures and loot, all
 * in position order. Outside the metadata layer (ADR-0011) — bespoke
 * components under `app/ui/campaigns/`, same shape as the campaign page
 * (T7). The budget panel and the awarded/taken check-off controls are T9's,
 * not built here.
 */
export default async function AdventurePage({ params }: AdventurePageProps) {
  const { adventureId } = await params;
  const id = Number(adventureId);

  if (!Number.isInteger(id) || id <= 0) notFound();

  const adventure = await fetchAdventureWithScenes(id);
  if (!adventure) notFound();

  const [zoneOptions, npcOptions, magicItemOptions, treasureOptions] =
    await Promise.all([
      fetchFieldOptions("zone"),
      fetchFieldOptions("npc"),
      fetchFieldOptions("magicitems"),
      fetchFieldOptions("treasure"),
    ]);

  const currencyUnit = (adventure.currencyUnit ?? "silver") as CurrencyUnit;

  return (
    <div>
      <AdventureHeader adventure={adventure} />
      <SceneList
        adventureId={adventure.id}
        scenes={adventure.scenes}
        currencyUnit={currencyUnit}
        zoneOptions={zoneOptions}
        npcOptions={npcOptions}
        magicItemOptions={magicItemOptions}
        treasureOptions={treasureOptions}
      />
    </div>
  );
}
