import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("@/i18n/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/app/lib/notifications/notify", () => ({ notifyError: vi.fn() }));
// The formatted-text editor and the listbox select are their own suites';
// here each is a plain control with the label it is given.
vi.mock("@/app/ui/forms/inputs/RichTextInput", () => ({
  default: ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
  }) => (
    <label>
      {label}
      <textarea value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  ),
}));
vi.mock("@/app/ui/forms/inputs/Select", () => ({
  default: ({
    label,
    value,
    options,
    onChange,
  }: {
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
  }) => (
    <label>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  ),
}));

import StatBlockFeatureForm from "./StatBlockFeatureForm";

const setup = (
  owner: "adversary" | "environment",
  initial?: Parameters<typeof StatBlockFeatureForm>[0]["initial"]
) => {
  const save = vi.fn().mockResolvedValue({ ok: true });
  const onDone = vi.fn();
  render(
    <StatBlockFeatureForm
      owner={owner}
      initial={initial}
      save={save}
      submitLabel="save-feature"
      onDone={onDone}
    />
  );
  return { save, onDone };
};

describe("StatBlockFeatureForm (SPEC-028 §5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("asks an adversary's feature for its Fear flag, not for questions", async () => {
    const { save, onDone } = setup("adversary");

    fireEvent.change(screen.getByLabelText("dhStatBlock.fields.kind.label"), {
      target: { value: "reaction" },
    });
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "dhStatBlock.fields.fear.label",
      })
    );
    fireEvent.change(screen.getByLabelText("dhFeature.fields.name.label"), {
      target: { value: "Gutter flame" },
    });
    fireEvent.change(screen.getByLabelText("dhFeature.fields.text.label"), {
      target: { value: "<p>It flares.</p>" },
    });
    expect(
      screen.queryByLabelText("dhStatBlock.fields.questions.label")
    ).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "save-feature" }));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(save).toHaveBeenCalledWith({
      kind: "reaction",
      fear: true,
      name: "Gutter flame",
      text: "<p>It flares.</p>",
      questions: "",
    });
    expect(refresh).toHaveBeenCalled();
  });

  it("asks an environment's feature for its questions, not for Fear", () => {
    setup("environment", {
      kind: "passive" as never,
      name: "Fog",
      text: "<p>Thick.</p>",
      questions: "<p>Who is lost?</p>",
    });

    expect(
      screen.queryByRole("checkbox", { name: "dhStatBlock.fields.fear.label" })
    ).toBeNull();
    expect(
      screen.getByLabelText("dhStatBlock.fields.questions.label")
    ).toHaveValue("<p>Who is lost?</p>");
    expect(screen.getByLabelText("dhFeature.fields.name.label")).toHaveValue(
      "Fog"
    );
  });
});
