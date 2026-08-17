import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import Deity from "@/app/lib/definitions/interfaces/deities/Deity";
import firstOptionValue from "@/app/lib/config/firstOptionValue";
import magicColors from "@/app/lib/config/deity/magicColors";
import deityTypes from "@/app/lib/config/deity/deityTypes";
import deityLevels from "@/app/lib/config/deity/deityLevels";
import tarotCards from "@/app/lib/config/deity/tarotCards";
import celestialBodies from "@/app/lib/config/geography/celestialBodies";
import energyElements from "@/app/lib/config/deity/energyElements";
import subclasses from "@/app/lib/config/spells/subclasses";
import traditionTypes from "@/app/lib/config/deity/traditionTypes";
import alignments from "@/app/lib/config/npc/alignments";
import alignmentDomains from "@/app/lib/config/npc/alignmentDomains";
import Holidays from "@/app/lib/definitions/enums/deities/Holidays";
import TarotMeaning from "@/app/lib/definitions/enums/tarot/TarotMeaning";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { deities: { create } },
}));

import createDeity from "./createDeity";

const validFormData: Deity = {
  id: 0,
  name: "Gruumsh",
  deityTitle: "One-Eye",
  deityType: firstOptionValue(deityTypes),
  deityRank: firstOptionValue(deityLevels),
  tarotCard: firstOptionValue(tarotCards),
  celestialBody: firstOptionValue(celestialBodies),
  element: firstOptionValue(energyElements),
  class: firstOptionValue(subclasses),
  holidays: Holidays.Nessuna,
  color: firstOptionValue(magicColors),
  tradition: firstOptionValue(traditionTypes),
  alignment: firstOptionValue(alignments),
  alignmentDomain: firstOptionValue(alignmentDomains),
  meaning: TarotMeaning.Follia,
};

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
