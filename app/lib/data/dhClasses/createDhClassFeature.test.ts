import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { create, update } = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { dhClassFeature: { create, update } },
}));

import createDhClassFeature from "./createDhClassFeature";
import updateDhClassFeature from "./updateDhClassFeature";

// Invented content only (SPEC-018 §5).
const feature = {
  classId: 4,
  position: 2,
  name: "Second Wind",
  text: "<p>Breathe, then go on.</p>",
};

describe("class feature inline editing (SPEC-021 T4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    create.mockResolvedValue({});
    update.mockResolvedValue({});
  });

  it("rejects an unauthenticated create or update without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(createDhClassFeature(feature)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    await expect(
      updateDhClassFeature({ id: 1, name: "X" })
    ).rejects.toBeInstanceOf(UnauthorizedError);
    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it("adds a feature to its class at the given position", async () => {
    const result = await createDhClassFeature(feature);

    expect(result).toEqual({ ok: true });
    expect(create).toHaveBeenCalledWith({ data: feature });
  });

  it("refuses a feature with no name or no words", async () => {
    const result = await createDhClassFeature({
      ...feature,
      name: "",
      text: "<p> </p>",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.name).toBeDefined();
    expect(result.errors.text).toBeDefined();
    expect(create).not.toHaveBeenCalled();
  });

  it("refuses a feature with no class", async () => {
    const result = await createDhClassFeature({ ...feature, classId: 0 });

    expect(result.ok).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });

  it("updates a feature's own fields and never its class", async () => {
    const result = await updateDhClassFeature({
      id: 9,
      name: "Third Wind",
      classId: 99,
    });

    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({
      where: { id: 9 },
      data: { name: "Third Wind" },
    });
  });
});
