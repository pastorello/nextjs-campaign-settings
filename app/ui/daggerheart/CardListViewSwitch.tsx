"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import BaseButton from "../buttons/BaseButton";
import ButtonSize from "../buttons/BaseButton/ButtonSize";
import ButtonState from "../buttons/BaseButton/ButtonState";

/** The URL parameter the switch writes, and its two values. */
export const VIEW_PARAM = "view";
export type CardListView = "rows" | "cards";

/** The list's view from its search params: rows unless `view=cards`. */
export function cardListView(value: string | null | undefined): CardListView {
  return value === "cards" ? "cards" : "rows";
}

/**
 * Switches a Daggerheart catalogue list between rows and a grid of card
 * views: domain cards (SPEC-021 §5.3), ancestries and communities (SPEC-027
 * §5.3). The choice lives in the URL (`?view=cards`), so it
 * survives a reload, a filter change and a shared link; rows are the default
 * and write no parameter.
 */
export default function CardListViewSwitch() {
  const t = useTranslations("daggerheart.view");
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const current = cardListView(searchParams.get(VIEW_PARAM));

  const select = (view: CardListView) => {
    const params = new URLSearchParams(searchParams);
    if (view === "cards") params.set(VIEW_PARAM, view);
    else params.delete(VIEW_PARAM);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <div role="group" aria-label={t("label")} className="flex gap-2">
      {(["rows", "cards"] as const).map((view) => (
        <BaseButton
          key={view}
          isToggle
          size={ButtonSize.small}
          buttonState={
            current === view ? ButtonState.Active : ButtonState.Default
          }
          onClick={() => select(view)}
        >
          {t(view)}
        </BaseButton>
      ))}
    </div>
  );
}
