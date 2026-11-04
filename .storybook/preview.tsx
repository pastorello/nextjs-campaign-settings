import type { Preview } from "@storybook/nextjs-vite";
import { MotionGlobalConfig } from "framer-motion";
import { NextIntlClientProvider } from "next-intl";

import Toaster from "../app/ui/components/Toaster";
import { ReadOnlyViewProvider } from "../app/ui/dashboard/ReadOnlyView";
import { inter } from "../app/ui/fonts";
import {
  STORY_TIME_ZONE,
  setStoryLocale,
  storyMessages,
} from "./mocks/nextIntlServer";

import "../app/ui/global.css";
import { dashboardPath } from "../i18n/dashboardPath";

// Under `pnpm test:storybook` (Vite's "test" mode) every framer-motion
// animation jumps to its end. axe otherwise measures a dialog's contrast
// halfway through its fade-in — 1.01:1 at one frame, 4.37:1 at another — and
// the same story passes or fails by timing. The Storybook UI keeps them.
if (import.meta.env.MODE === "test") {
  MotionGlobalConfig.skipAnimations = true;
}

/**
 * ADR-0021. Every story renders inside what the root and dashboard layouts
 * give a page: the font, the message catalogues, the read-only flag a
 * player's view sets, and the toast host. The toolbar switches the locale
 * (ADR-0006) and the viewer (SPEC-022) for every story at once.
 */
const preview: Preview = {
  globalTypes: {
    locale: {
      description: "UI language (ADR-0006)",
      toolbar: {
        title: "Locale",
        icon: "globe",
        items: [
          { value: "it", title: "Italiano" },
          { value: "en", title: "English" },
        ],
        dynamicTitle: true,
      },
    },
    viewer: {
      description: "Who reads the page (SPEC-022)",
      toolbar: {
        title: "Viewer",
        icon: "user",
        items: [
          { value: "dm", title: "DM" },
          { value: "player", title: "Player (read-only)" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { locale: "it", viewer: "dm" },

  parameters: {
    // Every page is an App Router page; `next/navigation` hooks need this.
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: dashboardPath("dnd5e"),
        segments: [["system", "dnd5e"]],
      },
    },
    // An axe violation fails the story's test. A story that cannot pass yet
    // opts down to "todo" with the debt item that tracks it — never "off".
    // The whole body is checked, so a dialog or menu in a portal is too; the
    // toast region is left to `Toaster.stories.tsx`, where its own contrast
    // finding (TD-155) is tracked once instead of in every story that toasts.
    a11y: {
      test: "error",
      context: { include: ["body"], exclude: ["[data-sonner-toaster]"] },
    },
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
    },
  },

  decorators: [
    (Story, { globals, id }) => {
      const locale = globals.locale === "en" ? "en" : "it";
      // Server Components in a story translate through the same locale.
      setStoryLocale(locale);

      return (
        <NextIntlClientProvider
          locale={locale}
          messages={storyMessages[locale]}
          timeZone={STORY_TIME_ZONE}
        >
          <ReadOnlyViewProvider readOnly={globals.viewer === "player"}>
            <div className={`${inter.className} antialiased`} lang={locale}>
              <Story />
            </div>
            {/* Keyed by story: React would otherwise keep one Toaster, and
                its toasts, across every story rendered into the canvas. */}
            <Toaster key={id} />
          </ReadOnlyViewProvider>
        </NextIntlClientProvider>
      );
    },
  ],

  tags: ["autodocs"],
};

export default preview;
