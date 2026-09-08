import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wordle Arena",
  description:
    "Competitive word game platform — Daily challenges, Practice mode, and 1v1 Arena matches",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-full antialiased font-body">{children}</body>
    </html>
  );
}
