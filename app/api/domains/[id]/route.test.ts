import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

const { findUnique, remove, cardCount, classCount, cardFind, cardDelete } =
  vi.hoisted(() => ({
    findUnique: vi.fn(),
    remove: vi.fn(),
    cardCount: vi.fn(),
    classCount: vi.fn(),
    cardFind: vi.fn(),
    cardDelete: vi.fn(),
  }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: {
    dhDomain: { findUnique, delete: remove },
    dhDomainCard: {
      count: cardCount,
      findUnique: cardFind,
      delete: cardDelete,
    },
    dhClass: { count: classCount },
  },
}));
vi.mock("@/app/lib/data/recordImages/deleteRecordImage", () => ({
  default: vi.fn(),
}));

import { DELETE as deleteDomain } from "./route";
import { DELETE as deleteCard } from "../../domain-cards/[id]/route";

const call = (handler: typeof deleteDomain, id: string) =>
  handler(new Request(`http://localhost/api/x/${id}`), {
    params: Promise.resolve({ id }),
  });

describe("DELETE /api/domains/[id] and /api/domain-cards/[id] (SPEC-021)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    findUnique.mockResolvedValue({ id: 3, name: "Veilwright", imageId: null });
    cardFind.mockResolvedValue({ id: 8, name: "Lantern Step" });
    cardCount.mockResolvedValue(0);
    classCount.mockResolvedValue(0);
  });

  it.each([
    ["domain", deleteDomain, remove],
    ["card", deleteCard, cardDelete],
  ] as const)(
    "refuses an unauthenticated %s delete without deleting",
    async (_what, handler, write) => {
      vi.mocked(auth).mockResolvedValue(null as never);

      expect((await call(handler, "3")).status).toBe(401);
      expect(write).not.toHaveBeenCalled();
    }
  );

  it("deletes an unused domain", async () => {
    const response = await call(deleteDomain, "3");

    expect(response.status).toBe(200);
    expect(remove).toHaveBeenCalledWith({ where: { id: 3 } });
  });

  it("answers 409 with a keyed refusal for a domain in use", async () => {
    cardCount.mockResolvedValue(2);

    const response = await call(deleteDomain, "3");

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      success: false,
      refusal: { key: "dhDomainInUse", values: { cards: 2, classes: 0 } },
    });
    expect(remove).not.toHaveBeenCalled();
  });

  it("deletes a card", async () => {
    const response = await call(deleteCard, "8");

    expect(response.status).toBe(200);
    expect(cardDelete).toHaveBeenCalledWith({ where: { id: 8 } });
  });

  it("answers 404 for a missing card", async () => {
    cardFind.mockResolvedValue(null);

    expect((await call(deleteCard, "8")).status).toBe(404);
  });
});
