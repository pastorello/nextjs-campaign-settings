import { describe, expect, it } from "vitest";

import AppError from "./AppError";
import DatabaseError from "./DatabaseError";
import NotFoundError from "./NotFoundError";

describe("DatabaseError", () => {
  it("keeps the original error as its cause", () => {
    // The whole point of TD-13. The old code did `console.error(error)` and
    // then threw a fresh Error, so "ECONNREFUSED" never reached the reader.
    const cause = new Error("connect ECONNREFUSED 127.0.0.1:5432");

    const error = new DatabaseError("fetching spells", cause);

    expect(error.cause).toBe(cause);
    expect(error.message).toContain("fetching spells");
  });

  it("is a 500", () => {
    expect(new DatabaseError("x", new Error("y")).httpStatus).toBe(500);
  });

  it("reports its own class name", () => {
    // Without `this.name = new.target.name` every subclass logs as "Error".
    expect(new DatabaseError("x", new Error("y")).name).toBe("DatabaseError");
  });
});

describe("NotFoundError", () => {
  it("is a 404, not a 500", () => {
    // The four delete functions returned a boolean, so a missing record and a
    // failed query were indistinguishable and both became 500.
    expect(new NotFoundError("Incantesimo", 42).httpStatus).toBe(404);
  });

  it("names the resource and the id it looked for", () => {
    expect(new NotFoundError("Incantesimo", 42).message).toBe(
      "Incantesimo 42 not found"
    );
  });
});

describe("AppError", () => {
  it("is catchable as a single family", () => {
    const errors: unknown[] = [
      new NotFoundError("x", 1),
      new DatabaseError("y", new Error("z")),
    ];

    for (const error of errors) {
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(Error);
    }
  });
});
