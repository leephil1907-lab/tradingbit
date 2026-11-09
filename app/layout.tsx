import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Ticker from "@/components/Ticker";

const display = Playfair_Display({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-mono", display: "swap" });

const PRIMEVEST_URL = process.env.NEXT_PUBLIC_PRIMEVEST_URL ?? "https://primevest-web.onrender.com";

export const metadata: Metadata = {
  metadataBase: new URL(PRIMEVEST_URL),
  title: {
    default: "PRIMEVEST Trading Bot — Precision, automated.",
    template: "%s · PRIMEVEST Trading Bot",
  },
  description:
    "A five-agent consensus paper-trading research product by PRIMEVEST. No single signal opens a position; every decision is audit-logged. Paper mode first — real activation only after PRIMEVEST desk review.",
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }] },
  openGraph: {
    title: "PRIMEVEST Trading Bot",
    description: "Precision, automated. Five agents, one decision, a permanent audit log.",
    siteName: "PRIMEVEST Trading Bot",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0908",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="min-h-dvh bg-obsidian-950 text-paper antialiased">
        <Header />
        <Ticker />
        <main id="main-content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
