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
 * design system to inherit from.
 */
export default function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{ duration: 5000 }}
    />
  );
}
