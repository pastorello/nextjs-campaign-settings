import { createTranslator } from "next-intl";
import type * as NextIntlServer from "next-intl/server";

import en from "../../messages/en.json";
import it from "../../messages/it.json";

/**
 * Storybook's `next-intl/server` (ADR-0021). The real module reads the locale
 * from the request, and in a browser build it throws by design: it is for
 * Server Components only. Storybook renders those async components in the
 * browser (`experimentalRSC`), so `.storybook/main.ts` aliases the import here.
 *
 * The translator is next-intl's own `createTranslator` over the same catalogues
 * the app ships, so a server component's copy in a story is the real copy, in
 * the locale the toolbar picked — set by `preview.tsx`'s decorator.
 */

export const storyMessages = { it, en } as const;
export type StoryLocale = keyof typeof storyMessages;

/** Fixed, so a date renders the same on a laptop and on the CI runner. */
export const STORY_TIME_ZONE = "Europe/Rome";

let currentLocale: StoryLocale = "it";

export function setStoryLocale(locale: StoryLocale): void {
  currentLocale = locale;
}

function isStoryLocale(locale: string): locale is StoryLocale {
  return locale in storyMessages;
}

export const getLocale: typeof NextIntlServer.getLocale = () =>
  Promise.resolve(currentLocale);

type TranslationsOptions = string | { locale: string; namespace?: string };

function translationsFor(options?: TranslationsOptions) {
  const { locale = currentLocale, namespace } =
    typeof options === "object" ? options : { namespace: options };
  const resolved = isStoryLocale(locale) ? locale : currentLocale;
  return createTranslator({
    locale: resolved,
    messages: storyMessages[resolved],
    timeZone: STORY_TIME_ZONE,
    // The namespace is a runtime string here; the components that call
    // `getTranslations` are type-checked against next-intl's real signature.
    namespace: namespace as never,
  });
}

// One assertion, at the boundary: the overloaded real signature is generic in
// the namespace key, which a runtime implementation cannot be.
export const getTranslations = ((options?: TranslationsOptions) =>
  Promise.resolve(
    translationsFor(options)
  )) as unknown as typeof NextIntlServer.getTranslations;
