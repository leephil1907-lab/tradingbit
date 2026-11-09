import Image from "next/image";
import Link from "next/link";

const PRIMEVEST_URL = process.env.NEXT_PUBLIC_PRIMEVEST_URL ?? "https://primevest-web.onrender.com";

export default function Footer() {
  return (
    <footer className="border-t hairline bg-obsidian-900">
      <div className="mx-auto max-w-container px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <div className="flex items-center gap-3">
              <Image src="/brand/icon.svg" alt="PRIMEVEST" width={30} height={30} />
              <div className="leading-none">
                <div className="font-display text-base font-semibold tracking-[0.22em] text-paper">PRIMEVEST</div>
                <div className="mt-1 font-mono text-[8px] tracking-[0.34em] text-gold-500">TRADING&nbsp;BOT</div>
              </div>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-6 text-muted">
              A five-agent consensus system for volatile launch markets. Paper-traded first,
              fully audit-logged, and activated for anyone&apos;s real capital only after PRIMEVEST desk review.
            </p>
          </div>
          <div className="md:col-span-2">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">PRIMEVEST</div>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li><a className="hover:text-gold-400" href={PRIMEVEST_URL}>Terminal</a></li>
              <li><a className="hover:text-gold-400" href={`${PRIMEVEST_URL}/markets`}>Markets</a></li>
              <li><a className="hover:text-gold-400" href={`${PRIMEVEST_URL}/login`}>Sign in</a></li>
            </ul>
          </div>
          <div className="md:col-span-2">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">Trading Bot</div>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li><Link className="hover:text-gold-400" href="/dashboard">Dashboard</Link></li>
              <li><Link className="hover:text-gold-400" href="/agents">Agents</Link></li>
              <li><Link className="hover:text-gold-400" href="/track-record">Track record</Link></li>
            </ul>
          </div>
          <div className="md:col-span-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">Risk</div>
            <p className="mt-3 text-xs leading-5 text-muted">
              Trading cryptoassets involves substantial risk of loss. Nothing on this page is financial,
              investment or legal advice. Simulated results do not represent live performance.
              Full terms on the <Link href="/disclosures" className="text-gold-400 hover:underline">disclosures</Link> page.
            </p>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t hairline-soft pt-6 text-[11px] text-faint md:flex-row md:items-center md:justify-between">
          <span>© 2026 PRIMEVEST. All rights reserved. PRIMEVEST and the voxel-P mark are PRIMEVEST assets.</span>
          <span className="num">Prices: DexScreener {PRIMEVEST_URL.includes("onrender") ? "· Terminal data: TradingView/Kraken/CoinGecko" : ""}</span>
        </div>
      </div>
    </footer>
  );
}
