import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const refresh = vi.fn();
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const createSceneCreature = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/campaigns/createSceneCreature", () => ({
  default: (...args: unknown[]) => createSceneCreature(...args),
}));

const updateSceneCreature = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/campaigns/updateSceneCreature", () => ({
  default: (...args: unknown[]) => updateSceneCreature(...args),
}));

import SceneCreatureForm from "./SceneCreatureForm";

describe("SceneCreatureForm (SPEC-013 T8)", () => {
  const onCancel = vi.fn();
  const onSaved = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a creature with an unset xpEach preserved as null", async () => {
    createSceneCreature.mockResolvedValue({ ok: true });
    render(
      <SceneCreatureForm
        sceneId={3}
        nextPosition={1}
        npcOptions={[]}
        onCancel={onCancel}
        onSaved={onSaved}
      />
    );

    fireEvent.change(screen.getByLabelText("sceneCreature.fields.name.label"), {
      target: { value: "Goblin scout" },
    });
    fireEvent.click(screen.getByText("sceneCreature.form.createButton"));

    await vi.waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(createSceneCreature).toHaveBeenCalledWith(
      expect.objectContaining({
        sceneId: 3,
        name: "Goblin scout",
        level: null,
        xpEach: null,
        quantity: 1,
        npcId: null,
      })
    );
    expect(onSaved).toHaveBeenCalled();
  });

  it("shows field errors and does not report success when rejected", async () => {
    createSceneCreature.mockResolvedValue({
      ok: false,
      errors: { name: ["Required"] },
    });
    render(
      <SceneCreatureForm
        sceneId={3}
        nextPosition={1}
        npcOptions={[]}
        onCancel={onCancel}
        onSaved={onSaved}
      />
    );

    fireEvent.click(screen.getByText("sceneCreature.form.createButton"));

    await vi.waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Required")
    );
    expect(onSaved).not.toHaveBeenCalled();
  });
});
