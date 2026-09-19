import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key} ${JSON.stringify(values)}` : key,
}));

const refresh = vi.fn();
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const reorderDhClassFeatures = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/dhClasses/reorderDhClassFeatures", () => ({
  default: (...args: unknown[]) => reorderDhClassFeatures(...args),
}));
const deleteDhClassFeatureById = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/dhClasses/deleteDhClassFeatureById", () => ({
  default: (...args: unknown[]) => deleteDhClassFeatureById(...args),
}));
vi.mock("@/app/lib/data/dhClasses/createDhClassFeature", () => ({
  default: vi.fn(),
}));
vi.mock("@/app/lib/data/dhClasses/updateDhClassFeature", () => ({
  default: vi.fn(),
}));

const notifySuccess = vi.fn<(...args: unknown[]) => void>();
const notifyError = vi.fn<(...args: unknown[]) => void>();
vi.mock("@/app/lib/notifications/notify", () => ({
  notifySuccess: (...args: unknown[]) => notifySuccess(...args),
  notifyError: (...args: unknown[]) => notifyError(...args),
}));

// The confirm dialog renders its own buttons; the stub confirms at once.
vi.mock("@/app/ui/components/Modal", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
vi.mock("@/app/ui/forms/PageForm", () => ({
  default: ({ onSaveFinished }: { onSaveFinished: () => void }) => (
    <button onClick={onSaveFinished}>confirm</button>
  ),
}));
vi.mock("./DhFeatureForm", () => ({
  default: () => <div data-testid="feature-form" />,
}));

import DhClassFeatureList from "./DhClassFeatureList";

// Invented content only (SPEC-018 §5).
const features = [
  { id: 11, classId: 4, position: 1, name: "Long Watch", text: "<p>A</p>" },
  { id: 12, classId: 4, position: 2, name: "Second Wind", text: "<p>B</p>" },
  { id: 13, classId: 4, position: 3, name: "Last Light", text: "<p>C</p>" },
];

describe("DhClassFeatureList (SPEC-021 T4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the features in the order given", () => {
    render(<DhClassFeatureList classId={4} features={features} />);

    const names = screen
      .getAllByText(/Long Watch|Second Wind|Last Light/)
      .map((node) => node.textContent);
    expect(names).toEqual(["Long Watch", "Second Wind", "Last Light"]);
  });

  it("moves a feature up by sending the whole new order", async () => {
    reorderDhClassFeatures.mockResolvedValue({ ok: true });
    render(<DhClassFeatureList classId={4} features={features} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: 'dhClasses.features.moveUp {"name":"Last Light"}',
      })
    );

    await waitFor(() =>
      expect(reorderDhClassFeatures).toHaveBeenCalledWith(4, [11, 13, 12])
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("disables moving the first feature up and the last one down", () => {
    render(<DhClassFeatureList classId={4} features={features} />);

    expect(
      screen.getByRole("button", {
        name: 'dhClasses.features.moveUp {"name":"Long Watch"}',
      })
    ).toBeDisabled();
    expect(
      screen.getByRole("button", {
        name: 'dhClasses.features.moveDown {"name":"Last Light"}',
      })
    ).toBeDisabled();
  });

  it("reports a failed reorder without refreshing", async () => {
    reorderDhClassFeatures.mockResolvedValue({ ok: false, errors: {} });
    render(<DhClassFeatureList classId={4} features={features} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: 'dhClasses.features.moveDown {"name":"Long Watch"}',
      })
    );

    await waitFor(() =>
      expect(notifyError).toHaveBeenCalledWith("common.reorder.failed")
    );
    expect(refresh).not.toHaveBeenCalled();
  });

  it("shows the refusal when the last feature's delete is refused", async () => {
    deleteDhClassFeatureById.mockResolvedValue({
      ok: false,
      errors: { id: [{ key: "classNeedsFeature" }] },
    });
    render(<DhClassFeatureList classId={4} features={features.slice(0, 1)} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: 'common.table.deleteItem {"name":"Long Watch"}',
      })
    );
    fireEvent.click(screen.getByText("confirm"));

    await waitFor(() =>
      expect(notifyError).toHaveBeenCalledWith(
        "common.fieldErrors.classNeedsFeature"
      )
    );
    expect(deleteDhClassFeatureById).toHaveBeenCalledWith(11);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("opens the inline form to add a feature", () => {
    render(<DhClassFeatureList classId={4} features={features} />);

    fireEvent.click(screen.getByText("dhClasses.features.addButton"));

    expect(screen.getByTestId("feature-form")).toBeInTheDocument();
  });
});
