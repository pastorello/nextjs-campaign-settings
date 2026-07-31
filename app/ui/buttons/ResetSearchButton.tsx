"use client";

import { useTranslations } from "next-intl";
import { useClearSearchParams } from "@/app/lib/actions/search/useClearSearchParams";
import BaseButton from "./BaseButton";

export function ResetButton() {
  const t = useTranslations("common.filters");
  const clearSearchParams = useClearSearchParams();

  return <BaseButton onClick={clearSearchParams}>{t("reset")}</BaseButton>;
}
