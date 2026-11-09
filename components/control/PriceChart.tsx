"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart, ColorType, CandlestickSeries, HistogramSeries,
  type IChartApi, type ISeriesApi, type Time,
} from "lightweight-charts";

type Instrument = "BTC" | "ETH" | "SOL";
type TF = "1D" | "7D" | "1M";

const BINANCE_SYMBOL: Record<Instrument, string> = { BTC: "BTCUSDT", ETH: "ETHUSDT", SOL: "SOLUSDT" };
const CG_ID: Record<Instrument, string> = { BTC: "bitcoin", ETH: "ethereum", SOL: "solana" };
const TF_MAP: Record<TF, { interval: string; limit: number; days: number }> = {
  "1D": { interval: "15m", limit: 96, days: 1 },
  "7D": { interval: "1h", limit: 168, days: 7 },
  "1M": { interval: "4h", limit: 180, days: 30 },
};

interface Candle { time: Time; open: number; high: number; low: number; close: number; volume?: number }
type LoadState = "loading" | "binance" | "coingecko" | "error";

function themeColors() {
  const light = typeof document !== "undefined" && document.documentElement.dataset.theme === "light";
  return {
    layout: {
      background: { type: ColorType.Solid, color: "transparent" as const },
      textColor: light ? "#454138" : "#c9c2b4",
      fontFamily: "var(--font-mono), ui-monospace, monospace",
    },
    grid: {
      vertLines: { color: light ? "rgba(90,70,30,0.08)" : "rgba(223,192,138,0.06)" },
      horzLines: { color: light ? "rgba(90,70,30,0.08)" : "rgba(223,192,138,0.06)" },
    },
    crosshair: { vertLine: { color: light ? "#8a6a2f" : "#b8924a", labelBackgroundColor: light ? "#7a5c1e" : "#8a6a2f" },
                 horzLine: { color: light ? "#8a6a2f" : "#b8924a", labelBackgroundColor: light ? "#7a5c1e" : "#8a6a2f" } },
  };
}

export default function PriceChart({ instrument, timeframe }: { instrument: Instrument; timeframe: TF }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [themeTick, setThemeTick] = useState(0);

  // re-create chart on theme flip
  useEffect(() => {
    const onTheme = () => setThemeTick((t) => t + 1);
    window.addEventListener("pv-theme", onTheme);
    return () => window.removeEventListener("pv-theme", onTheme);
  }, []);

  // mount chart once per theme tick
  useEffect(() => {
    if (!containerRef.current) return;
    const colors = themeColors();
    const chart = createChart(containerRef.current, {
      height: 340,
      autoSize: true,
      layout: colors.layout,
      grid: colors.grid,
      crosshair: colors.crosshair,
      rightPriceScale: { borderColor: "rgba(223,192,138,0.15)" },
      timeScale: { borderColor: "rgba(223,192,138,0.15)", timeVisible: true, secondsVisible: false },
    });
    const candles = chart.addSeries(CandlestickSeries, {
      upColor: "#2ee6a8", downColor: "#ff5b6e",
      wickUpColor: "#2ee6a8", wickDownColor: "#ff5b6e",
      borderVisible: false,
    });
    const vol = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" }, priceScaleId: "", lastValueVisible: false, priceLineVisible: false,
    });
    chart.priceScale("").applyOptions({ scaleMargins: { top: 0.78, bottom: 0 } });
    chartRef.current = chart; candleRef.current = candles; volRef.current = vol;
    return () => { chart.remove(); chartRef.current = null; candleRef.current = null; volRef.current = null; };
  }, [themeTick]);

  // fetch + apply data
  useEffect(() => {
    let cancelled = false;
    setState("loading");
    const tf = TF_MAP[timeframe];

    const apply = (candles: Candle[], source: LoadState) => {
      if (cancelled || !candleRef.current || !volRef.current) return;
      candleRef.current.setData(candles.map(({ time, open, high, low, close }) => ({ time, open, high, low, close })));
      volRef.current.setData(
        candles.map((c) => ({ time: c.time, value: c.volume ?? 0, color: c.close >= c.open ? "rgba(46,230,168,0.35)" : "rgba(255,91,110,0.35)" }))
      );
      chartRef.current?.timeScale().fitContent();
      setState(source);
    };

    const fromBinance = async (): Promise<Candle[]> => {
      const url = `https://api.binance.com/api/v3/klines?symbol=${BINANCE_SYMBOL[instrument]}&interval=${tf.interval}&limit=${tf.limit}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`binance ${res.status}`);
      const rows = (await res.json()) as Array<[number, string, string, string, string, string, ...unknown[]]>;
      return rows.map(([t, o, h, l, c, v]) => ({
        time: Math.floor(t / 1000) as Time,
        open: Number(o), high: Number(h), low: Number(l), close: Number(c), volume: Number(v),
      }));
    };
    const fromCoinGecko = async (): Promise<Candle[]> => {
      const res = await fetch(`https://api.coingecko.com/api/v3/coins/${CG_ID[instrument]}/ohlc?vs_currency=usd&days=${tf.days}`);
      if (!res.ok) throw new Error(`coingecko ${res.status}`);
      const rows = (await res.json()) as Array<[number, number, number, number, number]>;
      return rows.map(([t, o, h, l, c]) => ({ time: Math.floor(t / 1000) as Time, open: o, high: h, low: l, close: c }));
    };

    (async () => {
      try { apply(await fromBinance(), "binance"); }
      catch {
        try { apply(await fromCoinGecko(), "coingecko"); }
        catch { if (!cancelled) setState("error"); }
      }
    })();
    return () => { cancelled = true; };
  }, [instrument, timeframe, themeTick]);

  return (
    <div className="relative">
      <div ref={containerRef} className="h-[340px] w-full" role="application"
           aria-label={`${instrument}/USD candlestick chart, timeframe ${timeframe}`} />
      <div className="pointer-events-none absolute left-2 top-2 rounded border hairline-soft bg-obsidian-950/70 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.18em] text-faint backdrop-blur">
        {state === "loading" && "loading candles…"}
        {state === "binance" && `${BINANCE_SYMBOL[instrument]} · Binance klines · ${timeframe}`}
        {state === "coingecko" && `${instrument}/USD · CoinGecko OHLC · ${timeframe} · volume n/a`}
        {state === "error" && "market data unavailable — retry or check connectivity"}
      </div>
      <p className="mt-2 px-1 font-mono text-[8px] uppercase tracking-[0.18em] text-faint">
        Entry / stop-loss / take-profit markers render here only while the paper bot holds this instrument
      </p>
    </div>
  );
}
