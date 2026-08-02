import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import NpcItem from "@/app/lib/definitions/interfaces/npc/NpcItem";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import NpcCard from "./NpcCard";

const item: NpcItem = {
  id: 1,
  name: "Elminster",
  description: "<p>A meddling wizard.</p>",
  title: "The Sage of Shadowdale",
  alignment: 1,
  alignmentDomain: 1,
  position: "Advisor",
  location: 1,
  faction: 1,
  appearance: "An old man in grey robes",
  personality: "Wise and mischievous",
  motivations: "Protect the Realms",
  secrets: "",
};

describe("NpcCard", () => {
  it("shows name, title and position collapsed", () => {
    render(<NpcCard cardItem={item} />);

    expect(screen.getByText("Elminster")).toBeInTheDocument();
    expect(screen.getByText("The Sage of Shadowdale")).toBeInTheDocument();
    expect(screen.getByText("Advisor")).toBeInTheDocument();
  });

  it("reveals personality and the description panel on expand", () => {
    render(<NpcCard cardItem={item} />);

    expect(screen.queryByText("Wise and mischievous")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByText("Wise and mischievous")).toBeInTheDocument();
    expect(screen.getByText("A meddling wizard.")).toBeInTheDocument();
  });
});
