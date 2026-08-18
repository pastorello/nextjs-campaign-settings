import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import PageType from "@/app/lib/definitions/types/PageType";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/app/lib/data/treasure/createTreasure", () => ({
  default: vi.fn(),
}));
vi.mock("@/app/lib/data/treasure/updateTreasure", () => ({
  default: vi.fn(),
}));

vi.mock("@/app/ui/forms/EntityForm", () => ({
  default: (props: {
    pageType: PageType;
    copy: { createTitle: string };
    children: (field: (key: string) => React.ReactNode) => React.ReactNode;
  }) => (
    <div>
      <div data-testid="page-type">{props.pageType}</div>
      <div data-testid="create-title">{props.copy.createTitle}</div>
      {props.children((key) => (
        <span key={key}>{key}</span>
      ))}
    </div>
  ),
}));

import TreasureForm from "./TreasureForm";

describe("TreasureForm", () => {
  it("wires PageType.Treasure and the treasure.form copy namespace into EntityForm", () => {
    render(<TreasureForm onCancel={vi.fn()} onSaveFinished={vi.fn()} />);

    expect(screen.getByTestId("page-type")).toHaveTextContent(
      PageType.Treasure
    );
    expect(screen.getByTestId("create-title")).toHaveTextContent("createTitle");
  });

  it("renders every declared field via the field-layout children function", () => {
    render(<TreasureForm onCancel={vi.fn()} onSaveFinished={vi.fn()} />);

    for (const field of ["name", "category", "value", "description"]) {
      expect(screen.getByText(field)).toBeInTheDocument();
    }
  });
});
