import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DhAncestry from "@/app/lib/definitions/interfaces/daggerheart/DhAncestry";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const { search } = vi.hoisted(() => ({ search: { value: "" } }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(search.value),
  usePathname: () => "/it/dashboard/daggerheart/ancestries",
  useRouter: () => ({ replace: vi.fn() }),
}));

import DhAncestryLibrary from "./DhAncestryLibrary";

// Invented content only (SPEC-018 §5).
const items: DhAncestry[] = [
  {
    id: 1,
    name: "Lanternfolk",
    description: null,
    ancestryFeatureAName: "Glow",
    ancestryFeatureAText: "<p>Light a small room.</p>",
    ancestryFeatureBName: "Wick",
    ancestryFeatureBText: "<p>Burn brighter once a day.</p>",
    origin: "homebrew",
    image: null,
  },
];

describe("DhAncestryLibrary (SPEC-027 T2)", () => {
  beforeEach(() => {
    search.value = "";
  });

  it("lists rows by default, naming both features", () => {
    render(<DhAncestryLibrary items={items} />);

    const rows = screen.getByTestId("dh-ancestry-rows");
    expect(within(rows).getByText("Lanternfolk")).toBeInTheDocument();
    expect(within(rows).getByText("Glow · Wick")).toBeInTheDocument();
    expect(screen.queryByTestId("dh-ancestry-card-view")).toBeNull();
  });

  it("lays each ancestry out as a card, its features in order, with ?view=cards", () => {
    search.value = "view=cards";

    render(<DhAncestryLibrary items={items} />);

    const card = screen.getByRole("article", { name: "Lanternfolk" });
    const featureNames = within(card)
      .getAllByText(/^(Glow|Wick)$/)
      .map((node) => node.textContent);
    expect(featureNames).toEqual(["Glow", "Wick"]);
    expect(within(card).getByText("Light a small room.")).toBeInTheDocument();
    expect(screen.queryByTestId("dh-ancestry-rows")).toBeNull();
  });
});
