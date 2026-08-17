import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import validDeityFixture from "./validDeityFixture";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { deities: { create } },
}));

import createDeity from "./createDeity";

const validFormData = validDeityFixture;

describe("createDeity (TD-80)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
  });

  it("rejects an unauthenticated request without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(createDeity(validFormData)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(create).not.toHaveBeenCalled();
  });

  it("creates the deity on valid input", async () => {
    create.mockResolvedValue({});

    const result = await createDeity(validFormData);

    expect(result).toEqual({ ok: true });
    expect(create).toHaveBeenCalledWith({
      data: {
        name: validFormData.name,
        deityTitle: validFormData.deityTitle,
        deityType: validFormData.deityType,
        deityRank: validFormData.deityRank,
        tarotCard: validFormData.tarotCard,
        celestialBody: validFormData.celestialBody,
        element: validFormData.element,
        class: validFormData.class,
        holidays: validFormData.holidays,
        color: validFormData.color,
        tradition: validFormData.tradition,
        alignment: validFormData.alignment,
        alignmentDomain: validFormData.alignmentDomain,
        meaning: validFormData.meaning,
      },
    });
  });

  it("rejects a payload with an out-of-range option value, without writing", async () => {
    const result = await createDeity({ ...validFormData, deityType: 99999 });

    expect(result.ok).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });
});
