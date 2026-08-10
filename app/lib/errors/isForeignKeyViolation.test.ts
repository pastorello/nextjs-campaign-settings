import { describe, expect, it } from "vitest";

import { Prisma } from "@/generated/prisma/client";
import isForeignKeyViolation from "./isForeignKeyViolation";

const p2003 = () =>
  new Prisma.PrismaClientKnownRequestError("Foreign key constraint failed", {
    code: "P2003",
    clientVersion: "test",
  });

describe("isForeignKeyViolation (SPEC-006 T8)", () => {
  it("is true for a Prisma P2003 error", () => {
    expect(isForeignKeyViolation(p2003())).toBe(true);
  });

  it("is false for a different Prisma error code", () => {
    const error = new Prisma.PrismaClientKnownRequestError("Not found", {
      code: "P2025",
      clientVersion: "test",
    });
    expect(isForeignKeyViolation(error)).toBe(false);
  });

  it("is false for a plain error", () => {
    expect(isForeignKeyViolation(new Error("connection lost"))).toBe(false);
  });

  it("is false for a non-error value", () => {
    expect(isForeignKeyViolation("nope")).toBe(false);
    expect(isForeignKeyViolation(null)).toBe(false);
  });
});
