"use client";

import { Toaster as Sonner } from "sonner";

/**
 * The app's toast host, mounted once in the root layout (TD-10).
 *
 * **Why not the one in `app/modules/maps/components/ui/sonner.tsx`.** That is a
 * shadcn-generated component and it styles itself from CSS variables —
 * `--popover`, `--popover-foreground`, `--border`, `--radius` — which are
 * referenced there and **defined nowhere in this project**. It came with the
 * vendored maps module and expects a theme that was never installed, so reusing
 * it at app level would render toasts with empty colours. It also calls
 * `useTheme()` from next-themes, and there is no ThemeProvider.
 *
 * `richColors` is what gives success and error their own palettes without a
 * design system to inherit from. Their text, though, is darkened: Sonner's own
 * measures 4.25:1 (success) and 4.34:1 (error) on its backgrounds, under the
 * 4.5:1 AA floor (TD-155). Sonner sets that colour with a three-attribute
 * selector, which a single utility class cannot outrank — hence the `!`.
 */
export default function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        duration: 5000,
        classNames: { success: "text-green-800!", error: "text-red-800!" },
      }}
    />
  );
}
