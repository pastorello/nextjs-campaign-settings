import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import PageTitle from "@/app/ui/typography/PageTitle";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("credits");
  return { title: t("title") };
}

const linkClassName = "text-blue-600 underline hover:text-blue-700";

/**
 * The credits view: the attribution the SRD 5.2.1's licence asks for wherever
 * its material is used (`docs/domain/licensing.md` §3, `NOTICE.md`).
 *
 * Shared by every system and open to a player (`PLAYER_PAGES`) — it reads
 * nothing from the database. The statement is the licence's own wording, so
 * it is the same English text in both catalogues; `credits.test.tsx` holds it
 * equal to `NOTICE.md`'s.
 */
export default async function CreditsPage() {
  const t = await getTranslations("credits");

  return (
    <div className="w-full">
      <PageTitle className="mb-6">{t("title")}</PageTitle>
      <section aria-labelledby="credits-srd" className="max-w-2xl">
        <h2 id="credits-srd" className="mb-2 text-lg font-semibold">
          {t("srd.heading")}
        </h2>
        <p className="mb-4 text-gray-700">{t("srd.usedFor")}</p>
        <blockquote
          lang="en"
          className="border-l-4 border-gray-300 pl-4 text-gray-800"
        >
          <p>
            {t.rich("srd.statement", {
              source: (chunks) => (
                <a
                  href="https://www.dndbeyond.com/srd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClassName}
                >
                  {chunks}
                </a>
              ),
              licence: (chunks) => (
                <a
                  href="https://creativecommons.org/licenses/by/4.0/legalcode"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClassName}
                >
                  {chunks}
                </a>
              ),
            })}
          </p>
        </blockquote>
      </section>
    </div>
  );
}
