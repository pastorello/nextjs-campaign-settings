import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SceneKind from "@/app/lib/definitions/enums/campaign/SceneKind";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const refresh = vi.fn();
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const createScene = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/campaigns/createScene", () => ({
  default: (...args: unknown[]) => createScene(...args),
}));

const updateScene = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/campaigns/updateScene", () => ({
  default: (...args: unknown[]) => updateScene(...args),
}));

import SceneForm from "./SceneForm";

const zoneOptions = [{ value: 5, label: "The Sunken Keep" }];

describe("SceneForm (SPEC-013 T8)", () => {
  const onCancel = vi.fn();
  const onSaved = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a scene with the given kind and reports back", async () => {
    createScene.mockResolvedValue({ ok: true });
    render(
      <SceneForm
        adventureId={1}
        nextPosition={1}
        zoneOptions={zoneOptions}
        onCancel={onCancel}
        onSaved={onSaved}
      />
    );

    fireEvent.change(screen.getByLabelText("scene.fields.title.label"), {
      target: { value: "The bridge ambush" },
    });
    fireEvent.click(screen.getByText("scene.form.createButton"));

    await vi.waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(createScene).toHaveBeenCalledWith(
      expect.objectContaining({
        adventureId: 1,
        position: 1,
        title: "The bridge ambush",
        kind: SceneKind.Fight,
        zoneId: null,
      })
    );
    expect(onSaved).toHaveBeenCalled();
  });

  it("pre-fills from an existing scene in edit mode", () => {
    render(
      <SceneForm
        adventureId={1}
        nextPosition={2}
        zoneOptions={zoneOptions}
        scene={{
          id: 7,
          adventureId: 1,
          position: 1,
          kind: SceneKind.Clue,
          title: "The old ledger",
          description: null,
          xpAward: null,
          grantsHeroPoint: false,
          awarded: false,
          zoneId: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        }}
        onCancel={onCancel}
        onSaved={onSaved}
      />
    );

    expect(screen.getByLabelText("scene.fields.title.label")).toHaveValue(
      "The old ledger"
    );
    expect(screen.getByText("scene.form.editButton")).toBeInTheDocument();
  });

  it("shows field errors and does not report success when rejected", async () => {
    createScene.mockResolvedValue({
      ok: false,
      errors: { title: ["Required"] },
    });
    render(
      <SceneForm
        adventureId={1}
        nextPosition={1}
        zoneOptions={zoneOptions}
        onCancel={onCancel}
        onSaved={onSaved}
      />
    );

    fireEvent.click(screen.getByText("scene.form.createButton"));

    await vi.waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Required")
    );
    expect(onSaved).not.toHaveBeenCalled();
  });
});
