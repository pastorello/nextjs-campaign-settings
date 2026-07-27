/**
 * Next's startup hook: `register()` runs once per server process, before any
 * request is handled.
 *
 * Used for one thing (TD-25) — asking the database whether it is reachable, so
 * a stopped Postgres announces itself in the terminal instead of surfacing as
 * an error boundary in the browser several seconds later.
 *
 * The guards matter:
 *
 * - **`nodejs` runtime only.** `register()` also runs on the edge runtime,
 *   where the Prisma client and `pg` do not exist.
 * - **Never during a build.** `next build` runs this file, and CI builds with a
 *   placeholder `DATABASE_URL` pointing at nothing. Checking there would print
 *   a scary, meaningless warning on every green build.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const { default: checkDatabaseReachable } =
    await import("./app/lib/connections/checkDatabaseReachable");

  await checkDatabaseReachable();
}
