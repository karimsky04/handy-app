import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Is Your Country Sharing Your Crypto Data? | Free Checker — Handy",
  description:
    "Starting 2026, tax authorities across 48 countries are exchanging cryptocurrency transaction data under CARF and DAC8. Check what this means for you in 60 seconds.",
  openGraph: {
    title: "Is Your Country Sharing Your Crypto Data? | Free Checker",
    description:
      "48 countries are now exchanging your crypto transaction data. Find out your risk level in 60 seconds with this free CARF/DAC8 compliance checker.",
    type: "website",
    siteName: "Handy",
  },
  twitter: {
    card: "summary_large_image",
    title: "Is Your Country Sharing Your Crypto Data? | Free Checker",
    description:
      "48 countries are now exchanging your crypto transaction data. Find out your risk level in 60 seconds.",
  },
};

export default function CARFLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
