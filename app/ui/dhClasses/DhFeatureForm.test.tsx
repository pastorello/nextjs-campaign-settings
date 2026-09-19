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

import DhSubclassFeatureTier from "@/app/lib/definitions/enums/daggerheart/DhSubclassFeatureTier";
import DhFeatureForm from "./DhFeatureForm";

const setup = (props: Partial<Parameters<typeof DhFeatureForm>[0]> = {}) => {
  const save = vi.fn().mockResolvedValue({ ok: true });
  const onCancel = vi.fn();
  const onSaved = vi.fn();
  render(
    <DhFeatureForm
      save={save}
      submitLabel="save-feature"
      onCancel={onCancel}
      onSaved={onSaved}
      {...props}
    />
  );
  return { save, onCancel, onSaved };
};

// Invented content only (SPEC-018 §5).
describe("DhFeatureForm (SPEC-021 T4, T5)", () => {
  beforeEach(() => {
    refresh.mockReset();
  });

  it("saves a class feature's name and text, without asking for a tier", async () => {
    const { save, onSaved } = setup();

    expect(
      screen.queryByLabelText("dhFeature.fields.tier.label")
    ).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("dhFeature.fields.name.label"), {
      target: { value: "Wick" },
    });
    fireEvent.change(screen.getByLabelText("dhFeature.fields.text.label"), {
      target: { value: "<p>Burns.</p>" },
    });
    fireEvent.click(screen.getByRole("button", { name: "save-feature" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(save).toHaveBeenCalledWith({
      name: "Wick",
      text: "<p>Burns.</p>",
      tier: "foundation",
    });
    expect(refresh).toHaveBeenCalled();
  });

  it("starts from the initial values and saves the chosen tier", async () => {
    const { save } = setup({
      withTier: true,
      initial: {
        name: "Pane",
        text: "<p>p</p>",
        tier: DhSubclassFeatureTier.Mastery,
      },
    });
    const tier = screen.getByLabelText("dhFeature.fields.tier.label");

    expect(tier).toHaveValue("mastery");
    fireEvent.change(tier, { target: { value: "specialization" } });
    fireEvent.click(screen.getByRole("button", { name: "save-feature" }));

    await waitFor(() =>
      expect(save).toHaveBeenCalledWith({
        name: "Pane",
        text: "<p>p</p>",
        tier: "specialization",
      })
    );
  });

  it("stays open, without refreshing, when the save is refused", async () => {
    const save = vi.fn().mockResolvedValue({
      ok: false,
      errors: { name: [{ key: "required" }] },
    });
    const { onSaved } = setup({ save });

    fireEvent.click(screen.getByRole("button", { name: "save-feature" }));

    await waitFor(() => expect(save).toHaveBeenCalled());
    expect(onSaved).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("cancels", () => {
    const { onCancel } = setup();

    fireEvent.click(screen.getByRole("button", { name: "common.form.cancel" }));

    expect(onCancel).toHaveBeenCalled();
  });
});
