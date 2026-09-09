import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tax Return Review",
  description: "Internal U.S. corporate income tax return review workspace.",
  other: { "codex-preview": "development" },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
