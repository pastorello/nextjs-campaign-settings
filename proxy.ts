import { getToken } from "next-auth/jwt";
import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  DEFAULT_GAME_SYSTEM,
  isGameSystem,
} from "./app/lib/definitions/GameSystem";
import dashboardAccess from "./app/lib/auth/dashboardAccess";
import { isPlayerPath } from "./app/lib/auth/playerPages";
import { authConfig } from "./auth.config";
import { DASHBOARD_ROOT } from "./i18n/dashboardPath";
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
    ? { locale: match[1] ?? routing.defaultLocale, rest: match[2] || "/" }
    : { locale: routing.defaultLocale, rest: pathname };
}

// ADR-0013 rule 3: a dashboard path whose next segment is not a game system
// (an old bookmark, a link that dropped the system) is the same path under
// the default system. Deterministic on purpose — no cookie, no "last system
// used" — so a link missing its system lands visibly on the default instead
// of silently on whatever was open. An unknown system gets the same
// treatment and ends in a 404 (`/dashboard/dnd5e/foo/spells`). Returns the
// redirect target, or null when the path needs none.
export function systemRedirectPath(pathname: string): string | null {
  const { rest } = splitLocale(pathname);
  if (rest !== DASHBOARD_ROOT && !rest.startsWith(`${DASHBOARD_ROOT}/`)) {
    return null;
  }
  const [segment] = rest.slice(DASHBOARD_ROOT.length + 1).split("/");
  if (isGameSystem(segment)) return null;

  const prefix = pathname.slice(0, pathname.length - rest.length);
  const tail = rest.slice(DASHBOARD_ROOT.length);
  return `${prefix}${DASHBOARD_ROOT}/${DEFAULT_GAME_SYSTEM}${tail}`;
}

// SPEC-022 T1: a Server Action's POST. It goes through to its action, which
// guards itself (`requireDm`). Rewriting it would break the one action a
// player needs, which is signing out.
function isServerAction(req: NextRequest) {
  return req.method === "POST" && req.headers.has("next-action");
}

function isDashboardPath(rest: string) {
  return rest === DASHBOARD_ROOT || rest.startsWith(`${DASHBOARD_ROOT}/`);
}

const signInPage = authConfig.pages?.signIn ?? "/login";

// The pages a signed-out request may reach: signing in, and asking for a DM
// account (SPEC-022 T4), which is created inactive.
const PUBLIC_PAGES = [signInPage, "/signup"];

// The login page in the request's locale, with a callbackUrl back to where
// the request was going.
function signInUrlFor(req: NextRequest, locale: string) {
  const signInUrl = req.nextUrl.clone();
  signInUrl.pathname =
    locale === routing.defaultLocale ? signInPage : `/${locale}${signInPage}`;
  signInUrl.searchParams.set("callbackUrl", req.nextUrl.href);
  return signInUrl;
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

  // Before the auth gate, so the login page's callbackUrl already names a
  // system: sign-in redirects from a Server Action, whose target Next
  // resolves server-side — a legacy callbackUrl would render the right page
  // under the wrong address. 307, not 308: a browser must not cache the
  // default system for a URL that may name another one later. `clone()`
  // keeps the query string.
  const systemPath = systemRedirectPath(req.nextUrl.pathname);
  if (systemPath) {
    const systemUrl = req.nextUrl.clone();
    systemUrl.pathname = systemPath;
    return NextResponse.redirect(systemUrl, 307);
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
    if (!PUBLIC_PAGES.includes(rest)) {
      return NextResponse.redirect(signInUrlFor(req, locale));
    }
  }

  // SPEC-022 T1 (ADR-0020): a player reaches only the dashboard pages whose
  // reads filter by their campaign (`PLAYER_PAGES`, opened one at a time by
  // T7/T8). The check is here, before anything renders, because a page's
  // data renders in parallel with its layout: a layout's refusal would still
  // send it. The role is read fresh from the row, since the token's is fixed
  // at sign-in.
  const { locale, rest } = splitLocale(req.nextUrl.pathname);
  if (token && isDashboardPath(rest)) {
    const access = await dashboardAccess(token);
    if (access === "none") {
      // Disabled or deleted since it signed in: signed out, in effect.
      return NextResponse.redirect(signInUrlFor(req, locale));
    }
    if (access === "player" && !isServerAction(req) && !isPlayerPath(rest)) {
      // Rewritten, not redirected, so the address bar keeps the URL that was
      // asked for. The target answers with `forbidden()`: a 403 page that
      // offers the way to sign out. A client navigation is rewritten the same
      // way, and its RSC payload carries that page and nothing else. The
      // proxy cannot tell a navigation from a document load, because Next
      // strips the RSC headers before it runs.
      return NextResponse.rewrite(new URL(`/${locale}/access-denied`, req.url));
    }
  }

  return intlResponse;
}

export const config = {
  // https://nextjs.org/docs/app/api-reference/file-conventions/proxy#matcher
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg)$).*)",
  ],
};
