import { forbidden } from "next/navigation";

/**
 * Where the proxy rewrites a player's dashboard request (SPEC-022 T1). It has
 * no content of its own: it answers with `forbidden()`, so the response is
 * `forbidden.tsx`, a 403 carrying no page data. A rewrite, not a redirect,
 * keeps the requested URL in the address bar.
 */
export default function AccessDenied(): never {
  forbidden();
}
