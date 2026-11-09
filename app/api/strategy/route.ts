import { appendAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const name = typeof body.strategy === "string" ? body.strategy.slice(0, 80) : "Launch-Momentum Consensus v0.1";
    const symbol = typeof body.symbol === "string" ? body.symbol.slice(0, 16) : "SOLUSDT";
    const mode = "paper"; // live modes do not exist in this build
    const summary = typeof body.summary === "string" ? body.summary.slice(0, 280) : `${name} on ${symbol} · paper draft saved`;
    const entry = appendAudit("STRATEGY_SAVED", `${name} · ${symbol} · ${mode} · ${summary}`);
    return Response.json({ ok: true, ref: entry.ref, summary });
  } catch {
    return Response.json({ ok: false, error: "Malformed request." }, { status: 400 });
  }
}
