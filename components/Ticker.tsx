"use client";

import { useEffect, useState } from "react";

interface Quote { symbol: string; name: string; price: number; change24h: number }
interface MarketResp { ok: boolean; quotes?: Quote[] }

function fmt(n: number) {
  return n >= 1000 ? n.toLocaleString("en-US", { maximumFractionDigits: 2 }) : n.toLocaleString("en-US", { maximumFractionDigits: 4 });
}

export default function Ticker() {
  const [quotes, setQuotes] = useState<Quote[] | null>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/market", { cache: "no-store" });
        const data = (await res.json()) as MarketResp;
        if (!cancelled && data.ok && data.quotes?.length) {
          setQuotes(data.quotes);
          setLive(true);
          return;
        }
      } catch { /* keep feed unavailable; never invent a market mark */ }
      if (!cancelled) { setQuotes([]); setLive(false); }
    };
    load();
    const id = setInterval(load, 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const items = quotes ?? [];
  const doubled = [...items, ...items];

  return (
    <div className="overflow-hidden border-b hairline-soft bg-obsidian-900 py-2" aria-hidden="true">
      <div className="ticker-track">
        {doubled.map((q, i) => {
          const up = q.change24h >= 0;
          return (
            <span key={`${q.symbol}-${i}`} className="num flex items-center gap-2 text-[11px] text-muted">
              <span className="text-paper">{q.symbol}/USD</span>
              <span>${fmt(q.price)}</span>
              <span className={up ? "text-up" : "text-down"}>{up ? "▲" : "▼"} {Math.abs(q.change24h).toFixed(2)}%</span>
            </span>
          );
        })}
      </div>
      <span className="sr-only">{live ? "Live market prices via CoinGecko" : "Market prices unavailable"}</span>
    </div>
  );
}
