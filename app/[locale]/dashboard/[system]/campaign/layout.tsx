import requireDmPage from "@/app/lib/auth/requireDmPage";

// SPEC-022 R15: the DM's alone. The proxy refuses a player before anything
// renders; this is the second layer, for when its check fails open
// (ADR-0020).
export default async function Layout({
  children,
}: LayoutProps<"/[locale]/dashboard/[system]/campaign">) {
  await requireDmPage();
  return children;
}
