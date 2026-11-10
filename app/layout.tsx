import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const display = Playfair_Display({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-mono", display: "swap" });

const PRIMEVEST_URL = process.env.NEXT_PUBLIC_PRIMEVEST_URL ?? "https://vantabrokerage.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(PRIMEVEST_URL),
  title: {
    default: "PrimeVest Atlas — Intelligent Trading System",
    template: "%s · PrimeVest Atlas",
  },
  description:
    "PrimeVest Atlas is the intelligent trading system from PRIMEVEST: multi-agent market analysis, demo execution, strategy research and audited risk controls.",
  applicationName: "PrimeVest Atlas",
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }] },
  openGraph: {
    title: "PrimeVest Atlas",
    description: "Intelligent Trading, Engineered with Precision.",
    siteName: "PrimeVest Atlas",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0908",
  colorScheme: "dark light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <body className="min-h-dvh bg-obsidian-950 text-paper antialiased">{children}</body>
    </html>
  );
}
