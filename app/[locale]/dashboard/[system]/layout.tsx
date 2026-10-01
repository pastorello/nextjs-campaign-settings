import { notFound } from "next/navigation";

import SideNav from "@/app/ui/dashboard/sidenav";
import getViewer from "@/app/lib/auth/getViewer";
import { isGameSystem } from "@/app/lib/definitions/GameSystem";
import { redirect } from "@/i18n/navigation";

/**
 * Every dashboard page sits under the game-system segment (ADR-0013 rule 2).
 * An unknown system is a 404 here, so nothing below needs to check it again —
 * `proxy.ts` has already inserted the default for URLs that lack one.
 */
export default async function Layout({
  children,
  params,
}: LayoutProps<"/[locale]/dashboard/[system]">) {
  const { locale, system } = await params;
  if (!isGameSystem(system)) notFound();
  // SPEC-022 T7: any active account, since a player now reads some of the
  // dashboard. Which pages is the proxy's to decide (`PLAYER_PAGES`), before
  // anything renders; the sections only the DM ever sees add `requireDmPage`
  // in their own layouts as a second layer (ADR-0020). Without a session (an
  // account disabled since it signed in) this is the login page.
  const viewer = await getViewer();
  if (!viewer) {
    redirect({ href: "/login", locale });
    return null;
  }
  // SPEC-022 §8: a player reaches only the systems of their campaigns. One
  // in no campaign reads the rules catalogues of either.
  if (
    viewer.kind === "player" &&
    viewer.campaigns.length > 0 &&
    !viewer.campaigns.some((campaign) => campaign.system === system)
  ) {
    notFound();
  }

  return (
    <div className="flex h-screen flex-col md:flex-row md:overflow-hidden">
      <div className="w-full flex-none md:w-64">
        <SideNav viewer={viewer} />
      </div>
      <div className="grow p-6 md:overflow-y-auto md:p-12">{children}</div>
    </div>
  );
}
