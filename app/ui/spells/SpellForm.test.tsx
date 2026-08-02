import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import PageType from "@/app/lib/definitions/types/PageType";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// SpellForm imports these at module scope, which otherwise pulls in Prisma's
// connection setup (and its env validation) just to render a form.
vi.mock("@/app/lib/data/spells/createSpell", () => ({ default: vi.fn() }));
vi.mock("@/app/lib/data/spells/updateSpell", () => ({ default: vi.fn() }));

// EntityForm has its own suite. SpellForm's own job is wiring the right
// pageType/mutations/copy into it and laying out its fields — the stub below
// surfaces those props and renders the field layout with a stub field
// renderer, so this suite exercises exactly that wiring, not EntityForm's.
vi.mock("@/app/ui/forms/EntityForm", () => ({
  default: (props: {
    pageType: PageType;
    mutations: { create: unknown; update: unknown };
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

import SpellForm from "./SpellForm";

describe("SpellForm", () => {
  it("wires PageType.Spell and the spells.form copy namespace into EntityForm", () => {
    render(<SpellForm onCancel={vi.fn()} onSaveFinished={vi.fn()} />);

    expect(screen.getByTestId("page-type")).toHaveTextContent(PageType.Spell);
    expect(screen.getByTestId("create-title")).toHaveTextContent("createTitle");
  });

  it("renders every declared field via the field-layout children function", () => {
    render(<SpellForm onCancel={vi.fn()} onSaveFinished={vi.fn()} />);

    for (const field of [
      "name",
      "level",
      "classes",
      "circle",
      "castingTime",
      "range",
      "components",
      "duration",
      "ritual",
      "description",
      "upcast",
    ]) {
      expect(screen.getByText(field)).toBeInTheDocument();
    }
  });
});
