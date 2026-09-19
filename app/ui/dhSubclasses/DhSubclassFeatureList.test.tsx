import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DhSubclassFeatureTier from "@/app/lib/definitions/enums/daggerheart/DhSubclassFeatureTier";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key} ${JSON.stringify(values)}` : key,
}));

const refresh = vi.fn();
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const reorderDhSubclassFeatures = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/dhSubclasses/reorderDhSubclassFeatures", () => ({
  default: (...args: unknown[]) => reorderDhSubclassFeatures(...args),
}));
const createDhSubclassFeature = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/dhSubclasses/createDhSubclassFeature", () => ({
  default: (...args: unknown[]) => createDhSubclassFeature(...args),
}));
vi.mock("@/app/lib/data/dhSubclasses/updateDhSubclassFeature", () => ({
  default: vi.fn(),
}));
vi.mock("@/app/lib/data/dhSubclasses/deleteDhSubclassFeatureById", () => ({
  default: vi.fn(),
}));
vi.mock("@/app/lib/notifications/notify", () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
}));

// The stub saves a fixed feature through the list's own `save`, so the test
// sees what the list sends: the owner, the tier and the place in it.
vi.mock("@/app/ui/dhClasses/DhFeatureForm", () => ({
  default: ({
    save,
    initial,
  }: {
    save: (values: object) => Promise<unknown>;
    initial?: { tier?: string };
  }) => (
    <button
      onClick={() =>
        void save({ name: "New", text: "<p>N</p>", tier: initial?.tier })
      }
    >
      save-stub
    </button>
  ),
}));

import DhSubclassFeatureList from "./DhSubclassFeatureList";

// Invented content only (SPEC-018 §5).
const feature = (
  id: number,
  tier: DhSubclassFeatureTier,
  position: number,
  name: string
) => ({ id, subclassId: 6, tier, position, name, text: "<p>x</p>" });

const features = [
  feature(1, DhSubclassFeatureTier.Mastery, 1, "Crowned Flame"),
  feature(2, DhSubclassFeatureTier.Foundation, 2, "Tinder"),
  feature(3, DhSubclassFeatureTier.Foundation, 1, "Flint"),
  feature(4, DhSubclassFeatureTier.Specialization, 1, "Banked Coals"),
];

describe("DhSubclassFeatureList (SPEC-021 T5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("groups the features foundation, specialization, mastery, each in position order", () => {
    render(<DhSubclassFeatureList subclassId={6} features={features} />);

    const names = (tier: string) =>
      within(screen.getByTestId(`tier-${tier}`))
        .getAllByText(/Flint|Tinder|Banked Coals|Crowned Flame/)
        .map((node) => node.textContent);

    expect(names("foundation")).toEqual(["Flint", "Tinder"]);
    expect(names("specialization")).toEqual(["Banked Coals"]);
    expect(names("mastery")).toEqual(["Crowned Flame"]);
    const headings = screen
      .getAllByRole("heading", { level: 4 })
      .map((node) => node.textContent);
    expect(headings).toEqual([
      "dhSubclasses.tiers.foundation",
      "dhSubclasses.tiers.specialization",
      "dhSubclasses.tiers.mastery",
    ]);
  });

  it("shows an empty tier as empty", () => {
    render(
      <DhSubclassFeatureList subclassId={6} features={features.slice(0, 1)} />
    );

    expect(
      within(screen.getByTestId("tier-foundation")).getByText(
        "dhSubclasses.features.emptyTier"
      )
    ).toBeInTheDocument();
  });

  it("reorders within the feature's own tier", async () => {
    reorderDhSubclassFeatures.mockResolvedValue({ ok: true });
    render(<DhSubclassFeatureList subclassId={6} features={features} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: 'dhClasses.features.moveUp {"name":"Tinder"}',
      })
    );

    await waitFor(() =>
      expect(reorderDhSubclassFeatures).toHaveBeenCalledWith(
        6,
        "foundation",
        [2, 3]
      )
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("adds a feature at the end of the chosen tier", async () => {
    createDhSubclassFeature.mockResolvedValue({ ok: true });
    render(<DhSubclassFeatureList subclassId={6} features={features} />);

    fireEvent.click(
      within(screen.getByTestId("tier-foundation")).getByText(
        "dhSubclasses.features.addButton"
      )
    );
    fireEvent.click(screen.getByText("save-stub"));

    await waitFor(() =>
      expect(createDhSubclassFeature).toHaveBeenCalledWith({
        subclassId: 6,
        tier: "foundation",
        position: 3,
        name: "New",
        text: "<p>N</p>",
      })
    );
  });
});
