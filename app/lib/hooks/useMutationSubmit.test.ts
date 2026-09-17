import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const { notifyError } = vi.hoisted(() => ({ notifyError: vi.fn() }));
vi.mock("@/app/lib/notifications/notify", () => ({ notifyError }));

import useMutationSubmit from "./useMutationSubmit";

describe("useMutationSubmit (TD-126)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("resolves true and clears errors on success", async () => {
    const { result } = renderHook(() => useMutationSubmit());

    let saved = false;
    await act(async () => {
      saved = await result.current.submit(() => Promise.resolve({ ok: true }));
    });

    expect(saved).toBe(true);
    expect(result.current.errors).toEqual({});
    expect(result.current.isSaving).toBe(false);
  });

  it("resolves false and exposes field errors on a refusal", async () => {
    const { result } = renderHook(() => useMutationSubmit());

    let saved = true;
    await act(async () => {
      saved = await result.current.submit(() =>
        Promise.resolve({
          ok: false,
          errors: { title: [{ key: "invalidType" }] },
        })
      );
    });

    expect(saved).toBe(false);
    expect(result.current.errors).toEqual({ title: [{ key: "invalidType" }] });
    expect(result.current.isSaving).toBe(false);
    expect(notifyError).not.toHaveBeenCalled();
  });

  it("clears the saving flag and shows a toast when the mutation throws", async () => {
    const { result } = renderHook(() => useMutationSubmit());

    let saved = true;
    await act(async () => {
      saved = await result.current.submit(() =>
        Promise.reject(new Error("connection lost"))
      );
    });

    expect(saved).toBe(false);
    expect(result.current.isSaving).toBe(false);
    expect(notifyError).toHaveBeenCalledWith("saveFailed");
  });

  it("is saving while the mutation is pending", async () => {
    const { result } = renderHook(() => useMutationSubmit());
    let resolve: (value: { ok: true }) => void = () => {};
    const pending = new Promise<{ ok: true }>((r) => {
      resolve = r;
    });

    let submitted: Promise<boolean> = Promise.resolve(false);
    act(() => {
      submitted = result.current.submit(() => pending);
    });
    expect(result.current.isSaving).toBe(true);

    await act(async () => {
      resolve({ ok: true });
      await submitted;
    });
    expect(result.current.isSaving).toBe(false);
  });
});
