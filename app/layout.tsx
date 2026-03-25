import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Link&Drink",
  description: "AI-powered bar crawl app for Västerås and Stockholm."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body>{children}</body>
    </html>
  );
}