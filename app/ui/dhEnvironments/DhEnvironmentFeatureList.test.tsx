import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
const actions = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  reorder: vi.fn(),
}));
vi.mock("@/app/lib/data/dhEnvironments/createDhEnvironmentFeature", () => ({
  default: actions.create,
}));
vi.mock("@/app/lib/data/dhEnvironments/updateDhEnvironmentFeature", () => ({
  default: actions.update,
}));
vi.mock("@/app/lib/data/dhEnvironments/deleteDhEnvironmentFeatureById", () => ({
  default: vi.fn(),
}));
vi.mock("@/app/lib/data/dhEnvironments/reorderDhEnvironmentFeatures", () => ({
  default: actions.reorder,
}));
// The shared feature form has its own suite: here it saves fixed values.
vi.mock("@/app/ui/daggerheart/StatBlockFeatureForm", () => ({
  default: ({
    save,
    owner,
  }: {
    save: (values: object) => Promise<unknown>;
    owner: string;
  }) => (
    <button
      onClick={() =>
        void save({
          kind: "passive",
          fear: false,
          name: "Fog",
          text: "<p>Thick.</p>",
          questions: "<p>Who is lost?</p>",
        })
      }
    >
      save-{owner}
    </button>
  ),
}));

import DhEnvironmentFeatureList from "./DhEnvironmentFeatureList";

const features = [
  {
    id: 1,
    environmentId: 5,
    position: 1,
    kind: "action",
    name: "Lanterns gutter",
    text: "<p>The light dims.</p>",
    questions: null,
  },
];

describe("an environment's inline features (SPEC-028 T3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const action of Object.values(actions)) {
      action.mockResolvedValue({ ok: true });
    }
  });

  it("adds a feature, with its questions, at the end of the list", async () => {
    render(<DhEnvironmentFeatureList environmentId={5} features={features} />);

    fireEvent.click(screen.getByRole("button", { name: "addButton" }));
    fireEvent.click(screen.getByRole("button", { name: "save-environment" }));

    await waitFor(() =>
      expect(actions.create).toHaveBeenCalledWith({
        environmentId: 5,
        position: 2,
        kind: "passive",
        name: "Fog",
        text: "<p>Thick.</p>",
        questions: "<p>Who is lost?</p>",
      })
    );
  });

  it("edits a feature in place", async () => {
    render(<DhEnvironmentFeatureList environmentId={5} features={features} />);

    fireEvent.click(
      screen.getByRole("button", { name: "common.table.editItem" })
    );
    fireEvent.click(screen.getByRole("button", { name: "save-environment" }));

    await waitFor(() =>
      expect(actions.update).toHaveBeenCalledWith({
        id: 1,
        kind: "passive",
        name: "Fog",
        text: "<p>Thick.</p>",
        questions: "<p>Who is lost?</p>",
      })
    );
  });
});
