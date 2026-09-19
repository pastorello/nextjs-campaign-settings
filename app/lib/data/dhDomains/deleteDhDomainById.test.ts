import { beforeEach, describe, expect, it, vi } from "vitest";

import ConflictError from "@/app/lib/errors/ConflictError";
import NotFoundError from "@/app/lib/errors/NotFoundError";

const { domainFind, domainDelete, cardCount, classCount, deleteRecordImage } =
  vi.hoisted(() => ({
    domainFind: vi.fn(),
    domainDelete: vi.fn(),
    cardCount: vi.fn(),
    classCount: vi.fn(),
    deleteRecordImage: vi.fn(),
  }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: {
    dhDomain: { findUnique: domainFind, delete: domainDelete },
    dhDomainCard: { count: cardCount },
    dhClass: { count: classCount },
  },
}));
vi.mock("@/app/lib/data/recordImages/deleteRecordImage", () => ({
  default: deleteRecordImage,
}));

import { deleteDhDomainById } from "./deleteDhDomainById";

describe("deleteDhDomainById (SPEC-021 T2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    domainFind.mockResolvedValue({ id: 3, name: "Veilwright", imageId: null });
    cardCount.mockResolvedValue(0);
    classCount.mockResolvedValue(0);
    domainDelete.mockResolvedValue({});
  });

  it("deletes an unused domain", async () => {
    await deleteDhDomainById(3);

    expect(domainDelete).toHaveBeenCalledWith({ where: { id: 3 } });
  });

  it("counts classes holding the domain in either slot", async () => {
    await deleteDhDomainById(3);

    expect(cardCount).toHaveBeenCalledWith({ where: { domainId: 3 } });
    expect(classCount).toHaveBeenCalledWith({
      where: { OR: [{ domainAId: 3 }, { domainBId: 3 }] },
    });
  });

  it("refuses a domain cards and classes use, naming how many, and deletes nothing", async () => {
    cardCount.mockResolvedValue(4);
    classCount.mockResolvedValue(1);

    const refusal = await deleteDhDomainById(3).catch(
      (error: unknown) => error
    );

    expect(refusal).toBeInstanceOf(ConflictError);
    expect((refusal as ConflictError).refusal).toEqual({
      key: "dhDomainInUse",
      values: { cards: 4, classes: 1 },
    });
    expect(domainDelete).not.toHaveBeenCalled();
  });

  it("refuses a domain only cards use", async () => {
    cardCount.mockResolvedValue(2);

    await expect(deleteDhDomainById(3)).rejects.toBeInstanceOf(ConflictError);
    expect(domainDelete).not.toHaveBeenCalled();
  });

  it("refuses a domain only a class uses", async () => {
    classCount.mockResolvedValue(1);

    await expect(deleteDhDomainById(3)).rejects.toBeInstanceOf(ConflictError);
    expect(domainDelete).not.toHaveBeenCalled();
  });

  it("is a NotFoundError for a missing domain", async () => {
    domainFind.mockResolvedValue(null);

    await expect(deleteDhDomainById(9)).rejects.toBeInstanceOf(NotFoundError);
    expect(domainDelete).not.toHaveBeenCalled();
  });

  it("deletes the emblem with the domain", async () => {
    domainFind.mockResolvedValue({ id: 3, name: "Veilwright", imageId: 12 });

    await deleteDhDomainById(3);

    expect(deleteRecordImage).toHaveBeenCalledWith(12);
  });
});
