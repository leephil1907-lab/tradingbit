import type { Metadata } from "next";
import { loadTrackRecord, loadDecisionSample } from "@/lib/record";

export const metadata: Metadata = { title: "Risk center · Control room" };

const LIMIT_USD = 15.0; // 3.0% of the $500 virtual book

function Rule({ label, detail }: { label: string; detail: string }) {
  return (
    <li className="flex items-start justify-between gap-3 border-b hairline-soft py-2.5 last:border-b-0">
      <div><div className="text-[12px] text-paper">{label}</div><div className="num mt-0.5 text-[9px] text-faint">{detail}</div></div>
      <span className="pill pill-running shrink-0 !text-[8px]"><span className="pill-dot" />Armed</span>
    </li>
  );
}

export default function RiskPage() {
  const record = loadTrackRecord();
  const sample = loadDecisionSample();
  const realized = record?.summary.realized_pnl ?? 0;
  const lossUsed = Math.max(0, -realized);
  const usedPct = Math.min(100, (lossUsed / LIMIT_USD) * 100);
  const stopLossEvents = (sample?.entries ?? []).filter((e) => /stop loss/i.test(e.reasons));

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-paper">Risk center</h1>
          <p className="mt-1 text-sm text-muted">Limits, usage, triggered rules and the kill switch — in one place.</p>
        </div>
        <span className="badge badge-warn">Paper · $500 book</span>
      </div>

      {/* Distance to daily loss limit */}
      <section aria-label="Daily loss allowance" className="panel-flat mt-4 p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="section-label">Daily loss allowance · 3.0% of equity</div>
            <div className="kpi kpi-lg mt-1 text-up">${LIMIT_USD.toFixed(2)} <span className="text-base text-faint">remaining</span></div>
            <div className="mt-1 text-[10px] text-faint">used ${lossUsed.toFixed(2)} of ${LIMIT_USD.toFixed(2)} · resets 00:00 UTC</div>
          </div>
          <div className="num text-[10px] uppercase tracking-[0.16em] text-faint">80% = auto-pause entries · 100% = hard stop entries</div>
        </div>
        <div className="mt-4">
          <div className="meter" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={usedPct} aria-label="Daily loss used">
            <div style={{ width: `${Math.max(usedPct, 2)}%` }} />
          </div>
          <div className="relative mt-1 h-3">
            <span className="absolute left-[80%] top-0 h-2.5 w-px bg-warn/70" aria-hidden="true" />
            <span className="absolute left-[80%] top-2.5 -translate-x-1/2 font-mono text-[7px] text-warn">WARN</span>
          </div>
        </div>
        <p className="mt-3 text-[10px] leading-4 text-faint">At breach the bot pauses <em>new entries</em> automatically and posts a CRITICAL alert. Open positions remain under Exit management — risk reduction is never switched off.</p>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        {/* Usage tiles */}
        <section aria-label="Current usage" className="grid grid-cols-2 gap-3 lg:col-span-5">
          {[
            ["Exposure", "0.0%", "of equity · flat"],
            ["Open positions", "0 / 10", "shield cap"],
            ["Risk used today", `$${lossUsed.toFixed(2)}`, `${usedPct.toFixed(0)}% of 3.0% limit`],
            ["Max position size", "$50.00", "= 10% of equity"],
            ["Margin / leverage", "none", "spot · no borrowed funds"],
            ["Fees burned today", `$${record?.summary.fees_paid.toFixed(2) ?? "0.00"}`, "0.3% per side"],
          ].map(([label, v, sub]) => (
            <div key={label as string} className="panel-flat !rounded-lg p-4">
              <div className="section-label">{label}</div>
              <div className="kpi mt-1.5 text-lg text-paper">{v}</div>
              <div className="mt-1 text-[9px] text-faint">{sub}</div>
            </div>
          ))}
        </section>

        {/* Active rules */}
        <section aria-label="Active risk rules" className="panel-flat p-5 lg:col-span-7">
          <div className="section-label">Active risk rules · all armed</div>
          <ul className="mt-2">
            <Rule label="Hard stop-loss −6.0% from entry" detail="exit 100% of remaining qty at mark · unconditional" />
            <Rule label="Scaled take-profit · 40% at 2.0×, 30% at 3.0×" detail="banks gains into cost-basis reduction before the runner can round-trip" />
            <Rule label="Trailing stop · 8.0% off running peak" detail="armed after 1.5× entry or first partial · exits remainder" />
            <Rule label="Shield veto · max 10 open positions / $10 cash buffer" detail="blocks new buys even with full agent consensus · never blocks exits" />
            <Rule label="Daily loss limit · 3.0% of equity" detail="auto-pause new entries at breach · CRITICAL alert · desk notified" />
            <Rule label="Position sizing · $50 or 10% of cash, whichever less" detail="prevents martingale creep after wins" />
          </ul>
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        {/* Triggered rules */}
        <section aria-label="Triggered rules" className="panel-flat overflow-hidden lg:col-span-7">
          <div className="border-b hairline px-5 py-4 flex items-center justify-between"><span className="section-label">Triggered rules · seeded paper session</span><span className="num text-[9px] text-faint">{stopLossEvents.length} events</span></div>
          {stopLossEvents.length ? (
            <table className="dtable">
              <thead><tr><th>Time</th><th>Rule</th><th>Detail</th><th className="text-right">Result</th></tr></thead>
              <tbody className="num">
                {stopLossEvents.map((e, i) => (
                  <tr key={i}><td className="text-faint">{e.ts.slice(11, 19)}</td><td className="text-down">HARD_SL</td><td className="max-w-[280px] truncate font-sans text-[10px] text-muted">{e.reasons}</td><td className="text-right text-down">{e.pnl ? `${e.pnl.toFixed(2)}` : "—"}</td></tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="px-5 py-6 text-sm text-faint">No stop-loss rules fired in this session.</p>
          )}
          <p className="border-t hairline px-5 py-3 text-[9px] leading-4 text-faint">Sample from the seeded record — your live session log appears here once Phase 2 activation exists.</p>
        </section>

        {/* Kill switch history */}
        <section aria-label="Kill switch" className="rounded-xl border border-down/35 bg-down/5 p-5 lg:col-span-5">
          <span className="section-label !text-down">Kill switch</span>
          <div className="num mt-3 text-lg text-paper">0 activations</div>
          <p className="mt-1 text-[10px] leading-4 text-faint">Pinned in the sidebar at all times · typed confirmation (KILL SWITCH) · blocks new entries · never unwinds exits · logged with ref.</p>
          <pre className="num mt-3 overflow-auto rounded-lg border hairline-soft bg-obsidian-900 p-3 text-[9px] leading-5 text-faint" aria-label="Example audit record">{`{"ref":"PB-9F3A21C0","ts":"2026-11-09T…","actor":"operator","action":"KILL_SWITCH","detail":"Emergency stop — entries blocked"}`}</pre>
        </section>
      </div>
    </div>
  );
}
