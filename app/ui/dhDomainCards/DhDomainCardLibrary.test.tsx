import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DhDomainCard from "@/app/lib/definitions/interfaces/daggerheart/DhDomainCard";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const { replace, search } = vi.hoisted(() => ({
  replace: vi.fn(),
  search: { value: "" },
}));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(search.value),
  usePathname: () => "/it/dashboard/daggerheart/domain-cards",
  useRouter: () => ({ replace }),
}));

// The filter chips have their own suite.
vi.mock("../buttons/SelectButtonery", () => ({ default: () => null }));

import DhDomainCardLibrary from "./DhDomainCardLibrary";

// Invented content only (SPEC-018 §5).
const items: DhDomainCard[] = [
  {
    id: 1,
    name: "Lantern Step",
    domainId: 3,
    cardLevel: 1,
    recallCost: 0,
    cardType: "spell",
    featureText: "<p>Step between lanterns.</p>",
    origin: "homebrew",
    domain: { id: 3, name: "Veilwright", colour: "teal", image: null },
  },
];

describe("DhDomainCardLibrary's rows/cards switch (SPEC-021 T3)", () => {
  beforeEach(() => {
    replace.mockReset();
    search.value = "";
  });

  it("shows rows by default", () => {
    render(<DhDomainCardLibrary items={items} />);

    expect(screen.getByTestId("dh-domain-card-rows")).toBeInTheDocument();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "rows", pressed: true })
    ).toBeInTheDocument();
  });

  it("shows card views when the URL asks for cards", () => {
    search.value = "view=cards&cardLevel=1";
    render(<DhDomainCardLibrary items={items} />);

    expect(
      screen.getByRole("article", { name: "Lantern Step" })
    ).toBeInTheDocument();
    expect(screen.queryByTestId("dh-domain-card-rows")).not.toBeInTheDocument();
  });

  it("writes the choice to the URL, keeping the filters", () => {
    search.value = "cardLevel=1";
    render(<DhDomainCardLibrary items={items} />);

    fireEvent.click(screen.getByRole("button", { name: "cards" }));

    expect(replace).toHaveBeenCalledWith(
      "/it/dashboard/daggerheart/domain-cards?cardLevel=1&view=cards"
    );
  });

  it("drops the parameter when switching back to rows", () => {
    search.value = "view=cards";
    render(<DhDomainCardLibrary items={items} />);

    fireEvent.click(screen.getByRole("button", { name: "rows" }));

    expect(replace).toHaveBeenCalledWith(
      "/it/dashboard/daggerheart/domain-cards"
    );
  });
});
