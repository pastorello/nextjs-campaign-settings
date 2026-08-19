import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import PageType from "@/app/lib/definitions/types/PageType";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/app/lib/data/magicitems/createMagicItem", () => ({
  default: vi.fn(),
}));
vi.mock("@/app/lib/data/magicitems/updateMagicItem", () => ({
  default: vi.fn(),
}));

vi.mock("@/app/ui/forms/EntityForm", () => ({
  default: (props: {
    pageType: PageType;
    copy: { createTitle: string };
    disableUntilEdited?: boolean;
    children: (field: (key: string) => React.ReactNode) => React.ReactNode;
  }) => (
    <div>
      <div data-testid="page-type">{props.pageType}</div>
      <div data-testid="create-title">{props.copy.createTitle}</div>
      <div data-testid="disable-until-edited">
        {String(props.disableUntilEdited)}
      </div>
      {props.children((key) => (
        <span key={key}>{key}</span>
      ))}
    </div>
  ),
}));

import MagicItemForm from "./MagicItemForm";

describe("MagicItemForm", () => {
  it("wires PageType.MagicItem and the magicItems.form copy namespace into EntityForm", () => {
    render(<MagicItemForm onCancel={vi.fn()} onSaveFinished={vi.fn()} />);

    expect(screen.getByTestId("page-type")).toHaveTextContent(
      PageType.MagicItem
    );
    expect(screen.getByTestId("create-title")).toHaveTextContent("createTitle");
  });

  it("allows submitting an untouched form, unlike the other three domains", () => {
    render(<MagicItemForm onCancel={vi.fn()} onSaveFinished={vi.fn()} />);

    expect(screen.getByTestId("disable-until-edited")).toHaveTextContent(
      "false"
    );
  });

  it("renders every declared field via the field-layout children function", () => {
    render(<MagicItemForm onCancel={vi.fn()} onSaveFinished={vi.fn()} />);

    for (const field of [
      "name",
      "type",
      "rarity",
      "attuned",
      "consumable",
      "description",
    ]) {
      expect(screen.getByText(field)).toBeInTheDocument();
    }
  });
});
