import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import CardWrapper from "@/app/ui/dashboard/cards";
import { lusitana } from "@/app/ui/fonts";
import { Suspense } from "react";
import { CardsSkeleton } from "@/app/ui/skeletons";
import { isGameSystem } from "@/app/lib/definitions/GameSystem";
import getViewer from "@/app/lib/auth/getViewer";
import { dashboardPath } from "@/i18n/dashboardPath";
import { redirect } from "@/i18n/navigation";

// The cards below are live record counts. Without this the page has no dynamic
// input — no searchParams, no cookies — so Next prerenders it at build time and
// the counts freeze at whatever the database held when the build ran. Adding a
// spell would never change the number. It also means the build needs a reachable
// database, which is why CI's build job could not pass.
//
// Every sibling page under /dashboard is dynamic already, but only by accident:
// they read searchParams. This one has to say so.
export const dynamic = "force-dynamic";

export default async function Page(
  props: PageProps<"/[locale]/dashboard/[system]">
) {
  const { locale, system } = await props.params;
  if (!isGameSystem(system)) notFound();

  // SPEC-022 T7: the counts below are not filtered yet (T8), so a player is
  // sent on to the map of the campaign they are viewing, under its system,
  // before anything is read. This is also where a player lands after
  // signing in. Without a campaign, the map page says so.
  const viewer = await getViewer();
  if (viewer?.kind === "player") {
    redirect({
      href: dashboardPath(viewer.campaign?.system ?? system, "/geography"),
      locale,
    });
  }

  const t = await getTranslations("common.dashboard");

  return (
    <main data-testid="dashboard-page">
      <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        {t("title")}
      </h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Suspense fallback={<CardsSkeleton />}>
          <CardWrapper system={system} />
        </Suspense>
      </div>
    </main>
  );
}
