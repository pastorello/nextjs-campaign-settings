import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Metadata } from "next";

import fetchDhDomainWithCards from "@/app/lib/data/dhDomains/fetchDhDomainWithCards";
import DhDomainHeader from "@/app/ui/dhDomains/DhDomainHeader";
import DhDomainCardsByLevel from "@/app/ui/dhDomainCards/DhDomainCardsByLevel";
import ResolvedRecordLinks from "@/app/ui/richText/ResolvedRecordLinks";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dhDomains.page");
  return { title: t("title") };
}

/**
 * A domain's page (SPEC-021 §5.2): the domain in its colour, with its emblem
 * and description, then its cards grouped by level as card views. The
 * `daggerheart` check is the `domains` layout's.
 */
export default async function DhDomainPage({
  params,
}: PageProps<"/[locale]/dashboard/[system]/domains/[id]">) {
  const { id: rawId, system } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const result = await fetchDhDomainWithCards(id);
  if (!result) notFound();

  const { domain, cards } = result;

  // Formatted description and feature texts: their record links resolve in
  // one batch (SPEC-019 T5).
  return (
    <ResolvedRecordLinks
      values={[domain.description, ...cards.map((card) => card.featureText)]}
      system={system}
    >
      <div className="flex w-full flex-col gap-6">
        <DhDomainHeader domain={domain} />
        {/* Levels are h2 under the domain's h1, card names h3. */}
        <DhDomainCardsByLevel cards={cards} />
      </div>
    </ResolvedRecordLinks>
  );
}
