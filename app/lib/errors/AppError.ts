/**
 * Base for the application's own errors (TD-13).
 *
 * The pattern this replaces threw away everything that mattered:
 *
 * ```ts
 * } catch (error) {
 *   console.error("Database Error:", error);
 *   throw new Error("Failed to fetch card data."); // the cause dies here
 * }
 * ```
 *
 * With Postgres stopped, `/dashboard` failed with nothing but *Failed to fetch
 * card data.* in a console otherwise full of React internals. The actual
 * reason — a refused connection — reached `console.error` on the server and was
 * discarded one line later, so diagnosing it meant checking `docker ps` by
 * hand.
 *
 * Every subclass takes `{ cause }`, so the original error travels with the
 * message instead of being logged and dropped.
 */
export default abstract class AppError extends Error {
  abstract readonly httpStatus: number;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    // Without this the name is "Error" for every subclass, which makes stack
    // traces and logs claim less than they know.
    this.name = new.target.name;
  }
}
