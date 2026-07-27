import "@/app/ui/global.css";
import { inter } from "./ui/fonts";
import Toaster from "./ui/components/Toaster";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | Acme Dashboard",
    default: "Acme Dashboard",
  },
  description: "The official Next.js Learn Dashboard built with App Router.",
  metadataBase: new URL("https://next-learn-dashboard.vercel.sh"),
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
