import type { Metadata } from "next";
import { Figtree, JetBrains_Mono, Jost } from "next/font/google";
import "./globals.css";
import SessionWrapper from "@/components/SessionWrapper";
import { I18nProvider } from "@/lib/i18n";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree", display: "swap" });
const jost = Jost({ subsets: ["latin"], variable: "--font-jost", display: "swap" });
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kemkvitto",
  description: "Digitala kvitton for kemtvatt",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv" className={`${figtree.variable} ${jost.variable} ${jetbrains.variable}`}>
      <body>
        <I18nProvider>
          <SessionWrapper>{children}</SessionWrapper>
        </I18nProvider>
      </body>
    </html>
  );
}
