import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { routing } from "./routing";
import type it from "../messages/it.json";

type Messages = typeof it;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  // Assertion: a template-literal specifier can't be resolved to its JSON
  // module's type, so the dynamic import is untyped at the call site.
  const messagesModule = (await import(`../messages/${locale}.json`)) as {
    default: Messages;
  };

  return { locale, messages: messagesModule.default };
});
