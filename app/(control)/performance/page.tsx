import type { Metadata } from "next";
import Link from "next/link";
import EquityCurve from "@/components/EquityCurve";
import StatTile from "@/components/StatTile";
import { loadTrackRecord } from "@/lib/record";
import { fmtPct, fmtSignedUsd, fmtUsd, shortToken } from "@/lib/format";

export const metadata: Metadata = { title: "Performance · Control room" };

export default function PerformancePage() {
  const record = loadTrackRecord();
  const s = record?.summary;
  const trades = record?.closed_trades ?? [];
  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl <= 0);
  const grossWin = wins.reduce((a, t) => a + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((a, t) => a + t.pnl, 0));
  const profitFactor = grossLoss > 0 ? grossWin / grossLoss : wins.length ? Infinity : 0;
  const expectancy = trades.length ? s!.realized_pnl / trades.length : 0;
  const avgWin = wins.length ? grossWin / wins.length : 0;
  const avgLoss = losses.length ? grossLoss / losses.length : 0;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3"><h1 className="font-display text-3xl font-semibold text-paper">Performance</h1><span className="badge badge-warn">Paper</span></div>
          <p className="mt-1 text-sm text-muted">Closed-trade statistics from the seeded accelerated run — fees and partials included.</p>
        </div>
        <a href="/api/performance.csv" className="ctl-btn !text-[10px]" download>Export CSV</a>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Final equity" value={s ? fmtUsd(s.final_equity) : "—"} tone="gold" sub="$500.00 start" />
        <StatTile label="Win rate" value={s ? `${s.win_rate_pct.toFixed(1)}%` : "—"} sub={`${wins.length}W / ${losses.length}L`} tone={(s?.win_rate_pct ?? 0) >= 50 ? "up" : "down"} />
        <StatTile label="Profit factor" value={profitFactor === Infinity ? "∞" : profitFactor.toFixed(2)} sub="gross wins ÷ gross losses" tone="gold" />
        <StatTile label="Expectancy / trade" value={fmtSignedUsd(expectancy)} sub="net of fees" tone={expectancy >= 0 ? "up" : "down"} />
        <StatTile label="Avg win" value={fmtSignedUsd(avgWin)} tone="up" />
        <StatTile label="Avg loss" value={fmtSignedUsd(-avgLoss)} tone="down" />
        <StatTile label="Fees paid" value={s ? fmtUsd(s.fees_paid) : "—"} sub="0.3% per side" />
        <StatTile label="Max drawdown" value={s ? `${s.max_drawdown_pct.toFixed(2)}%` : "—"} sub="peak-to-trough, simulated" />
      </div>

      <section aria-label="Equity curve" className="panel-flat mt-4 p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="section-label">Equity curve · {record?.meta.simulated_hours ?? 24}h</span>
          <span className="num text-[9px] text-faint">total {s ? fmtPct(s.total_pnl_pct) : "—"}</span>
        </div>
        <div className="mt-3"><EquityCurve points={record?.equity_curve ?? []} height={220} /></div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <section aria-label="Trade history" className="panel-flat overflow-hidden lg:col-span-8">
          <div className="border-b hairline px-5 py-4 flex items-center justify-between"><span className="section-label">Trade history</span><span className="num text-[9px] text-faint">{trades.length} rows</span></div>
          <div className="overflow-x-auto">
            <table className="dtable min-w-[560px]">
              <thead><tr><th>Token</th><th className="text-right">Entry</th><th className="text-right">Exit</th><th className="text-right">PnL</th><th>Exit</th></tr></thead>
              <tbody className="num">
                {trades.map((t, i) => (
                  <tr key={i} className="row-hover">
                    <td className="text-paper">{shortToken(t.token, 8)} <span className="ml-1 text-[9px] uppercase text-faint">{t.chain}</span></td>
                    <td className="text-right">{t.entry_price.toExponential(2)}</td>
                    <td className="text-right">{t.exit_price.toExponential(2)}</td>
                    <td className={`text-right ${t.pnl >= 0 ? "text-up" : "text-down"}`}>{fmtSignedUsd(t.pnl)}</td>
                    <td className="max-w-[210px] truncate font-sans text-[10px] text-muted" title={t.reason}>{t.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-label="Strategy comparison" className="panel-flat p-5 lg:col-span-4">
          <span className="section-label">Strategy comparison</span>
          <div className="mt-3 rounded-lg border border-gold-700/60 bg-gold-800/20 p-4">
            <div className="flex items-center justify-between"><span className="num text-[11px] text-paper">Launch-Momentum Consensus</span><span className="num text-[8px] uppercase text-gold-400">v0.1 · paper</span></div>
            <dl className="num mt-3 space-y-1.5 text-[10px] text-muted">
              <div className="flex justify-between"><dt>Capital</dt><dd>$500.00</dd></div>
              <div className="flex justify-between"><dt>Return</dt><dd className="text-up">{s ? fmtPct(s.total_pnl_pct) : "—"}</dd></div>
              <div className="flex justify-between"><dt>Trades</dt><dd>{trades.length}</dd></div>
              <div className="flex justify-between"><dt>Profit factor</dt><dd>{profitFactor === Infinity ? "∞" : profitFactor.toFixed(2)}</dd></div>
            </dl>
          </div>
          <div className="mt-3 rounded-lg border border-dashed hairline p-4 text-center">
            <p className="text-[11px] text-muted">Mean reversion &amp; breakout are not configured for this workspace.</p>
            <Link href="/strategies" className="num mt-2 inline-block text-[9px] uppercase tracking-[0.2em] text-gold-500 hover:text-gold-400">Configure in Strategies →</Link>
          </div>
          <p className="mt-3 text-[9px] leading-4 text-faint">Comparison ships with Phase 2 (per-strategy ledger tags). One honestly-measured strategy beats five vibes.</p>
        </section>
      </div>
    </div>
  );
}
