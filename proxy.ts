import { getToken } from "next-auth/jwt";
import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { authConfig } from "./auth.config";
import { routing } from "./i18n/routing";

const handleI18nRouting = createMiddleware(routing);
const localePattern = new RegExp(`^/(${routing.locales.join("|")})(/.*|$)`);

const authSecret: string = (() => {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET must be set");
  return value;
})();

function isRedirect(response: Response) {
  return response.status >= 300 && response.status < 400;
}

// Splits a possibly locale-prefixed pathname into its locale (the routing
// default, "it", when unprefixed under localePrefix "as-needed") and the
// path that follows it — so the auth gate below can compare against
// authConfig.pages.signIn ("/login") regardless of which locale served it.
function splitLocale(pathname: string) {
  const match = pathname.match(localePattern);
  return match
    ? { locale: match[1], rest: match[2] || "/" }
    : { locale: routing.defaultLocale, rest: pathname };
}

export default async function proxy(req: NextRequest) {
  const intlResponse = handleI18nRouting(req);
  // Let next-intl's own locale redirect (e.g. a stored locale cookie
  // pointing at "en" for an unprefixed URL) resolve first — Accept-Language
  // no longer drives this since routing.localeDetection is false. The auth
  // gate below runs again on the follow-up, already-prefixed request —
  // running it here too would compare a locale-prefixed pathname against
  // the unprefixed authConfig.pages.signIn and loop the two redirects
  // against each other.
  if (isRedirect(intlResponse)) {
    return intlResponse;
  }

  // NextAuth's `auth()` wrapper redirects internally, but its check is a
  // literal `pathname !== authConfig.pages.signIn`, which never matches a
  // locale-prefixed login path (`/en/login`) — so it's replicated here,
  // locale-aware, using `getToken` (session read only, no redirect side
  // effect) instead (TD-01's gate).
  const token = await getToken({ req, secret: authSecret });
  const isAuthorized = authConfig.callbacks.authorized({
    auth: token ? { user: token, expires: "" } : null,
  } as never);

  if (!isAuthorized) {
    const { locale, rest } = splitLocale(req.nextUrl.pathname);
    const signInPage = authConfig.pages?.signIn ?? "/login";
    if (rest !== signInPage) {
      const signInUrl = req.nextUrl.clone();
      signInUrl.pathname =
        locale === routing.defaultLocale
          ? signInPage
          : `/${locale}${signInPage}`;
      signInUrl.searchParams.set("callbackUrl", req.nextUrl.href);
      return NextResponse.redirect(signInUrl);
    }
  }

  return intlResponse;
}

export const config = {
  // https://nextjs.org/docs/app/api-reference/file-conventions/proxy#matcher
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
