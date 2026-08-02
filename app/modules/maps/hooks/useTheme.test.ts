import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const setTheme = vi.fn();
const nextThemeState: {
  theme?: string;
  systemTheme?: string;
  resolvedTheme?: string | undefined;
} = {};

vi.mock("next-themes", () => ({
  useTheme: () => ({ ...nextThemeState, setTheme }),
}));

describe("useTheme", () => {
  it("resolves 'system' to the OS-reported theme", async () => {
    nextThemeState.theme = "system";
    nextThemeState.systemTheme = "dark";
    nextThemeState.resolvedTheme = undefined;

    const { useTheme } = await import("./useTheme");
    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe("dark");
  });

  it("prefers resolvedTheme when next-themes has already resolved it", async () => {
    nextThemeState.theme = "system";
    nextThemeState.systemTheme = "dark";
    nextThemeState.resolvedTheme = "light";

    const { useTheme } = await import("./useTheme");
    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe("light");
  });

  it("toggleTheme flips light to dark and vice versa", async () => {
    nextThemeState.theme = "light";
    nextThemeState.systemTheme = "light";
    nextThemeState.resolvedTheme = "light";
    setTheme.mockClear();

    const { useTheme } = await import("./useTheme");
    const { result } = renderHook(() => useTheme());

    result.current.toggleTheme();

    expect(setTheme).toHaveBeenCalledWith("dark");
  });

  it("reports mounted once useSyncExternalStore has resolved on the client", async () => {
    const { useTheme } = await import("./useTheme");
    const { result } = renderHook(() => useTheme());

    expect(result.current.mounted).toBe(true);
  });
});
