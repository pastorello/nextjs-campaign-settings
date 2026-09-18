import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Metadata } from "next";

import fetchRootPlace from "@/app/lib/data/maps/fetchRootPlace";
import CreateWorldForm from "@/app/ui/geography/CreateWorldForm";
import PageTitle from "@/app/ui/typography/PageTitle";
import { Link } from "@/i18n/navigation";
import { dashboardPath } from "@/i18n/dashboardPath";
import { isGameSystem } from "@/app/lib/definitions/GameSystem";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("world.page");
  return { title: t("title") };
}

/**
 * "Create your world" (SPEC-004 §5.1/§10 M4). An empty installation offers
 * exactly one action here; once the root exists this page has nothing left
 * to offer of its own — no second-root path, no edit form — so it links out
 * to the map instead of being a dead end (TD-119). Descending into the tree
 * (M6/M7) is that separate page.
 */
export default async function WorldPage(
  props: PageProps<"/[locale]/dashboard/[system]/world">
) {
  const { system } = await props.params;
  if (!isGameSystem(system)) notFound();

  const t = await getTranslations("world.page");
  const root = await fetchRootPlace();

  return (
    <div>
      <PageTitle className="mb-4">{t("title")}</PageTitle>
      {root ? (
        <p>
          {t("exists", { title: root.title })}{" "}
          <Link
            href={dashboardPath(system, "/geography")}
            className="text-blue-600 underline"
          >
            {t("viewMapLink")}
          </Link>
        </p>
      ) : (
        <CreateWorldForm />
      )}
      {/* World-level pages beside the map (SPEC-014 §5.7). The calendar
          needs no root place, so it is offered before the world exists too. */}
      <ul className="mt-6 space-y-1">
        <li>
          <Link
            href={dashboardPath(system, "/world/calendar")}
            className="text-blue-600 underline"
          >
            {t("calendarLink")}
          </Link>
        </li>
      </ul>
    </div>
  );
}
