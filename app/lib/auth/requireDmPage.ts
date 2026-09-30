import { forbidden } from "next/navigation";
import { getLocale } from "next-intl/server";
import { cache } from "react";

import { auth } from "@/auth";
import { redirect } from "@/i18n/navigation";

/**
 * Guard for pages only the DM may see (SPEC-022). Call it from a Server
 * Component and `await` it: it throws, through Next's `forbidden()`, for a
 * player, which renders `forbidden.tsx` with a 403.
 *
 * It is not the boundary for a page's data. Called from a layout, it runs in
 * parallel with the page, whose data still reaches the response. The proxy's
 * rewrite is what keeps a player's 403 empty (ADR-0020).
 *
 * Without a session it sends the request to the login page. The proxy lets
 * a token through that `auth()` then refuses: an account disabled or
 * deleted since it signed in.
 *
 * Cached per request, so a layout and a page may both call it for one read
 * of the account.
 */
const requireDmPage = cache(async (): Promise<void> => {
  const session = await auth();
  if (!session?.user) {
    redirect({ href: "/login", locale: await getLocale() });
    return;
  }
  if (session.user.role !== "dm") forbidden();
});

export default requireDmPage;
