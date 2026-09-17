import { notFound } from "next/navigation";

import SideNav from "@/app/ui/dashboard/sidenav";
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

  return (
    <div className="flex h-screen flex-col md:flex-row md:overflow-hidden">
      <div className="w-full flex-none md:w-64">
        <SideNav />
      </div>
      <div className="grow p-6 md:overflow-y-auto md:p-12">{children}</div>
    </div>
  );
}
