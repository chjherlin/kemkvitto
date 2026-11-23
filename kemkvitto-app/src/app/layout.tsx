import type { Metadata } from "next";
import "./globals.css";
import SessionWrapper from "@/components/SessionWrapper";
import { I18nProvider } from "@/lib/i18n";
import { figtree, jetbrains, jost } from "@/lib/fonts";

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
