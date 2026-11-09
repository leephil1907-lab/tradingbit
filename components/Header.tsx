import Image from "next/image";
import Link from "next/link";

const PRIMEVEST_URL = process.env.NEXT_PUBLIC_PRIMEVEST_URL ?? "https://primevest-web.onrender.com";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b hairline bg-obsidian-950/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-container items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3" aria-label="PRIMEVEST Trading Bot — home">
          <Image src="/brand/icon.svg" alt="PRIMEVEST" width={36} height={36} priority />
          <span className="leading-none">
            <span className="block font-display text-[19px] font-semibold tracking-[0.22em] text-paper">PRIMEVEST</span>
            <span className="mt-1 block font-mono text-[9px] tracking-[0.34em] text-gold-400">TRADING&nbsp;BOT</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-7 font-mono text-[11px] uppercase tracking-[0.16em] text-muted md:flex">
          <Link href="/track-record" className="transition-colors hover:text-gold-400">Track record</Link>
          <Link href="/agents" className="transition-colors hover:text-gold-400">Agents</Link>
          <Link href="/disclosures" className="transition-colors hover:text-gold-400">Disclosures</Link>
        </nav>
        <div className="flex items-center gap-3">
          <span className="badge badge-warn hidden sm:inline-flex">Paper&nbsp;mode</span>
          <a href={PRIMEVEST_URL} className="btn btn-ghost !px-3 !py-2 text-[10px]" rel="noreferrer">
            Open terminal <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </header>
  );
}
