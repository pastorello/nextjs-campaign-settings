import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

// `vi.hoisted` — see createPoi.test.ts for why a plain top-level `const`
// doesn't work here, and why this avoids `vi.mocked(prisma.zone.update)`.
const { update } = vi.hoisted(() => ({ update: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { zone: { update } },
}));

import updateZoneDetails from "./updateZoneDetails";

describe("updateZoneDetails (TD-104)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    update.mockResolvedValue({});
  });

  it("rejects an unauthenticated request without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(
      updateZoneDetails({ id: 1, title: "Kang", description: null })
    ).rejects.toBeInstanceOf(UnauthorizedError);
    expect(update).not.toHaveBeenCalled();
  });

  // The regression this whole item exists for: before TD-104 no mutation
  // anywhere wrote `zone.title`, so a region could not be renamed.
  it("renames a place", async () => {
    const result = await updateZoneDetails({
      id: 7,
      title: "Kang Reach",
      description: "The eastern march.",
    });

    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { title: "Kang Reach", description: "The eastern march." },
    });
  });

  it("stores a cleared description as null, not an empty string", async () => {
    const result = await updateZoneDetails({
      id: 7,
      title: "Kang Reach",
      description: null,
    });

    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { title: "Kang Reach", description: null },
    });
  });

  it("refuses an empty title without writing", async () => {
    const result = await updateZoneDetails({
      id: 7,
      title: "",
      description: null,
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.errors).toHaveProperty("title");
    expect(update).not.toHaveBeenCalled();
  });

  // `""` and `null` would otherwise be two indistinguishable ways of saying
  // "no description"; the panel normalises to `null` before sending, and
  // the validator is what makes that normalisation load-bearing.
  it("refuses an empty-string description without writing", async () => {
    const result = await updateZoneDetails({
      id: 7,
      title: "Kang Reach",
      description: "",
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.errors).toHaveProperty("description");
    expect(update).not.toHaveBeenCalled();
  });

  it("refuses a non-positive id without writing", async () => {
    const result = await updateZoneDetails({
      id: -1,
      title: "Kang Reach",
      description: null,
    });

    expect(result.ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });
});
