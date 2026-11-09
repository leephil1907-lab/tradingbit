export const dynamic = "force-dynamic";

interface Pair { baseToken?: { symbol?: string }; priceUsd?: string; priceChange?: { h24?: number } }

const SOL = "So11111111111111111111111111111111111111112";

export async function GET() {
  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${SOL}`, {
      next: { revalidate: 45 },
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`dexscreener ${res.status}`);
    const data = (await res.json()) as { pairs?: Pair[] | null };
    const quotes = [];
    for (const p of data.pairs ?? []) {
      if (p.priceUsd) {
        quotes.push({
          symbol: "SOL",
          name: "Solana",
          price: Number(p.priceUsd),
          change24h: p.priceChange?.h24 ?? 0,
        });
        break;
      }
    }
    // BTC/ETH/SOL majors reference via CoinGecko (DexScreener is the launch-market source of truth)
    try {
      const cg = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true",
        { next: { revalidate: 45 } }
      );
      if (cg.ok) {
        const j = (await cg.json()) as { bitcoin?: { usd: number; usd_24h_change: number }; ethereum?: { usd: number; usd_24h_change: number } };
        if (j.bitcoin) quotes.unshift({ symbol: "BTC", name: "Bitcoin", price: j.bitcoin.usd, change24h: j.bitcoin.usd_24h_change ?? 0 });
        if (j.ethereum) quotes.splice(quotes.length ? 1 : 1, 0, { symbol: "ETH", name: "Ethereum", price: j.ethereum.usd, change24h: j.ethereum.usd_24h_change ?? 0 });
      }
    } catch { /* SOL-only quote is fine */ }
    return Response.json({ ok: true, quotes, source: "dexscreener+coingecko", ts: new Date().toISOString() });
  } catch (err) {
    return Response.json({ ok: false, error: String(err) });
  }
}
