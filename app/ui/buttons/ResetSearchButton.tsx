"use client";

import { useClearSearchParams } from "@/app/lib/actions/search/useClearSearchParams";
import BaseButton from "./BaseButton";

export function ResetButton() {
  const clearSearchParams = useClearSearchParams();

  return <BaseButton onClick={clearSearchParams}>Reset Filtri</BaseButton>;
}
