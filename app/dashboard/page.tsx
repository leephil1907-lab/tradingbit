import type { Metadata } from "next";
import Link from "next/link";
import ActivationForm from "@/components/ActivationForm";
import AgentGlyph from "@/components/AgentGlyph";
import StatTile from "@/components/StatTile";
import { loadDecisionSample, loadTrackRecord } from "@/lib/record";
import { fmtSignedUsd, pnlClass, shortToken } from "@/lib/format";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your PRIMEVEST Trading Bot paper desk — virtual $500 book, live agent decisions, audit-logged fills.",
};

const AGENT_ORDER = ["scout", "whale", "sniper", "shield", "exit"] as const;

export default function DashboardPage() {
  const record = loadTrackRecord();
  const sample = loadDecisionSample();
  const s = record?.summary;

  return (
    <section className="mx-auto max-w-container px-4 py-12 sm:px-6">
      {/* Head */}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="badge badge-warn">Paper&nbsp;·&nbsp;Virtual $500</span>
            <span className="num text-[10px] uppercase tracking-[0.18em] text-faint">mode: simulation</span>
          </div>
          <h1 className="mt-4 font-display text-4xl font-semibold text-paper sm:text-5xl">Your virtual desk.</h1>
          <p className="mt-2 max-w-xl text-muted">Same engine the PRIMEVEST desk runs for evaluation. No real orders, no real funds — every number below is simulated and labeled as such.</p>
        </div>
        <Link href="/track-record" className="btn btn-ghost">Recap vs. ledger<span aria-hidden="true">→</span></Link>
      </div>

      {/* Activation */}
      <div className="panel mt-8 p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-md">
            <div className="num text-[10px] uppercase tracking-[0.22em] text-gold-400">Activate the paper bot</div>
            <p className="mt-2 text-sm leading-6 text-muted">Drop your email; the desk provisions a virtual $500 book on the live feed and mails it to you. Real-money activation is a separate manual review via the PRIMEVEST terminal — it never happens here.</p>
          </div>
          <div className="lg:min-w-[380px]"><ActivationForm /></div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Virtual balance" value="$500.00" sub="uncommitted book" tone="gold" />
        <StatTile label="Open positions" value="0" sub="bot is flat between consensus windows" />
        <StatTile label="Realized PnL" value={s ? fmtSignedUsd(s.realized_pnl) : "—"} sub="across the seeded paper run" tone={s && s.realized_pnl >= 0 ? "up" : "neutral"} />
        <StatTile label="Win rate" value={s ? `${s.win_rate_pct.toFixed(0)}%` : "—"} sub={s ? `${s.closed_trades} closed trades` : undefined} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        {/* Decision feed */}
        <div className="lg:col-span-8">
          <div className="panel-flat overflow-hidden">
            <div className="flex items-center justify-between border-b hairline px-5 py-4">
              <span className="num text-[10px] uppercase tracking-[0.2em] text-faint">Recent decisions · audit trail</span>
              <span className="num text-[9px] text-faint">sample from seeded run</span>
            </div>
            <div className="overflow-x-auto">
              <table className="dtable min-w-[680px]">
                <thead><tr><th>Time (UTC)</th><th>Event</th><th>Token</th><th>Why</th><th className="text-right">PnL</th></tr></thead>
                <tbody>
                  {(sample?.entries ?? []).map((d, i) => (
                    <tr key={i}>
                      <td className="num text-[10px] text-faint">{d.ts.slice(11, 19)}</td>
                      <td>
                        <span className={`num text-[9px] uppercase tracking-[0.14em] ${
                          d.event === "BUY" ? "text-up" : d.event === "SELL" ? "text-down" : d.event === "PARTIAL_SELL" ? "text-warn" : "text-muted"
                        }`}>{d.event.replace("_", " ")}</span>
                      </td>
                      <td className="num text-[11px]">{shortToken(d.token, 8)}</td>
                      <td className="max-w-[280px] truncate text-[11px] text-muted" title={d.reasons}>{d.reasons}</td>
                      <td className={`num text-right text-[11px] ${d.pnl ? pnlClass(d.pnl) : "text-faint"}`}>{d.pnl ? fmtSignedUsd(d.pnl) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="mt-3 px-1 text-[10px] leading-4 text-faint">{sample?.note}</p>
        </div>

        {/* Agents + open positions */}
        <div className="flex flex-col gap-6 lg:col-span-4">
          <div className="panel-flat p-5">
            <div className="num text-[10px] uppercase tracking-[0.2em] text-faint">Agent mesh · all five standing by</div>
            <ul className="mt-4 space-y-3">
              {AGENT_ORDER.map((g) => (
                <li key={g} className="flex items-center gap-3">
                  <AgentGlyph agent={g} size={20} className="text-gold-400" />
                  <span className="num w-14 text-[11px] uppercase tracking-[0.12em] text-paper">{g}</span>
                  <span className="ml-auto flex items-center gap-1.5 text-[10px] text-faint">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-up" />watching
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="panel-flat p-5">
            <div className="num text-[10px] uppercase tracking-[0.2em] text-faint">Open positions</div>
            <div className="mt-4 rounded-lg border border-dashed hairline px-4 py-6 text-center">
              <p className="text-sm text-muted">Flat.</p>
              <p className="mx-auto mt-2 max-w-[240px] text-[10px] leading-4 text-faint">When ≥ 2 agents agree on a mint, the position appears here with entry, invalidation and the agents behind it.</p>
            </div>
          </div>
          <div className="panel-flat border-warn/20 bg-warn/5 p-4 text-[10px] leading-4 text-muted">
            <span className="num text-[9px] uppercase tracking-[0.2em] text-warn">Honest by construction</span>
            <p className="mt-1.5">Every line in this feed is written by the engine, not by marketing. If the bot loses money, the ledger will show it here first.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
