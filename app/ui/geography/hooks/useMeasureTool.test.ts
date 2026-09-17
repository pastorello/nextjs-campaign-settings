import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

vi.mock("sonner", () => ({ toast: { info: vi.fn() } }));

import { useMeasureTool } from "./useMeasureTool";

type Props = Parameters<typeof useMeasureTool>[0];

const ready: Props = {
  parentId: 1,
  gridColumns: 20,
  gridScale: "kingdom",
  imageSize: { width: 2000, height: 1000 },
};

describe("useMeasureTool (TD-127)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("arms and exits when the grid and image are known", () => {
    const { result } = renderHook(() => useMeasureTool(ready));

    act(() => result.current.start());
    expect(result.current.isMeasuring).toBe(true);

    act(() => result.current.exit());
    expect(result.current.isMeasuring).toBe(false);
  });

  it.each([
    ["no grid", { gridColumns: null }],
    ["an unreadable scale", { gridScale: "lots" }],
    ["no image size yet", { imageSize: null }],
  ])("refuses to arm with %s", (_label, override) => {
    const { result } = renderHook(() =>
      useMeasureTool({ ...ready, ...override })
    );

    act(() => result.current.start());

    expect(result.current.isMeasuring).toBe(false);
    expect(toast.info).toHaveBeenCalledWith("unavailable");
  });

  it("disarms when the DM moves to another map", () => {
    const { result, rerender } = renderHook(
      (props: Props) => useMeasureTool(props),
      { initialProps: ready }
    );
    act(() => result.current.start());

    rerender({ ...ready, parentId: 2 });

    expect(result.current.isMeasuring).toBe(false);
  });
});
