import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Handy — Global Tax Compliance",
  description:
    "Know your tax obligations anywhere in the world. Starting with crypto, expanding to all cross-border tax compliance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-navy text-white antialiased">{children}</body>
    </html>
  );
}
