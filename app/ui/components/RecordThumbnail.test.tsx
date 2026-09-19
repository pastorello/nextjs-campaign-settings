import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import RecordThumbnail from "./RecordThumbnail";
import RecordDisplayImage from "./RecordDisplayImage";

const image = {
  displayKey: "d0c5e7a2-display.webp",
  thumbKey: "7b1f3c9e-thumb.webp",
  width: 1200,
  height: 800,
};

describe("RecordThumbnail (SPEC-020 T4)", () => {
  it("points a lazy, sized <img> at the thumbnail's key route, named after the record", () => {
    render(<RecordThumbnail image={image} name="Elminster" />);

    const img = screen.getByRole("img", { name: "Elminster" });
    expect(img).toHaveAttribute(
      "src",
      "/api/record-images/7b1f3c9e-thumb.webp"
    );
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("width", "40");
    expect(img).toHaveAttribute("height", "40");
  });

  it("sizes the medium variant to its own box", () => {
    render(<RecordThumbnail image={image} name="Elminster" size="md" />);

    const img = screen.getByRole("img", { name: "Elminster" });
    expect(img).toHaveAttribute("width", "56");
    expect(img).toHaveClass("h-14", "w-14");
  });

  it("encodes the key, so a key can never reach another path", () => {
    render(
      <RecordThumbnail
        image={{ ...image, thumbKey: "../x y.webp" }}
        name="Elminster"
      />
    );

    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "/api/record-images/..%2Fx%20y.webp"
    );
  });

  it.each([null, undefined])(
    "renders a hidden neutral placeholder, not an image, for %s",
    (none) => {
      render(<RecordThumbnail image={none} name="Elminster" />);

      expect(screen.queryByRole("img")).not.toBeInTheDocument();
      expect(
        screen.getByTestId("record-thumbnail-placeholder")
      ).toHaveAttribute("aria-hidden", "true");
    }
  );
});

describe("RecordDisplayImage (SPEC-020 T4)", () => {
  it("shows the display version at its stored size, named after the record", () => {
    render(<RecordDisplayImage image={image} name="Elminster" />);

    const img = screen.getByRole("img", { name: "Elminster" });
    expect(img).toHaveAttribute(
      "src",
      "/api/record-images/d0c5e7a2-display.webp"
    );
    expect(img).toHaveAttribute("width", "1200");
    expect(img).toHaveAttribute("height", "800");
  });

  it("renders nothing without an image", () => {
    const { container } = render(
      <RecordDisplayImage image={null} name="Elminster" />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
