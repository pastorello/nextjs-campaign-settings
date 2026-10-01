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

// A native <select> stands in for the Headless UI listbox, which jsdom
// cannot drive by label.
vi.mock("@/app/ui/forms/inputs/Select", () => ({
  default: ({
    label,
    value,
    options = [],
    onChange,
  }: {
    label?: string;
    value: number;
    options?: { value: number; label: string }[];
    onChange: (value: string) => void;
  }) => (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  ),
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
      errors: { name: [{ key: "invalidType" }] },
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
      expect(screen.getByRole("alert")).toHaveTextContent(
        "common.fieldErrors.invalidType"
      )
    );
    expect(onSaved).not.toHaveBeenCalled();
  });

  // SPEC-030 T3: a Daggerheart row prices an adversary, not level and XP.
  it("links a Daggerheart row to an adversary, naming it after it", async () => {
    createSceneCreature.mockResolvedValue({ ok: true });
    render(
      <SceneCreatureForm
        rulesSystem="daggerheart"
        adversaryOptions={[{ value: 7, label: "Marsh Lurker" }]}
        sceneId={3}
        nextPosition={1}
        npcOptions={[]}
        onCancel={onCancel}
        onSaved={onSaved}
      />
    );

    expect(
      screen.queryByLabelText("sceneCreature.fields.xpEach.label")
    ).toBeNull();
    fireEvent.change(
      screen.getByLabelText("sceneCreature.fields.dhAdversaryId.label"),
      { target: { value: "7" } }
    );
    expect(
      screen.getByLabelText("sceneCreature.fields.name.label")
    ).toHaveValue("Marsh Lurker");
    fireEvent.click(screen.getByText("sceneCreature.form.createButton"));

    await vi.waitFor(() => expect(createSceneCreature).toHaveBeenCalled());
    const [payload] = createSceneCreature.mock.lastCall as [
      Record<string, unknown>,
    ];
    expect(payload).toMatchObject({ name: "Marsh Lurker", dhAdversaryId: 7 });
    expect(payload).not.toHaveProperty("level");
    expect(payload).not.toHaveProperty("xpEach");
  });

  it("keeps a row's own name when an adversary is picked", () => {
    render(
      <SceneCreatureForm
        rulesSystem="daggerheart"
        adversaryOptions={[{ value: 7, label: "Marsh Lurker" }]}
        sceneId={3}
        nextPosition={1}
        npcOptions={[]}
        onCancel={onCancel}
        onSaved={onSaved}
      />
    );

    fireEvent.change(screen.getByLabelText("sceneCreature.fields.name.label"), {
      target: { value: "Old Grey" },
    });
    fireEvent.change(
      screen.getByLabelText("sceneCreature.fields.dhAdversaryId.label"),
      { target: { value: "7" } }
    );

    expect(
      screen.getByLabelText("sceneCreature.fields.name.label")
    ).toHaveValue("Old Grey");
  });
});
