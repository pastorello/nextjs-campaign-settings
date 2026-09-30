import { notFound } from "next/navigation";

import SideNav from "@/app/ui/dashboard/sidenav";
import requireDmPage from "@/app/lib/auth/requireDmPage";
import { isGameSystem } from "@/app/lib/definitions/GameSystem";

/**
 * Every dashboard page sits under the game-system segment (ADR-0013 rule 2).
 * An unknown system is a 404 here, so nothing below needs to check it again —
 * `proxy.ts` has already inserted the default for URLs that lack one.
 */
export default async function Layout({
  children,
  params,
}: LayoutProps<"/[locale]/dashboard/[system]">) {
  const { system } = await params;
  if (!isGameSystem(system)) notFound();
  // SPEC-022 T1: the whole dashboard is the DM's until T7/T8 open its read
  // pages to players, each once it filters what a campaign may see. The
  // proxy is the boundary: it rewrites a player to the 403 page before
  // anything renders. This is the second layer, for when its check fails
  // open. It cannot keep the page's data out of the response on its own,
  // since a page renders in parallel with its layout (ADR-0020).
  await requireDmPage();

  return (
    <div className="flex h-screen flex-col md:flex-row md:overflow-hidden">
      <div className="w-full flex-none md:w-64">
        <SideNav />
      </div>
      <div className="grow p-6 md:overflow-y-auto md:p-12">{children}</div>
    </div>
  );
}
