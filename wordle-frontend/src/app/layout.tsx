import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wordle Arena",
  description:
    "Competitive word game platform — Daily challenges, Practice mode, and 1v1 Arena matches",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className="h-full"
    >
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
