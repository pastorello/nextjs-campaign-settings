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

const { update } = vi.hoisted(() => ({ update: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { deities: { update } },
}));

import updateDeity from "./updateDeity";

const validFormData: Deity = {
  id: 42,
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

describe("updateDeity (TD-80)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
  });

  it("rejects an unauthenticated request without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(updateDeity(validFormData)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(update).not.toHaveBeenCalled();
  });

  it("updates the deity on valid input", async () => {
    update.mockResolvedValue({});

    const result = await updateDeity(validFormData);

    const { id, ...rest } = validFormData;
    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({
      where: { id },
      data: rest,
    });
  });

  it("rejects a non-positive id without writing", async () => {
    const result = await updateDeity({ ...validFormData, id: -1 });

    expect(result.ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects a payload with an out-of-range option value, without writing", async () => {
    const result = await updateDeity({ ...validFormData, deityType: 99999 });

    expect(result.ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });
});
