import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const PrismaClientMock = vi.fn();
const PrismaPgMock = vi.fn();

vi.mock("@/generated/prisma/client", () => ({
  PrismaClient: PrismaClientMock,
}));

vi.mock("@prisma/adapter-pg", () => ({
  PrismaPg: PrismaPgMock,
}));

// The singleton wires a real adapter and client together, so it is exercised
// here the same way `env.test.ts` exercises `env.ts`: with a fresh module
// instance per case, since both parse/construct once at import time.
describe("prisma", () => {
  const ORIGINAL_ENV = process.env;
  const globalForPrisma = global as unknown as { prisma?: unknown };

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...ORIGINAL_ENV, DATABASE_URL: "postgresql://u:p@localhost:5432/db" }; // prettier-ignore
    delete globalForPrisma.prisma;
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    delete globalForPrisma.prisma;
  });

  it("builds the pg adapter from the validated DATABASE_URL", async () => {
    await import("./prisma");

    expect(PrismaPgMock).toHaveBeenCalledWith({
      connectionString: "postgresql://u:p@localhost:5432/db",
    });
  });

  it("constructs the client with the adapter", async () => {
    const adapterInstance = { marker: "adapter" };
    PrismaPgMock.mockImplementation(function (this: object) {
      return adapterInstance;
    });

    await import("./prisma");

    expect(PrismaClientMock).toHaveBeenCalledWith({ adapter: adapterInstance });
  });

  it("reuses the global instance across module reloads outside production", async () => {
    const first = await import("./prisma");
    vi.resetModules();
    const second = await import("./prisma");

    expect(PrismaClientMock).toHaveBeenCalledTimes(1);
    expect(second.default).toBe(first.default);
  });
});
