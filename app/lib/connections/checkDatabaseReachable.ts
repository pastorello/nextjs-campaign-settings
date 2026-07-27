import prisma from "./prisma";
import isConnectionFailure from "../errors/isConnectionFailure";

/**
 * Describes where we are trying to connect, without leaking the password.
 *
 * `DATABASE_URL` is a connection string with credentials in it; only host and
 * port are ever printed.
 */
const describeTarget = (): string => {
  const url = process.env.DATABASE_URL;

  if (!url) return "an unset DATABASE_URL";

  try {
    const parsed = new URL(url);

    return `${parsed.hostname}:${parsed.port || "5432"}`;
  } catch {
    return "a malformed DATABASE_URL";
  }
};

/**
 * Asks the database whether it is there, once, at startup (TD-25).
 *
 * The failure this exists for: with Postgres stopped, the first symptom used to
 * be a React error boundary in the browser, mid-render, saying only that a
 * query had failed. Nothing said *connection refused*, or *nothing is listening
 * on 5432*, or *run docker-compose up*. TD-13 made the cause travel with the
 * error; this says it before a page has to discover it.
 *
 * Deliberately not a health check: it runs once, never in the request path, and
 * never blocks startup. An unreachable database is reported and the server
 * carries on — the pages will fail on their own terms, now with a message that
 * has already explained itself in the log.
 */
export default async function checkDatabaseReachable(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return true;
  } catch (error) {
    const target = describeTarget();

    if (isConnectionFailure(error)) {
      console.error(
        [
          "",
          `  ✖ Database unreachable at ${target}`,
          "",
          "    Nothing is listening there. Start it with:",
          "",
          "        docker-compose up -d",
          "",
          "    The app will keep running, but every page that reads data will fail.",
          "",
        ].join("\n")
      );
    } else {
      console.error(
        [
          "",
          `  ✖ Database at ${target} answered, but rejected the check:`,
          "",
          `    ${error instanceof Error ? error.message : String(error)}`,
          "",
          "    Usually one of: wrong credentials in DATABASE_URL, a database",
          "    that does not exist, or a schema that has not been migrated.",
          "    The message above says which — it is quoted rather than guessed.",
          "",
        ].join("\n")
      );
    }

    return false;
  }
}
