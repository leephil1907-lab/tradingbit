"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useBot } from "@/components/shell/bot-context";

interface Quote { symbol: string; name: string; price: number; change24h: number; spark: number[] }

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  if (!data.length) return null;
  const W = 96, H = 30;
  const min = Math.min(...data), max = Math.max(...data);
  const span = Math.max(max - min, 1e-9);
  const pts = data.map((v, i) => `${((i / (data.length - 1)) * W).toFixed(1)},${(H - 2 - ((v - min) / span) * (H - 4)).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden="true">
      <polyline points={pts} fill="none" stroke={positive ? "var(--up)" : "var(--down)"} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" opacity="0.9" />
    </svg>
  );
}

function fmtPrice(p: number) {
  return p >= 1000 ? p.toLocaleString("en-US", { maximumFractionDigits: 2 }) : p.toLocaleString("en-US", { maximumFractionDigits: 3 });
}

export default function ContextRail() {
  const { feedOk, heartbeatSeconds, status } = useBot();
  const [quotes, setQuotes] = useState<Quote[] | null>(null);
  const [source, setSource] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/market", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { ok: boolean; source?: string; quotes?: Quote[] }) => {
        if (!cancelled && d.quotes?.length) { setQuotes(d.quotes); setSource(d.source ?? ""); }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return (
    <aside className="hidden w-[19rem] shrink-0 flex-col gap-4 border-l hairline px-4 py-5 xl:flex" aria-label="Market context">
      <div>
        <div className="section-label flex items-center justify-between">Market context <span className="text-[9px] normal-case tracking-normal">{source === "coingecko" ? "live · CoinGecko" : "reference"}</span></div>
        <ul className="mt-3 space-y-2">
          {(quotes ?? []).map((q) => {
            const up = q.change24h >= 0;
            return (
              <li key={q.symbol} className="flex items-center justify-between gap-2 rounded-lg border hairline-soft px-3 py-2">
                <div className="min-w-0">
                  <div className="num text-[11px] font-semibold text-paper">{q.symbol}/USD</div>
                  <div className="num text-[11px] text-muted">${fmtPrice(q.price)}</div>
                  <div className={`num text-[9px] ${up ? "text-up" : "text-down"}`}>{up ? "+" : ""}{q.change24h.toFixed(2)}% · 24h</div>
                </div>
                <Sparkline data={q.spark} positive={up} />
              </li>
            );
          })}
          {!quotes && <li className="rounded-lg border hairline-soft px-3 py-6 text-center font-mono text-[10px] text-faint pulse-soft">loading context…</li>}
        </ul>
      </div>

      <div className="rounded-lg border hairline-soft p-3">
        <div className="section-label">Data feed</div>
        <div className="mt-2 flex items-center gap-2">
          <span className={`inline-block h-2 w-2 rounded-full ${feedOk === null ? "bg-faint" : feedOk ? "bg-up" : "bg-down"}`} />
          <span className="num text-[11px] text-paper">{feedOk === null ? "Probing…" : feedOk ? "Live" : "Degraded"}</span>
          <span className="ml-auto num text-[9px] text-faint">heartbeat {heartbeatSeconds}s</span>
        </div>
        <ul className="mt-2 space-y-1 font-mono text-[9px] leading-4 text-faint">
          <li>DexScreener · public · launch markets</li>
          <li>CoinGecko · public · majors &amp; sparklines</li>
          <li>GMGN · not configured (Phase 2)</li>
          <li>Solana RPC · not configured (Phase 2)</li>
        </ul>
      </div>

      <Link href="/alerts" className="block rounded-lg border border-warn/30 bg-warn/5 p-3 transition-colors hover:border-warn/50">
        <div className="section-label !text-warn">Needs attention</div>
        <p className="mt-1.5 text-[11px] leading-5 text-muted">
          {status === "halted"
            ? "Kill switch engaged — review audit log before any restart."
            : "2 warnings open: synthetic-feed methodology + equity presentation. No action required."}
        </p>
        <span className="num mt-2 inline-block text-[9px] uppercase tracking-[0.2em] text-warn">Open alerts →</span>
      </Link>
    </aside>
  );
}
