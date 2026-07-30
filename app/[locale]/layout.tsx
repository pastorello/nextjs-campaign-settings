import { NextIntlClientProvider } from "next-intl";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { Metadata } from "next";

import { routing } from "@/i18n/routing";
import { inter } from "../ui/fonts";
import Toaster from "../ui/components/Toaster";

import "@/app/ui/global.css";

export const metadata: Metadata = {
  title: {
    template: "%s | Campaign Settings",
    default: "Campaign Settings",
  },
  description:
    "Compendio di una campagna D&D 5e: incantesimi, oggetti magici, PNG, divinità e mappa del mondo.",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html lang={locale}>
      <body className={`${inter.className} antialiased`}>
        <NextIntlClientProvider>
          {children}
          {/* Mounted once, at the root: every page can raise a toast (TD-10). */}
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
