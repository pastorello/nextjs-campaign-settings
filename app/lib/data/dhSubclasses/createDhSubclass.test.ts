import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import DhSubclass from "@/app/lib/definitions/interfaces/daggerheart/DhSubclass";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { create, update } = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { dhSubclass: { create, update } },
}));

import createDhSubclass from "./createDhSubclass";
import updateDhSubclass from "./updateDhSubclass";

// Invented content only (SPEC-018 §5).
const validFormData: DhSubclass = {
  id: 0,
  classId: 4,
  name: "Keeper of Embers",
  // What the form sends for an empty description, as for every domain.
  description: "",
  spellcastTrait: "none",
  origin: "homebrew",
};

describe("subclass actions (SPEC-021 T5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    create.mockResolvedValue({});
    update.mockResolvedValue({});
  });

  it("rejects an unauthenticated create or update without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(createDhSubclass(validFormData)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    await expect(
      updateDhSubclass({ ...validFormData, id: 2 })
    ).rejects.toBeInstanceOf(UnauthorizedError);
    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it('stores "none" as a null spellcast trait', async () => {
    const result = await createDhSubclass(validFormData);

    expect(result).toEqual({ ok: true });
    const [{ data }] = create.mock.calls[0] as [{ data: DhSubclass }];
    expect(data.classId).toBe(4);
    expect(data.spellcastTrait).toBeNull();
  });

  it("stores a spellcast trait as itself", async () => {
    await createDhSubclass({ ...validFormData, spellcastTrait: "instinct" });

    const [{ data }] = create.mock.calls[0] as [{ data: DhSubclass }];
    expect(data.spellcastTrait).toBe("instinct");
  });

  it("refuses a spellcast trait outside the six", async () => {
    const result = await createDhSubclass({
      ...validFormData,
      spellcastTrait: "charm",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.spellcastTrait).toBeDefined();
    expect(create).not.toHaveBeenCalled();
  });

  it("refuses a subclass with no class", async () => {
    const result = await createDhSubclass({ ...validFormData, classId: null });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.classId).toBeDefined();
    expect(create).not.toHaveBeenCalled();
  });

  it('clears the trait on update when set back to "none"', async () => {
    const result = await updateDhSubclass({
      id: 2,
      spellcastTrait: "none",
    } as DhSubclass);

    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({
      where: { id: 2 },
      data: { spellcastTrait: null },
    });
  });

  it("leaves the trait alone when an update does not touch it", async () => {
    await updateDhSubclass({ id: 2, name: "Ember Keeper" } as DhSubclass);

    expect(update).toHaveBeenCalledWith({
      where: { id: 2 },
      data: { name: "Ember Keeper" },
    });
  });
});
