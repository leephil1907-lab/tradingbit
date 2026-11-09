export const dynamic = "force-dynamic";

interface CGMarket {
  id: string; symbol: string; name: string; current_price: number;
  price_change_percentage_24h_in_currency?: number | null;
  sparkline_in_7d?: { price?: number[] } | null;
}

const FALLBACK = {
  ok: true as const, source: "static-fallback",
  quotes: [
    { symbol: "BTC", name: "Bitcoin", price: 75444.7, change24h: 0.8, spark: [74000, 74550, 74220, 75100, 75444.7] },
    { symbol: "ETH", name: "Ethereum", price: 2155.0, change24h: 1.35, spark: [2100, 2120, 2090, 2140, 2155] },
    { symbol: "SOL", name: "Solana", price: 88.23, change24h: 1.96, spark: [85.2, 86.1, 84.9, 87.4, 88.23] },
  ],
};

export async function GET() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana&order=market_cap_desc&price_change_percentage=24h&sparkline=true",
      { next: { revalidate: 45 }, headers: { accept: "application/json" } }
    );
    if (!res.ok) throw new Error(`coingecko ${res.status}`);
    const rows = (await res.json()) as CGMarket[];
    const quotes = rows.map((r) => ({
      symbol: r.symbol.toUpperCase(),
      name: r.name,
      price: r.current_price,
      change24h: r.price_change_percentage_24h_in_currency ?? 0,
      spark: downsample(r.sparkline_in_7d?.price ?? [], 48),
    }));
    if (!quotes.length) throw new Error("empty markets payload");
    return Response.json({ ok: true, source: "coingecko", quotes, ts: new Date().toISOString() });
  } catch {
    return Response.json({ ...FALLBACK, ts: new Date().toISOString() });
  }
}

function downsample(arr: number[], n: number): number[] {
  if (arr.length <= n) return arr;
  const step = (arr.length - 1) / (n - 1);
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push(arr[Math.round(i * step)]!);
  return out;
}
