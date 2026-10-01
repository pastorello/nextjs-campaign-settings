import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import DhArmor from "@/app/lib/definitions/interfaces/daggerheart/DhArmor";
import DhLoot from "@/app/lib/definitions/interfaces/daggerheart/DhLoot";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key} ${JSON.stringify(values)}` : key,
}));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("view=cards"),
  usePathname: () => "/it/dashboard/daggerheart/armor",
  useRouter: () => ({ replace: vi.fn() }),
}));

import DhArmorCard from "./DhArmorCard";
import DhArmorLibrary from "./DhArmorLibrary";
import DhLootCard from "../dhLoot/DhLootCard";
import DhLootLibrary from "../dhLoot/DhLootLibrary";

// Invented content only (SPEC-018 §5).
const coat: DhArmor = {
  id: 1,
  name: "Lamplighter's Coat",
  tier: 2,
  armorMajor: 6,
  armorSevere: 13,
  armorScore: 4,
  armorFeatureName: "Warm",
  armorFeatureText: "<p>Cold does not bite.</p>",
  origin: "homebrew",
  image: null,
};
const dusk: DhLoot = {
  id: 2,
  name: "Bottled Dusk",
  lootKind: "consumable",
  lootRarity: "uncommon",
  rollValue: 7,
  effectText: "<p>Uncork it and the room dims.</p>",
  origin: "homebrew",
  image: null,
};

describe("the equipment cards (SPEC-029 §5)", () => {
  it("shows an armor's tier, thresholds, score and feature", () => {
    render(<DhArmorCard armor={coat} />);
    const card = screen.getByRole("article", { name: "Lamplighter's Coat" });

    expect(card).toHaveTextContent('dhArmor.card.header {"tier":2}');
    expect(card).toHaveTextContent("6/13");
    expect(card).toHaveTextContent("4");
    expect(card).toHaveTextContent("Cold does not bite.");
  });

  it("shows loot's kind, rarity, roll value and effect", () => {
    render(<DhLootCard loot={dusk} />);
    const card = screen.getByRole("article", { name: "Bottled Dusk" });

    expect(card).toHaveTextContent(
      'dhLoot.card.header {"kind":"daggerheart.lootKinds.consumable","rarity":"daggerheart.rarities.uncommon"}'
    );
    expect(card).toHaveTextContent('dhLoot.card.rollValue {"value":7}');
    expect(card).toHaveTextContent("Uncork it and the room dims.");
  });

  it("leaves out a roll value loot does not have", () => {
    render(<DhLootCard loot={{ ...dusk, rollValue: null }} />);

    expect(screen.getByRole("article")).not.toHaveTextContent(
      "dhLoot.card.rollValue"
    );
  });

  it("lists both as cards with ?view=cards", () => {
    render(
      <>
        <DhArmorLibrary items={[coat]} />
        <DhLootLibrary items={[dusk]} />
      </>
    );

    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(2);
  });
});
