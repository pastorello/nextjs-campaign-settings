import assertPageSystem from "@/app/lib/config/assertPageSystem";
import requireDmPage from "@/app/lib/auth/requireDmPage";
import PageType from "@/app/lib/definitions/types/PageType";

// A Daggerheart catalogue: a 404 under any other system (ADR-0013 rule 4).
// A GM-side stat block, the DM's alone (SPEC-028 §9 decision 3): the proxy
// refuses a player first, and this is the second layer (ADR-0020).
export default async function Layout({
  children,
  params,
}: LayoutProps<"/[locale]/dashboard/[system]/adversaries">) {
  assertPageSystem(PageType.DhAdversary, (await params).system);
  await requireDmPage();
  return children;
}
