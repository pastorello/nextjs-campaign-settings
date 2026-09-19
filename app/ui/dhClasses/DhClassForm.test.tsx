import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type DhClass from "@/app/lib/definitions/interfaces/daggerheart/DhClass";
import type MutationResult from "@/app/lib/definitions/types/MutationResult";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const createDhClass = vi.fn<(...args: unknown[]) => Promise<MutationResult>>();
vi.mock("@/app/lib/data/dhClasses/createDhClass", () => ({
  default: (...args: unknown[]) => createDhClass(...args),
}));
vi.mock("@/app/lib/data/dhClasses/updateDhClass", () => ({
  default: vi.fn(),
}));

// EntityForm has its own suite; the stub renders the layout and hands the
// test the create mutation DhClassForm gives it.
let capturedCreate: ((page: DhClass) => Promise<MutationResult>) | undefined;
vi.mock("@/app/ui/forms/EntityForm", () => ({
  default: ({
    children,
    mutations,
  }: {
    children: (field: (name: string) => React.ReactNode) => React.ReactNode;
    mutations: { create: (page: DhClass) => Promise<MutationResult> };
  }) => {
    capturedCreate = mutations.create;
    return (
      <div>
        {children((name) => (
          <span>field:{name}</span>
        ))}
      </div>
    );
  },
}));
vi.mock("@/app/ui/forms/inputs/TextInput", () => ({
  default: ({
    label,
    onChange,
  }: {
    label: string;
    onChange: (value: string) => void;
  }) => <input aria-label={label} onChange={(e) => onChange(e.target.value)} />,
}));
vi.mock("@/app/ui/forms/inputs/RichTextInput", () => ({
  default: ({
    label,
    onChange,
  }: {
    label: string;
    onChange: (value: string) => void;
  }) => (
    <textarea aria-label={label} onChange={(e) => onChange(e.target.value)} />
  ),
}));
vi.mock("./DhClassFeatureList", () => ({
  default: ({ features }: { features: unknown[] }) => (
    <div data-testid="feature-list">{features.length}</div>
  ),
}));

import DhClassForm from "./DhClassForm";

// Invented content only (SPEC-018 §5).
const page = { name: "Lantern Warden", domainAId: 1, domainBId: 2 } as DhClass;

describe("DhClassForm (SPEC-021 T4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedCreate = undefined;
  });

  it("shows the Hope feature's fixed cost as copy, not a field", () => {
    render(<DhClassForm onCancel={vi.fn()} onSaveFinished={vi.fn()} />);

    expect(screen.getByText("dhClasses.hopeFeature.cost")).toBeInTheDocument();
    expect(screen.getByText("field:hopeFeatureName")).toBeInTheDocument();
  });

  it("creates the class with the first feature entered beside it", async () => {
    createDhClass.mockResolvedValue({ ok: true });
    render(<DhClassForm onCancel={vi.fn()} onSaveFinished={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("dhFeature.fields.name.label"), {
      target: { value: "Long Watch" },
    });
    fireEvent.change(screen.getByLabelText("dhFeature.fields.text.label"), {
      target: { value: "<p>Awake.</p>" },
    });
    await act(async () => {
      await capturedCreate?.(page);
    });

    expect(createDhClass).toHaveBeenCalledWith({
      ...page,
      firstFeatureName: "Long Watch",
      firstFeatureText: "<p>Awake.</p>",
    });
  });

  it("shows the first feature's errors in its own block, the rest to the form", async () => {
    createDhClass.mockResolvedValue({
      ok: false,
      errors: {
        firstFeatureName: [{ key: "classNeedsFeature" }],
        domainBId: [{ key: "domainsMustDiffer" }],
      },
    });
    render(<DhClassForm onCancel={vi.fn()} onSaveFinished={vi.fn()} />);

    let result: MutationResult | undefined;
    await act(async () => {
      result = await capturedCreate?.(page);
    });

    expect(result).toEqual({
      ok: false,
      errors: { domainBId: [{ key: "domainsMustDiffer" }] },
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "dhFeature.fields.name.label"
    );
  });

  it("edits the features inline, and asks for no first feature, when editing", () => {
    render(
      <DhClassForm
        formData={{
          ...page,
          id: 4,
          features: [
            { id: 1, classId: 4, position: 1, name: "A", text: "<p>a</p>" },
          ],
        }}
        onCancel={vi.fn()}
        onSaveFinished={vi.fn()}
      />
    );

    expect(screen.getByTestId("feature-list")).toHaveTextContent("1");
    expect(
      screen.queryByLabelText("dhFeature.fields.name.label")
    ).not.toBeInTheDocument();
  });
});
