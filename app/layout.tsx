import "@/app/ui/global.css";
import { inter } from "./ui/fonts";
import Toaster from "./ui/components/Toaster";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | Campaign Settings",
    default: "Campaign Settings",
  },
  description:
    "Compendio di una campagna D&D 5e: incantesimi, oggetti magici, PNG, divinità e mappa del mondo.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        {children}
        {/* Mounted once, at the root: every page can raise a toast (TD-10). */}
        <Toaster />
      </body>
    </html>
  );
}
