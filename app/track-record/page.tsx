import type { Metadata } from "next";
import Link from "next/link";
import EquityCurve from "@/components/EquityCurve";
import StatTile from "@/components/StatTile";
import { loadTrackRecord } from "@/lib/record";
import { fmtPct, fmtSignedUsd, fmtUsd, shortToken } from "@/lib/format";

export const metadata: Metadata = {
  title: "Track record",
  description: "The real paper output of PRIMEVEST Trading Bot — every fill, fee and loss, published with methodology. Not a forecast of live results.",
};

export default function TrackRecordPage() {
  const r = loadTrackRecord();

  if (!r) {
    return (
      <section className="mx-auto max-w-container px-4 py-24 text-center">
        <h1 className="font-display text-4xl text-paper">Record not generated yet.</h1>
        <p className="mt-4 text-muted">Run <code className="num text-gold-400">python worker/export_track_record.py</code> to produce the paper track record, then rebuild.</p>
      </section>
    );
  }

  const { meta, summary, equity_curve, closed_trades, seed_sweep } = r;
  const genDate = new Date(meta.generated_at).toUTCString();

  return (
    <section className="mx-auto max-w-container px-4 py-12 sm:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-3">
            <span className="badge badge-warn">Paper&nbsp;·&nbsp;Simulated</span>
            <span className="num text-[10px] uppercase tracking-[0.18em] text-faint">seed {meta.seed} · generated {genDate}</span>
          </div>
          <h1 className="mt-4 font-display text-4xl font-semibold text-paper sm:text-5xl">The record,<br /><span className="gold">unedited.</span></h1>
          <p className="mt-4 leading-7 text-muted">{meta.disclaimer}</p>
        </div>
        <Link href="/dashboard" className="btn btn-gold">Activate paper bot</Link>
      </div>

      {/* Assumptions strip */}
      <div className="mt-8 rounded-xl border hairline-soft bg-obsidian-900 px-5 py-4">
        <div className="num text-[9px] uppercase tracking-[0.22em] text-faint">Methodology</div>
        <ul className="mt-2 grid gap-x-8 gap-y-1.5 text-[11px] leading-5 text-muted sm:grid-cols-2">
          <li>· Mark-to-market fills, fee {meta.fee_pct_per_side}% per side (both legs)</li>
          <li>· Initial balance ${meta.initial_balance.toFixed(0)} · max $50 or 10% per position</li>
          <li>· Consensus ≥ {meta.min_agreeing_agents} agents · shield veto honored</li>
          <li>· Market data: {meta.market_data}</li>
        </ul>
      </div>

      {/* Summary stat tiles */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Final equity" value={fmtUsd(summary.final_equity)} tone="gold" />
        <StatTile label="Total PnL" value={fmtSignedUsd(summary.total_pnl)} sub={fmtPct(summary.total_pnl_pct)} tone={summary.total_pnl >= 0 ? "up" : "down"} />
        <StatTile label="Realized PnL" value={fmtSignedUsd(summary.realized_pnl)} tone={summary.realized_pnl >= 0 ? "up" : "down"} />
        <StatTile label="Fees paid" value={fmtUsd(summary.fees_paid)} />
        <StatTile label="Win rate" value={`${summary.win_rate_pct.toFixed(1)}%`} sub={`${summary.closed_trades} closed · ${summary.sell_fills} fills`} />
        <StatTile label="Max drawdown" value={`${summary.max_drawdown_pct.toFixed(2)}%`} tone="neutral" />
      </div>

      {/* Equity curve */}
      <div className="panel mt-6 p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <span className="num text-[10px] uppercase tracking-[0.2em] text-faint">Equity · {meta.simulated_hours}h accelerated</span>
          {summary.best_trade_pnl !== null && summary.worst_trade_pnl !== null ? (
            <span className="num text-[10px] text-faint">best {fmtSignedUsd(summary.best_trade_pnl)} · worst {fmtSignedUsd(summary.worst_trade_pnl)}</span>
          ) : null}
        </div>
        <div className="mt-3"><EquityCurve points={equity_curve} height={190} /></div>
      </div>

      {/* Closed trades ledger */}
      <div className="panel-flat mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b hairline px-5 py-4">
          <span className="num text-[10px] uppercase tracking-[0.2em] text-faint">Closed trades · full ledger</span>
          <span className="num text-[9px] text-faint">{closed_trades.length} rows</span>
        </div>
        <div className="overflow-x-auto">
          <table className="dtable min-w-[760px]">
            <thead>
              <tr><th>Token</th><th>Chain</th><th className="text-right">Entry</th><th className="text-right">Exit</th><th className="text-right">Size</th><th className="text-right">PnL</th><th>Exit reason</th><th className="text-center">Partials</th></tr>
            </thead>
            <tbody className="num">
              {closed_trades.map((t, i) => (
                <tr key={i}>
                  <td className="text-paper">{shortToken(t.token, 10)}</td>
                  <td className="uppercase text-muted">{t.chain}</td>
                  <td className="text-right">{t.entry_price.toExponential(2)}</td>
                  <td className="text-right">{t.exit_price.toExponential(2)}</td>
                  <td className="text-right">${t.size_usd.toFixed(2)}</td>
                  <td className={`text-right ${t.pnl >= 0 ? "text-up" : "text-down"}`}>{fmtSignedUsd(t.pnl)}</td>
                  <td className="max-w-[260px] truncate font-sans text-[11px] text-muted" title={t.reason}>{t.reason}</td>
                  <td className="text-center">{t.partials_taken}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Seed sweep — losing runs visible, on purpose */}
      {seed_sweep ? (
        <div className="panel-flat mt-6 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <span className="num text-[10px] uppercase tracking-[0.2em] text-faint">20-run seed sweep · all runs shown</span>
            <span className="num text-[9px] text-faint">mock-feed only · deterministic</span>
          </div>
          <p className="mt-3 text-xs leading-5 text-muted">{seed_sweep.note}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Median run" value={fmtPct(seed_sweep.aggregate.median_pnl_pct)} tone={seed_sweep.aggregate.median_pnl_pct >= 0 ? "up" : "down"} />
            <StatTile label="Mean run" value={fmtPct(seed_sweep.aggregate.mean_pnl_pct)} tone={seed_sweep.aggregate.mean_pnl_pct >= 0 ? "up" : "down"} />
            <StatTile label="Worst run" value={fmtPct(seed_sweep.aggregate.worst_pnl_pct)} tone={seed_sweep.aggregate.worst_pnl_pct >= 0 ? "up" : "down"} />
            <StatTile label="Profitable runs" value={`${seed_sweep.aggregate.profitable_runs}/${seed_sweep.aggregate.total_runs}`} tone="gold" />
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="dtable min-w-[640px]">
              <thead><tr><th>Seed</th><th className="text-right">PnL %</th><th className="text-right">Trades</th><th className="text-right">Win rate</th></tr></thead>
              <tbody className="num">
                {seed_sweep.runs.map((x) => (
                  <tr key={x.seed}>
                    <td>#{x.seed}</td>
                    <td className={`text-right ${x.pnl_pct >= 0 ? "text-up" : "text-down"}`}>{fmtPct(x.pnl_pct)}</td>
                    <td className="text-right">{x.closed_trades}</td>
                    <td className="text-right">{x.win_rate_pct.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-[10px] leading-4 text-faint">
            Even the worst synthetic run cleared costs on this feed — that is a property of a toy environment, not evidence about live markets.
            When a losing sweep exists, it will be published here with the winners.
          </p>
        </div>
      ) : null}

      {/* Honesty box */}
      <div className="mt-6 rounded-xl border border-warn/25 bg-warn/5 p-5 text-[12px] leading-6 text-muted">
        <span className="num text-[10px] uppercase tracking-[0.2em] text-warn">Before you act on this page</span>
        <p className="mt-2">
          This record was produced on a simulated feed with live DexScreener marks. It omits slippage, failed transactions,
          priority fees, MEV, chain congestion and the possibility that the strategy stops working entirely. It exists to
          demonstrate system discipline, not to predict your returns. Real-money activation is disabled in this product.
          Nothing here is investment advice.
        </p>
        <p className="mt-2">PRIMEVEST publishes fictional and real results alike — the ledger is the marketing.</p>
      </div>
    </section>
  );
}
