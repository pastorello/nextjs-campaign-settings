import { describe, expect, it } from "vitest";

import isConnectionFailure from "./isConnectionFailure";

describe("isConnectionFailure", () => {
  it.each([
    [
      "a driver error with a code",
      Object.assign(new Error("nope"), { code: "ECONNREFUSED" }),
    ],
    [
      "a message that names the code",
      new Error("connect ECONNREFUSED 127.0.0.1:5432"),
    ],
    [
      "an unresolvable host",
      Object.assign(new Error("nope"), { code: "ENOTFOUND" }),
    ],
    [
      "an error Prisma has wrapped",
      new Error("query failed", {
        cause: new Error("connect ECONNREFUSED 127.0.0.1:5432"),
      }),
    ],
    [
      "a cause nested two deep",
      new Error("outer", {
        cause: new Error("middle", {
          cause: Object.assign(new Error("inner"), { code: "ETIMEDOUT" }),
        }),
      }),
    ],
  ])("recognises %s", (_label, error) => {
    expect(isConnectionFailure(error)).toBe(true);
  });

  it.each([
    [
      "a constraint violation",
      new Error("duplicate key value violates unique constraint"),
    ],
    [
      "a missing column",
      new Error('column "nome" of relation "spells" does not exist'),
    ],
    ["a plain string", "ECONNREFUSED"],
    ["null", null],
    ["undefined", undefined],
    ["an empty object", {}],
  ])("does not claim %s", (_label, error) => {
    // A string containing the code is not an error object — treating it as one
    // would make the check fire on any message that quotes a log line.
    expect(isConnectionFailure(error)).toBe(false);
  });

  it("does not loop forever on a self-referencing cause", () => {
    const error: Error & { cause?: unknown } = new Error("round");
    error.cause = error;

    expect(isConnectionFailure(error)).toBe(false);
  });
});
