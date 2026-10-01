import { describe, expect, it } from "vitest";

import { Prisma } from "@/generated/prisma/client";
import isUniqueViolation from "./isUniqueViolation";

const known = (code: string) =>
  new Prisma.PrismaClientKnownRequestError("failed", {
    code,
    clientVersion: "test",
  });

describe("isUniqueViolation (SPEC-022 T3)", () => {
  it("is true for a Prisma P2002 error", () => {
    expect(isUniqueViolation(known("P2002"))).toBe(true);
  });

  it("is false for another Prisma error code, a plain error or a non-error", () => {
    expect(isUniqueViolation(known("P2003"))).toBe(false);
    expect(isUniqueViolation(new Error("connection lost"))).toBe(false);
    expect(isUniqueViolation("nope")).toBe(false);
  });
});
