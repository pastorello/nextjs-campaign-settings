import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import PageType from "@/app/lib/definitions/types/PageType";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/app/lib/data/npc/createNpc", () => ({ default: vi.fn() }));
vi.mock("@/app/lib/data/npc/updateNpc", () => ({ default: vi.fn() }));

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

import NpcForm from "./NpcForm";

describe("NpcForm", () => {
  it("wires PageType.Npc and the npc.form copy namespace into EntityForm", () => {
    render(<NpcForm onCancel={vi.fn()} onSaveFinished={vi.fn()} />);

    expect(screen.getByTestId("page-type")).toHaveTextContent(PageType.Npc);
    expect(screen.getByTestId("create-title")).toHaveTextContent("createTitle");
  });

  it("renders every declared field via the field-layout children function", () => {
    render(<NpcForm onCancel={vi.fn()} onSaveFinished={vi.fn()} />);

    for (const field of [
      "name",
      "alignment",
      "faction",
      "title",
      "alignmentDomain",
      "position",
      "appearance",
      "motivations",
      "personality",
      "secrets",
      "description",
    ]) {
      expect(screen.getByText(field)).toBeInTheDocument();
    }
  });
});
