import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
const actions = vi.hoisted(() => ({
  createExperience: vi.fn(),
  updateExperience: vi.fn(),
  reorderExperiences: vi.fn(),
  createFeature: vi.fn(),
}));
vi.mock("@/app/lib/data/dhAdversaries/createDhAdversaryExperience", () => ({
  default: actions.createExperience,
}));
vi.mock("@/app/lib/data/dhAdversaries/updateDhAdversaryExperience", () => ({
  default: actions.updateExperience,
}));
vi.mock("@/app/lib/data/dhAdversaries/deleteDhAdversaryExperienceById", () => ({
  default: vi.fn(),
}));
vi.mock("@/app/lib/data/dhAdversaries/reorderDhAdversaryExperiences", () => ({
  default: actions.reorderExperiences,
}));
vi.mock("@/app/lib/data/dhAdversaries/createDhAdversaryFeature", () => ({
  default: actions.createFeature,
}));
vi.mock("@/app/lib/data/dhAdversaries/updateDhAdversaryFeature", () => ({
  default: vi.fn(),
}));
vi.mock("@/app/lib/data/dhAdversaries/deleteDhAdversaryFeatureById", () => ({
  default: vi.fn(),
}));
vi.mock("@/app/lib/data/dhAdversaries/reorderDhAdversaryFeatures", () => ({
  default: vi.fn(),
}));
// The shared feature form has its own suite: here it saves fixed values.
vi.mock("@/app/ui/daggerheart/StatBlockFeatureForm", () => ({
  default: ({ save }: { save: (values: object) => Promise<unknown> }) => (
    <button
      onClick={() =>
        void save({
          kind: "action",
          fear: true,
          name: "Snuff",
          text: "<p>Out.</p>",
          questions: "",
        })
      }
    >
      save-feature
    </button>
  ),
}));

import DhAdversaryExperienceList from "./DhAdversaryExperienceList";
import DhAdversaryFeatureList from "./DhAdversaryFeatureList";

// Invented content only (SPEC-018 §5).
const experiences = [
  { id: 1, adversaryId: 4, position: 1, name: "Old haunts", bonus: 2 },
  { id: 2, adversaryId: 4, position: 2, name: "Night roads", bonus: 3 },
];

describe("an adversary's inline lists (SPEC-028 T2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const action of Object.values(actions)) {
      action.mockResolvedValue({ ok: true });
    }
  });

  it("shows each experience with its bonus", () => {
    render(
      <DhAdversaryExperienceList adversaryId={4} experiences={experiences} />
    );

    expect(screen.getByText("Old haunts").parentElement).toHaveTextContent(
      "Old haunts +2"
    );
  });

  it("adds an experience at the end of its adversary's list", async () => {
    render(
      <DhAdversaryExperienceList adversaryId={4} experiences={experiences} />
    );

    fireEvent.click(screen.getByRole("button", { name: "addButton" }));
    fireEvent.change(
      screen.getByLabelText("dhStatBlock.fields.experienceName.label"),
      { target: { value: "Bell towers" } }
    );
    fireEvent.change(screen.getByLabelText("dhStatBlock.fields.bonus.label"), {
      target: { value: "1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "saveButton" }));

    await waitFor(() =>
      expect(actions.createExperience).toHaveBeenCalledWith({
        adversaryId: 4,
        position: 3,
        name: "Bell towers",
        bonus: 1,
      })
    );
  });

  it("reorders within its adversary", async () => {
    render(
      <DhAdversaryExperienceList adversaryId={4} experiences={experiences} />
    );

    fireEvent.click(screen.getAllByRole("button", { name: "moveDown" })[0]!);

    await waitFor(() =>
      expect(actions.reorderExperiences).toHaveBeenCalledWith(4, [2, 1])
    );
  });

  it("adds a feature at the end of its adversary's list", async () => {
    render(<DhAdversaryFeatureList adversaryId={4} features={[]} />);

    fireEvent.click(screen.getByRole("button", { name: "addButton" }));
    fireEvent.click(screen.getByRole("button", { name: "save-feature" }));

    await waitFor(() =>
      expect(actions.createFeature).toHaveBeenCalledWith({
        adversaryId: 4,
        position: 1,
        kind: "action",
        fear: true,
        name: "Snuff",
        text: "<p>Out.</p>",
      })
    );
  });
});
