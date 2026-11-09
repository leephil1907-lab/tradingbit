import type { Metadata } from "next";
import Link from "next/link";
import { loadTrackRecord } from "@/lib/record";
import { fmtSignedUsd } from "@/lib/format";
import PositionsClient from "./PositionsClient";

export const metadata: Metadata = { title: "Positions & orders · Control room" };

export default function PositionsPage() {
  const record = loadTrackRecord();
  const closes = record?.closed_trades ?? [];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-paper">Positions &amp; orders</h1>
          <p className="mt-1 text-sm text-muted">Live paper blotter. Nothing here is a real order.</p>
        </div>
        <Link href="/strategies" className="btn btn-ghost !py-2 !text-[10px]">Strategy setup →</Link>
      </div>

      {/* Chart — the centerpiece */}
      <section aria-label="Price chart" className="panel-flat mt-4 p-4">
        <PositionsClient closes={closes} />
      </section>

      {/* Blotter */}
      <section id="orders" aria-label="Order blotter" className="panel-flat mt-4 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b hairline px-5 py-4">
          <span className="section-label">Order &amp; fill blotter</span>
          <span className="num text-[9px] text-faint">{closes.length} closed fills · 0 open · 0 pending</span>
        </div>

        <div className="overflow-x-auto">
          <table className="dtable min-w-[820px]">
            <thead>
              <tr><th>Time (UTC)</th><th>Symbol</th><th>Dir</th><th className="text-right">Entry</th><th className="text-right">Exit</th><th className="text-right">Size</th><th className="text-right">Realized</th><th>Exit reason</th><th className="text-center">Partials</th><th></th></tr>
            </thead>
            <tbody className="num">
              {closes.map((t, i) => (
                <tr key={i} className="row-hover">
                  <td className="text-faint">{t.closed_at?.slice(11, 19) ?? "—"}</td>
                  <td className="text-paper">{t.token}</td>
                  <td><span className="text-up">LONG</span></td>
                  <td className="text-right">{t.entry_price.toExponential(2)}</td>
                  <td className="text-right">{t.exit_price.toExponential(2)}</td>
                  <td className="text-right">${t.size_usd.toFixed(2)}</td>
                  <td className={`text-right ${t.pnl >= 0 ? "text-up" : "text-down"}`}>{fmtSignedUsd(t.pnl)}</td>
                  <td className="max-w-[230px] truncate font-sans text-[10px] text-muted" title={t.reason}>{t.reason}</td>
                  <td className="text-center">{t.partials_taken}</td>
                  <td><button type="button" className="ctl-btn !px-2 !py-1 !text-[8px] opacity-40" disabled title="Already closed — retained for audit completeness">Closed</button></td>
                </tr>
              ))}
              {closes.length === 0 && (
                <tr><td colSpan={10} className="py-8 text-center text-sm text-faint">No fills yet. When consensus fires, fills land here with entry, fees and the agent coalition behind them.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t hairline px-5 py-3 font-mono text-[9px] leading-4 text-faint">
          Open positions: <span className="text-paper">none — flat</span> · Pending orders: <span className="text-paper">none</span> · In this paper session both are empty because the run ends flat by design.
        </div>
      </section>
    </div>
  );
}
