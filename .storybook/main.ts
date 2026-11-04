import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/nextjs-vite";
import { mergeConfig } from "vite";

import serverModuleStubs from "./serverModuleStubs.ts";

const mock = (file: string) =>
  fileURLToPath(new URL(`./mocks/${file}`, import.meta.url));

/** The browser libraries `app/ui` and `app/modules` import. */
const UI_DEPENDENCIES = [
  "@headlessui/react",
  "@heroicons/react/20/solid",
  "@heroicons/react/24/outline",
  "@radix-ui/react-dialog",
  "@radix-ui/react-dropdown-menu",
  "@tiptap/core",
  "@tiptap/extensions",
  "@tiptap/react",
  "@tiptap/starter-kit",
  "@turf/boolean-point-in-polygon",
  "@turf/helpers",
  "@turf/kinks",
  "clsx",
  "framer-motion",
  "htmlparser2",
  "leaflet",
  "lucide-react",
  "next-intl",
  "next-themes",
  "polygon-clipping",
  "polylabel",
  "sonner",
  "tailwind-merge",
  "use-debounce",
  "vaul",
  "zod",
];

/** ADR-0021 — Storybook for the UI components, run as Vitest tests too. */
const config: StorybookConfig = {
  // Stories sit next to their component; the sidebar mirrors the folders, so
  // a story's title is also where its file lives.
  stories: [
    { directory: "../docs/storybook", titlePrefix: "Guide", files: "*.mdx" },
    {
      directory: "../app/ui",
      titlePrefix: "UI",
      files: "**/*.@(mdx|stories.@(ts|tsx))",
    },
    {
      directory: "../app/modules",
      titlePrefix: "Modules",
      files: "**/*.@(mdx|stories.@(ts|tsx))",
    },
  ],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-vitest",
  ],
  framework: { name: "@storybook/nextjs-vite", options: {} },
  // `./public` stands in for routes a story's component requests: the record
  // image route, with drawn fixtures (`fixtures/images.ts`).
  staticDirs: ["../public", "./public"],
  // Lets a story render an async Server Component (`EntityList`,
  // `AccountsTable`): React renders it on the client inside a Suspense
  // boundary. Its data functions are stubs (`serverModuleStubs`).
  features: { experimentalRSC: true },
  core: { disableTelemetry: true },
  viteFinal: (viteConfig) =>
    mergeConfig(viteConfig, {
      plugins: [serverModuleStubs()],
      // Pre-bundled up front. Vite otherwise discovers a dependency the first
      // time a story imports it and reloads the page mid-run, which fails
      // whichever story tests were in flight ("Vite unexpectedly reloaded a
      // test"). A library missing here costs one reload, not a wrong result.
      optimizeDeps: { include: UI_DEPENDENCIES },
      resolve: {
        alias: [
          // Server-only entry points a component imports directly. Every
          // other server module is stubbed by `serverModuleStubs`.
          {
            find: /^next-intl\/server$/,
            replacement: mock("nextIntlServer.ts"),
          },
          { find: /^@\/auth$/, replacement: mock("auth.ts") },
        ],
      },
    }),
};

export default config;
