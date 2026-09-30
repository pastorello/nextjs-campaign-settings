import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // SPEC-022: `forbidden()` and its `forbidden.tsx` page, for a player
    // reaching a page that is the DM's alone.
    authInterrupts: true,
  },
};

export default withNextIntl(nextConfig);
