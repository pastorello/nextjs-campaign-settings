import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import DhClass from "@/app/lib/definitions/interfaces/daggerheart/DhClass";
import FirstDhClassFeature from "@/app/lib/definitions/interfaces/daggerheart/FirstDhClassFeature";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { dhClass: { create } },
}));

import createDhClass from "./createDhClass";

// Invented content only (SPEC-018 §5): no rules text in tests.
const validFormData: DhClass & FirstDhClassFeature = {
  id: 0,
  name: "Lantern Warden",
  description: "<p>Keeps the roads lit.</p>",
  domainAId: 1,
  domainBId: 2,
  startingEvasion: 9,
  startingHp: 6,
  classItems: null,
  hopeFeatureName: "Kindle",
  hopeFeatureText: "<p>A small light answers.</p>",
  origin: "homebrew",
  firstFeatureName: "Long Watch",
  firstFeatureText: "<p>You never sleep through the dark.</p>",
};

describe("createDhClass (SPEC-021 T4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    create.mockResolvedValue({});
  });

  it("rejects an unauthenticated request without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(createDhClass(validFormData)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(create).not.toHaveBeenCalled();
  });

  it("creates the class with its first feature, in one write", async () => {
    const result = await createDhClass(validFormData);

    expect(result).toEqual({ ok: true });
    expect(create).toHaveBeenCalledWith({
      data: {
        name: "Lantern Warden",
        description: "<p>Keeps the roads lit.</p>",
        domainAId: 1,
        domainBId: 2,
        startingEvasion: 9,
        startingHp: 6,
        classItems: undefined,
        hopeFeatureName: "Kindle",
        hopeFeatureText: "<p>A small light answers.</p>",
        origin: "homebrew",
        features: {
          create: [
            {
              position: 1,
              name: "Long Watch",
              text: "<p>You never sleep through the dark.</p>",
            },
          ],
        },
      },
    });
  });

  it("refuses the same domain twice with a field error on the second", async () => {
    const result = await createDhClass({ ...validFormData, domainBId: 1 });

    expect(result).toEqual({
      ok: false,
      errors: { domainBId: [{ key: "domainsMustDiffer" }] },
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("refuses a class with no feature", async () => {
    const { firstFeatureName, firstFeatureText, ...withoutFeature } =
      validFormData;
    void firstFeatureName;
    void firstFeatureText;

    const result = await createDhClass(withoutFeature);

    expect(result).toEqual({
      ok: false,
      errors: { firstFeatureName: [{ key: "classNeedsFeature" }] },
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("refuses a first feature with a blank name or no words", async () => {
    const result = await createDhClass({
      ...validFormData,
      firstFeatureName: "  ",
      firstFeatureText: "<p></p>",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.errors).sort()).toEqual([
      "firstFeatureName",
      "firstFeatureText",
    ]);
    expect(create).not.toHaveBeenCalled();
  });

  it("refuses a missing domain", async () => {
    const result = await createDhClass({ ...validFormData, domainAId: null });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.domainAId).toBeDefined();
    expect(create).not.toHaveBeenCalled();
  });

  it("refuses a negative starting Evasion or HP", async () => {
    const result = await createDhClass({
      ...validFormData,
      startingEvasion: -1,
      startingHp: -2,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.startingEvasion).toBeDefined();
    expect(result.errors.startingHp).toBeDefined();
    expect(create).not.toHaveBeenCalled();
  });

  it("refuses a Hope feature without a name", async () => {
    const result = await createDhClass({
      ...validFormData,
      hopeFeatureName: "",
    });

    expect(result.ok).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });

  it("sanitises the formatted fields on the way in", async () => {
    await createDhClass({
      ...validFormData,
      firstFeatureText: '<p onclick="x()">Hold<script>alert(1)</script></p>',
    });

    const [{ data }] = create.mock.calls[0] as [
      { data: { features: { create: { text: string }[] } } },
    ];
    expect(data.features.create[0]?.text).toBe("<p>Hold</p>");
  });
});
