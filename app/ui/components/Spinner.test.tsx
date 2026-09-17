import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import Spinner from "./Spinner";

describe("Spinner", () => {
  // framer-motion's own `motion.div`s legitimately carry a DOM `style`
  // attribute for the transforms it animates (TD-132 doesn't target
  // that); this checks the plain size wrapper we fixed at Spinner.tsx:9,
  // which no longer needs one at all.
  it("sizes its container with a Tailwind class, not an inline style (TD-132)", () => {
    const { container } = render(<Spinner />);

    const sizeWrapper = container.querySelector(".relative");
    expect(sizeWrapper).not.toHaveAttribute("style");
  });

  it("sizes the container from the Tailwind class matching the default size", () => {
    const { container } = render(<Spinner />);

    expect(container.querySelector(".w-25.h-25")).not.toBeNull();
  });

  it("sizes the container from the Tailwind class matching a non-default size", () => {
    const { container } = render(<Spinner size={60} />);

    expect(container.querySelector(".w-15.h-15")).not.toBeNull();
  });
});
