"use client";

import { useEffect, useState } from "react";
import Sparkline from "./Sparkline";

interface Quote { symbol: string; name: string; price: number; change24h: number; spark: number[] }

function fmtPrice(p: number) {
  return p >= 1000 ? p.toLocaleString("en-US", { maximumFractionDigits: 2 })
                   : p.toLocaleString("en-US", { maximumFractionDigits: 3 });
}

export default function Watchlist({ className = "" }: { className?: string }) {
  const [quotes, setQuotes] = useState<Quote[] | null>(null);
  const [source, setSource] = useState<string>("");
  const [ts, setTs] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/market");
        const data = (await res.json()) as { ok: boolean; source: string; quotes: Quote[]; ts: number };
        if (!alive || !data.ok) return;
        setQuotes(data.quotes); setSource(data.source); setTs(data.ts);
      } catch { /* rail shows nothing rather than stale guesses */ }
    };
    load();
    const t = setInterval(load, 45_000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  return (
    <section aria-label="Watchlist" className={`panel-flat flex flex-col p-4 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="section-label">Watchlist · USD</span>
        <span className="num text-[8px] uppercase tracking-[0.18em] text-faint">{source === "coingecko" ? "CoinGecko" : source === "static-fallback" ? "offline marks" : "…"}</span>
      </div>
      {source === "static-fallback" && (
        <p className="mt-2 rounded-md border border-warn/30 bg-warn/10 px-2 py-1.5 font-mono text-[8px] uppercase tracking-[0.14em] text-warn">Static marks — not live tape</p>
      )}
      <ul className="mt-3 divide-y hairline-soft">
        {(quotes ?? []).map((q) => {
          const up = q.change24h >= 0;
          return (
            <li key={q.symbol} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="num text-[12px] font-semibold text-paper">{q.symbol}/USD</span>
                  <span className={`num text-[9px] ${up ? "text-up" : "text-down"}`}>{up ? "+" : ""}{q.change24h.toFixed(2)}%</span>
                </div>
                <div className="num mt-0.5 text-[10px] text-muted">${fmtPrice(q.price)}</div>
                <div className="mt-0.5 font-mono text-[7px] uppercase tracking-[0.18em] text-faint">Exposure: none · flat</div>
              </div>
              <Sparkline data={q.spark} positive={up} width={88} height={30} />
            </li>
          );
        })}
        {!quotes && [0, 1, 2].map((i) => <li key={i} className="animate-pulse rounded-md py-4"><div className="h-4 w-24 rounded bg-obsidian-800" /><div className="mt-1 h-3 w-16 rounded bg-obsidian-800" /></li>)}
      </ul>
      <p className="mt-auto pt-3 font-mono text-[7px] uppercase tracking-[0.18em] text-faint">
        {ts ? `marks as of ${new Date(ts).toISOString().slice(11, 16)} UTC · 45s cache · never execution prices` : "loading marks…"}
      </p>
    </section>
  );
}
