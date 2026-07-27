import { NextResponse } from "next/server";

import AppError from "./AppError";

/**
 * Maps a thrown error to the response a route handler should return.
 *
 * Each `AppError` carries its own `httpStatus`, so the mapping lives with the
 * error rather than being re-decided at every call site — which is how "not
 * found" ended up as a 500 in all four DELETE handlers.
 *
 * The cause is logged, never sent: the client gets the error's message, the
 * server keeps the stack. An error we did not raise is a 500 with a generic
 * message, because we cannot know it is safe to show.
 */
export default function toErrorResponse(error: unknown): NextResponse {
  if (error instanceof AppError) {
    if (error.httpStatus >= 500) {
      console.error(`${error.name}: ${error.message}`, error.cause ?? error);
    }

    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.httpStatus }
    );
  }

  console.error("Unhandled error in route handler:", error);

  return NextResponse.json(
    { success: false, error: "Errore interno del server" },
    { status: 500 }
  );
}
