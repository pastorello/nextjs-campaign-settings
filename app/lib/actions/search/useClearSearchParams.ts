"use client";

import { useRouter, usePathname } from "next/navigation";

export function useClearSearchParams() {
  const router = useRouter();
  const pathname = usePathname();

  const clearSearchParams = () => {
    router.replace(pathname);
  };

  return clearSearchParams;
}
