"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const PriceChart = dynamic(() => import("@/components/control/PriceChart"), {
  ssr: false,
  loading: () => <div className="h-[340px] w-full animate-pulse rounded-lg bg-obsidian-800" aria-label="Loading chart" />,
});

type Instrument = "BTC" | "ETH" | "SOL";
type TF = "1D" | "7D" | "1M";

// closes prop is accepted for future marker rendering when the bot holds an instrument
export default function PositionsClient({ closes }: { closes: unknown[] }) {
  const [instrument, setInstrument] = useState<Instrument>("SOL");
  const [timeframe, setTimeframe] = useState<TF>("7D");

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2" role="tablist" aria-label="Instrument">
          {(["BTC", "ETH", "SOL"] as Instrument[]).map((i) => (
            <button key={i} role="tab" aria-selected={instrument === i} onClick={() => setInstrument(i)}
              className={`ctl-btn !px-3 !py-1.5 !text-[10px] ${instrument === i ? "ctl-btn-gold" : ""}`}>
              {i}/USD
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2" role="tablist" aria-label="Timeframe">
          {(["1D", "7D", "1M"] as TF[]).map((t) => (
            <button key={t} role="tab" aria-selected={timeframe === t} onClick={() => setTimeframe(t)}
              className={`ctl-btn !px-3 !py-1.5 !text-[10px] ${timeframe === t ? "ctl-btn-gold" : ""}`}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3">
        <PriceChart instrument={instrument} timeframe={timeframe} />
      </div>
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[8px] uppercase tracking-[0.18em] text-faint">
        <span><span className="text-up">▲</span> entry marker</span>
        <span><span className="text-down">■</span> stop-loss</span>
        <span><span className="text-gold-400">◆</span> take-profit</span>
        <span className="text-paper">{closes.length} historical fills on record — see blotter below</span>
      </div>
    </>
  );
}
