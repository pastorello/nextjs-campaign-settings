import { DEFAULT_GAME_SYSTEM } from "@/app/lib/definitions/GameSystem";
import { dashboardPath } from "@/i18n/dashboardPath";
import { redirect } from "@/i18n/navigation";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: dashboardPath(DEFAULT_GAME_SYSTEM), locale });
}
