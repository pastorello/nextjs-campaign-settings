import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

const { classFind, classDelete, subclassCount, subclassFind, subclassDelete } =
  vi.hoisted(() => ({
    classFind: vi.fn(),
    classDelete: vi.fn(),
    subclassCount: vi.fn(),
    subclassFind: vi.fn(),
    subclassDelete: vi.fn(),
  }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: {
    dhClass: { findUnique: classFind, delete: classDelete },
    dhSubclass: {
      count: subclassCount,
      findUnique: subclassFind,
      delete: subclassDelete,
    },
  },
}));

import { DELETE as deleteClass } from "./route";
import { DELETE as deleteSubclass } from "../../subclasses/[id]/route";

const call = (handler: typeof deleteClass, id: string) =>
  handler(new Request(`http://localhost/api/x/${id}`), {
    params: Promise.resolve({ id }),
  });

// Invented content only (SPEC-018 §5).
describe("DELETE /api/classes/[id] and /api/subclasses/[id] (SPEC-021 T4, T5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    classFind.mockResolvedValue({ id: 7, name: "Lamplighter" });
    subclassFind.mockResolvedValue({ id: 11, name: "Glass Warden" });
    subclassCount.mockResolvedValue(0);
  });

  it.each([
    ["class", deleteClass, classDelete],
    ["subclass", deleteSubclass, subclassDelete],
  ] as const)(
    "refuses an unauthenticated %s delete without deleting",
    async (_what, handler, write) => {
      vi.mocked(auth).mockResolvedValue(null as never);

      expect((await call(handler, "7")).status).toBe(401);
      expect(write).not.toHaveBeenCalled();
    }
  );

  it.each([
    ["class", deleteClass],
    ["subclass", deleteSubclass],
  ] as const)("rejects a malformed %s id", async (_what, handler) => {
    expect((await call(handler, "abc")).status).toBe(400);
  });

  it.each([
    ["class", deleteClass, classFind],
    ["subclass", deleteSubclass, subclassFind],
  ] as const)(
    "answers 404 for a %s that does not exist",
    async (_what, handler, find) => {
      find.mockResolvedValue(null);

      expect((await call(handler, "99")).status).toBe(404);
    }
  );

  it.each([
    ["class", deleteClass, classDelete],
    ["subclass", deleteSubclass, subclassDelete],
  ] as const)("deletes a %s", async (_what, handler, write) => {
    const response = await call(handler, "7");

    expect(response.status).toBe(200);
    expect(write).toHaveBeenCalledWith({ where: { id: 7 } });
  });

  it("refuses a class that still has subclasses, naming how many", async () => {
    subclassCount.mockResolvedValue(2);

    const response = await call(deleteClass, "7");

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      refusal: { key: "classHasSubclasses", values: { count: 2 } },
    });
    expect(classDelete).not.toHaveBeenCalled();
  });

  it.each([
    ["class", deleteClass, classDelete],
    ["subclass", deleteSubclass, subclassDelete],
  ] as const)(
    "answers 500 when the %s delete fails",
    async (_what, handler, write) => {
      write.mockRejectedValue(new Error("down"));

      expect((await call(handler, "7")).status).toBe(500);
    }
  );
});
