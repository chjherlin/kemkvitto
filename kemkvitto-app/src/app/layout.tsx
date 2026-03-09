import type { Metadata } from "next";
import "./globals.css";
import SessionWrapper from "@/components/SessionWrapper";
import { I18nProvider } from "@/lib/i18n";

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
    <html lang="sv">
      <body>
        <I18nProvider>
          <SessionWrapper>{children}</SessionWrapper>
        </I18nProvider>
      </body>
    </html>
  );
}
