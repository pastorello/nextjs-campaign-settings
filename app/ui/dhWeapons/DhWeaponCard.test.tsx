import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DhWeapon from "@/app/lib/definitions/interfaces/daggerheart/DhWeapon";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key} ${JSON.stringify(values)}` : key,
}));
const { search } = vi.hoisted(() => ({ search: { value: "" } }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(search.value),
  usePathname: () => "/it/dashboard/daggerheart/weapons",
  useRouter: () => ({ replace: vi.fn() }),
}));

import DhWeaponCard from "./DhWeaponCard";
import DhWeaponLibrary from "./DhWeaponLibrary";

// Invented content only (SPEC-018 §5).
const hook: DhWeapon = {
  id: 1,
  name: "Lantern Hook",
  tier: 2,
  weaponSlot: "primary",
  weaponTrait: "finesse",
  weaponRange: "veryClose",
  damageDie: 8,
  damageBonus: 2,
  weaponDamageType: "physical",
  burden: 2,
  weaponFeatureName: "Snagging",
  weaponFeatureText: "<p>It catches cloth.</p>",
  origin: "homebrew",
  image: null,
};

describe("DhWeaponCard (SPEC-029 §5)", () => {
  it("shows the tier and slot, the numbers and the feature", () => {
    render(<DhWeaponCard weapon={hook} />);
    const card = screen.getByRole("article", { name: "Lantern Hook" });

    expect(card).toHaveTextContent(
      'dhWeapons.card.header {"tier":2,"slot":"daggerheart.weaponSlots.primary"}'
    );
    expect(card).toHaveTextContent("dhSubclasses.spellcastTraits.finesse");
    expect(card).toHaveTextContent("daggerheart.ranges.veryClose");
    expect(card).toHaveTextContent("d8+2 daggerheart.damageTypes.physical");
    expect(card).toHaveTextContent("daggerheart.burdens.twoHanded");
    expect(card).toHaveTextContent("Snagging");
    expect(card).toHaveTextContent("It catches cloth.");
  });

  it("prints a bare die, and no feature section without one", () => {
    render(
      <DhWeaponCard
        weapon={{
          ...hook,
          damageBonus: 0,
          weaponFeatureName: null,
          weaponFeatureText: null,
        }}
      />
    );
    const card = screen.getByRole("article");

    expect(card).toHaveTextContent("d8 daggerheart.damageTypes.physical");
    expect(card).not.toHaveTextContent("Snagging");
  });
});

describe("DhWeaponLibrary (SPEC-029 T2)", () => {
  beforeEach(() => {
    search.value = "";
  });

  it("lists rows by default, and cards with ?view=cards", () => {
    const { unmount } = render(<DhWeaponLibrary items={[hook]} />);
    expect(screen.getByTestId("dh-weapon-rows")).toHaveTextContent(
      "Lantern Hook"
    );
    unmount();

    search.value = "view=cards";
    render(<DhWeaponLibrary items={[hook]} />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Lantern Hook" })
    ).toBeInTheDocument();
  });
});
