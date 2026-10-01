import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DhEnvironment from "@/app/lib/definitions/interfaces/daggerheart/DhEnvironment";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key} ${JSON.stringify(values)}` : key,
}));
vi.mock("@/app/lib/hooks/useGameSystem", () => ({
  default: () => "daggerheart",
}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));
const { search } = vi.hoisted(() => ({ search: { value: "" } }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(search.value),
  usePathname: () => "/it/dashboard/daggerheart/environments",
  useRouter: () => ({ replace: vi.fn() }),
}));

import DhEnvironmentStatBlock from "./DhEnvironmentStatBlock";
import DhEnvironmentLibrary from "./DhEnvironmentLibrary";

// Invented content only (SPEC-018 §5).
const market: DhEnvironment = {
  id: 5,
  name: "Lamplit Market",
  description: "<p>Stalls under paper lanterns.</p>",
  tier: 1,
  environmentType: "social",
  impulses: "Haggle, gossip, close at dusk",
  difficulty: 11,
  otherAdversaries: "Pickpockets",
  origin: "homebrew",
  image: null,
  adversaries: [{ id: 3, name: "Lantern Wraith" }],
  places: [{ id: 7, name: "Aerivel" }],
  features: [
    {
      id: 1,
      environmentId: 5,
      position: 1,
      kind: "action",
      name: "Lanterns gutter",
      text: "<p>The light dims.</p>",
      questions: "<p>Who lit them?</p>",
    },
  ],
};

describe("DhEnvironmentStatBlock (SPEC-028 §5.3)", () => {
  it("lays out the block, its adversaries linking to their own", () => {
    render(<DhEnvironmentStatBlock environment={market} />);
    const block = screen.getByRole("article", { name: "Lamplit Market" });

    expect(block).toHaveTextContent(
      'dhEnvironments.statBlock.header {"tier":1,"type":"daggerheart.environmentTypes.social"}'
    );
    expect(block).toHaveTextContent("Haggle, gossip, close at dusk");
    expect(within(block).getByText("11")).toBeInTheDocument();
    expect(
      within(block).getByRole("link", { name: "Lantern Wraith" })
    ).toHaveAttribute(
      "href",
      "/dashboard/daggerheart/adversaries?query=Lantern%20Wraith&view=cards"
    );
    expect(block).toHaveTextContent("Lantern Wraith, Pickpockets");
    expect(
      within(block).getByRole("link", { name: "Aerivel" })
    ).toHaveAttribute("href", "/dashboard/daggerheart/geography?place=7");
  });

  it("shows each feature with its kind and questions", () => {
    render(<DhEnvironmentStatBlock environment={market} />);

    const feature = screen.getByRole("listitem");
    expect(feature).toHaveTextContent("Lanterns gutter");
    expect(feature).toHaveTextContent("daggerheart.featureKinds.action");
    expect(feature).toHaveTextContent("Who lit them?");
  });

  it("leaves out what the environment does not have", () => {
    render(
      <DhEnvironmentStatBlock
        environment={{
          ...market,
          impulses: null,
          otherAdversaries: null,
          adversaries: [],
          places: [],
          features: [],
        }}
      />
    );

    expect(
      screen.queryByText(/dhEnvironments.statBlock.adversaries/)
    ).toBeNull();
    expect(screen.queryByText(/dhEnvironments.statBlock.places/)).toBeNull();
    expect(screen.queryByRole("listitem")).toBeNull();
  });
});

describe("DhEnvironmentLibrary (SPEC-028 T3)", () => {
  beforeEach(() => {
    search.value = "";
  });

  it("lists rows by default, and stat blocks with ?view=cards", () => {
    const { unmount } = render(<DhEnvironmentLibrary items={[market]} />);
    expect(screen.getByTestId("dh-environment-rows")).toHaveTextContent(
      "Lamplit Market"
    );
    unmount();

    search.value = "view=cards";
    render(<DhEnvironmentLibrary items={[market]} />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Lamplit Market" })
    ).toBeInTheDocument();
  });
});
