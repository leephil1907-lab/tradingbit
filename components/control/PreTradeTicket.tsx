"use client";

import { useEffect, useMemo, useState } from "react";

const FEE = 0.003; // 0.3% per side, modeled
const BASE: Record<string, string> = { SOLUSDT: "SOL", BTCUSDT: "BTC", ETHUSDT: "ETH" };

/**
 * Pre-trade ticket — the discipline brokers enforce (“TP/SL before entry”, “see your
 * worst case before you confirm”), implemented honestly for a paper desk.
 * All math is deterministic from the configured terms; the only live input is the mark.
 */
export default function PreTradeTicket({
  symbol, sizeUsd, slPct, tp1, tp1Pct, equity,
}: {
  symbol: string; sizeUsd: number; slPct: number; tp1: number; tp1Pct: number; equity: number;
}) {
  const [mark, setMark] = useState<number | null>(null);
  const [markSource, setMarkSource] = useState<string>("loading");

  useEffect(() => {
    let alive = true;
    fetch("/api/market")
      .then((r) => r.json())
      .then((d: { ok: boolean; source: string; quotes: { symbol: string; price: number }[] }) => {
        if (!alive || !d.ok) return;
        const q = d.quotes.find((q) => q.symbol === BASE[symbol]);
        setMark(q?.price ?? null);
        setMarkSource(d.source);
      })
      .catch(() => { if (alive) setMarkSource("unavailable"); });
    return () => { alive = false; };
  }, [symbol]);

  const t = useMemo(() => {
    const notional = sizeUsd;
    const fees = 2 * FEE * notional; // entry + modeled exit at same notional
    const stopLossUsd = (Math.abs(slPct) / 100) * notional;
    const worstCase = stopLossUsd + fees;
    const tp1Gain = ((tp1 - 1) * (tp1Pct / 100)) * notional; // gain on the TP1 tranche only
    const equityAfterStop = equity - worstCase;
    const qty = mark && mark > 0 ? notional / mark : null;
    return { notional, fees, stopLossUsd, worstCase, tp1Gain, equityAfterStop, qty };
  }, [sizeUsd, slPct, tp1, tp1Pct, equity, mark]);

  const rows: Array<[string, string, string?]> = [
    ["Mark", mark ? `$${mark.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${markSource === "static-fallback" ? "· STATIC" : ""}` : markSource === "unavailable" ? "feed unavailable" : "…", markSource === "static-fallback" ? "text-warn" : undefined],
    ["Quantity (est.)", t.qty ? `${t.qty.toPrecision(4)} ${BASE[symbol]}` : "—"],
    ["Ticket cost (est.)", `$${t.notional.toFixed(2)} + $${t.fees.toFixed(2)} fees`],
    ["Worst case at stop", `−$${t.worstCase.toFixed(2)}  (${((t.worstCase / equity) * 100).toFixed(2)}% of equity)`, "text-down"],
    ["Equity if stopped out", `$${t.equityAfterStop.toFixed(2)}`],
    [`If TP1 (${tp1}×) fills ${tp1Pct}%`, `+$${t.tp1Gain.toFixed(2)} before fees on remainder`, "text-up"],
  ];

  return (
    <section aria-label="Pre-trade ticket" className="panel-flat mt-4 p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="section-label">Pre-trade ticket</span>
        <span className="num font-mono text-[8px] uppercase tracking-[0.18em] text-faint">fees 0.3%/side · paper</span>
      </div>
      <dl className="mt-3">
        {rows.map(([k, v, tone]) => (
          <div key={k} className="flex items-baseline justify-between gap-3 border-b border-dotted hairline-soft py-1.5 last:border-b-0">
            <dt className="text-[10px] text-faint">{k}</dt>
            <dd className={`num text-right text-[11px] ${tone ?? "text-paper"}`}>{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-[9px] leading-4 text-faint">Estimates from configured terms, not a promise. Slippage on thin launch books can exceed the model; the shield resizes or vetoes, never upsizes. Nothing here is investment advice; availability of live markets varies by jurisdiction.</p>
    </section>
  );
}
