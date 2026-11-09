import { loadTrackRecord } from "@/lib/record";

export const dynamic = "force-dynamic";

function csvCell(v: string | number) {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function GET() {
  const record = loadTrackRecord();
  const rows = record?.closed_trades ?? [];
  const head = "token,chain,entry_price,exit_price,size_usd,pnl_usd,partials_taken,exit_reason,closed_at";
  const body = rows.map((t) =>
    [t.token, t.chain, t.entry_price, t.exit_price, t.size_usd.toFixed(2), t.pnl.toFixed(2), t.partials_taken, csvCell(t.reason), t.closed_at].join(",")
  );
  return new Response([head, ...body].join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="primevest-trading-bot-paper-fills.csv"',
    },
  });
}
