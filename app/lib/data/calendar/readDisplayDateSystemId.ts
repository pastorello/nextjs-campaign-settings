import { cookies } from "next/headers";

import {
  DISPLAY_DATE_SYSTEM_COOKIE,
  parseDisplayDateSystemId,
} from "@/app/lib/calendar/displayDateSystemCookie";

/**
 * The viewer's "show dates in" preference, read from the request in a
 * Server Component (SPEC-014 §5.2). Pair it with `fetchDateSystems` and
 * `resolveDisplayDateSystem` to get the system to render dates in; `null`
 * means "no preference", which resolves to the world default.
 */
export default async function readDisplayDateSystemId(): Promise<
  number | null
> {
  const cookieStore = await cookies();
  return parseDisplayDateSystemId(
    cookieStore.get(DISPLAY_DATE_SYSTEM_COOKIE)?.value
  );
}
