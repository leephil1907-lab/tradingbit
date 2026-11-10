"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useBot } from "@/components/shell/bot-context";
import ConfirmDialog from "@/components/control/ConfirmDialog";
import EquityCurve from "@/components/EquityCurve";
import type { TrackRecord } from "@/lib/record";
import { fmtPct, fmtSignedUsd, fmtUsd, shortToken } from "@/lib/format";

type Decision = { ts: string; event: string; token: string; reasons: string; pnl: number };

function DailyLossMeter({ usedPct }: { usedPct: number }) {
  const tone = usedPct >= 80 ? "meter-danger" : usedPct >= 50 ? "meter-warn" : "";
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="section-label">Daily loss limit · 3.0% ($15.00)</span>
        <span className="num text-[10px] text-up">$15.00 left</span>
      </div>
      <div className={`meter mt-1.5 ${tone}`} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={usedPct} aria-label="Daily loss used">
        <div style={{ width: `${Math.min(usedPct, 100)}%` }} />
      </div>
    </div>
  );
}

export default function DashboardClient({ record, sampleEntries }: {
  record: TrackRecord | null;
  sampleEntries: Decision[];
}) {
  const { status, statusLabel, pause, resume, notify, audit, feedOk, heartbeatSeconds } = useBot();
  const [closeAllOpen, setCloseAllOpen] = useState(false);
  const [closeAllBusy, setCloseAllBusy] = useState(false);
  const [closeAllProgress, setCloseAllProgress] = useState(0);

  const s = record?.summary;
  const equity = s?.final_equity ?? null;
  const sessionPnl = s?.realized_pnl ?? null;
  const halted = status === "halted";
  const paused = status === "paused";

  const runCloseAll = () => {
    setCloseAllBusy(true); setCloseAllProgress(0);
    const id = window.setInterval(() => setCloseAllProgress((p) => Math.min(100, p + 16)), 80);
    window.setTimeout(async () => {
      window.clearInterval(id);
      setCloseAllOpen(false); setCloseAllBusy(false); setCloseAllProgress(0);
      const ref = await audit("CLOSE_ALL_REQUESTED", "Operator requested close-all — book was flat (0 open paper positions)");
      notify(ref ? `Close-all recorded · ${ref} · 0 positions affected` : "Close-all recorded · 0 positions affected");
    }, 750);
  };

  const pillCls =
    status === "running" ? "pill-running" : status === "paused" ? "pill-paused" : status === "halted" ? "pill-halted" : "pill-paper";

  return (
    <div className="mx-auto max-w-6xl">
      {/* ═══════════ ZONE 1 — STATUS CARD (answers Q1–Q3 in seconds) ═══════════ */}
      <section aria-label="Bot status" className="panel p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:justify-between">
          {/* status + metrics */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="section-label">Bot status</span>
              <span className={`pill ${pillCls} !text-[11px] !py-1.5`} role="status"><span className="pill-dot" />{statusLabel}</span>
              <span className="num text-[10px] uppercase tracking-[0.22em] text-faint">Mode · Paper trading</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              <div>
                <div className="section-label">Equity</div>
                <div className="kpi kpi-lg mt-1 text-paper">{equity === null ? "—" : fmtUsd(equity)}</div>
                <div className="mt-1 text-[9px] text-faint">incl. open marks · paper</div>
              </div>
              <div>
                <div className="section-label">Session P&amp;L</div>
                <div className={`kpi kpi-lg mt-1 ${sessionPnl === null ? "text-paper" : sessionPnl >= 0 ? "text-up" : "text-down"}`}>{sessionPnl === null ? "—" : fmtSignedUsd(sessionPnl)}</div>
                <div className="mt-1 text-[9px] text-faint">{s ? `${s.closed_trades} closed · ${s.sell_fills} fills` : "no fills yet"}</div>
              </div>
              <div>
                <div className="section-label">Open risk</div>
                <div className="kpi kpi-lg mt-1 text-paper">—</div>
                <div className="mt-1 text-[9px] text-faint">No persisted risk state</div>
              </div>
            </div>
            <div className="mt-4 max-w-md rounded-lg border hairline-soft px-3 py-2 text-[10px] text-faint">Risk limits unavailable until account persistence and worker controls are connected.</div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
              <span className="flex items-center gap-1.5"><span className={`inline-block h-1.5 w-1.5 rounded-full ${feedOk === null ? "bg-faint" : feedOk ? "bg-up" : "bg-down"}`} />Feed · {feedOk === null ? "probing" : feedOk ? "live" : "degraded"}</span>
              <span>Last heartbeat · {heartbeatSeconds}s ago</span>
              <span>Fees paid · {s ? fmtUsd(s.fees_paid) : "—"}</span>
            </div>
          </div>
          {/* controls — friction scales with consequence */}
          <div className="flex shrink-0 flex-col justify-center gap-2 border-t hairline-soft pt-4 lg:w-52 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
            <button type="button" onClick={paused ? resume : pause} disabled={halted}
              className={`ctl-btn ${paused ? "" : "ctl-btn-amber"} w-full !py-3 opacity-50`}
              disabled title="Unavailable until the server-side control plane is connected"
              aria-label="Bot controls unavailable — server control plane not connected">
              {paused ? "Resume bot" : "Pause bot"}
            </button>
            <button type="button" onClick={() => setCloseAllOpen(true)} disabled={halted} className="ctl-btn ctl-btn-danger-outline w-full !py-3 opacity-50" disabled title="Unavailable until persisted positions and server execution controls are connected" aria-label="Close all unavailable — trading state is not connected">
              Close all positions
            </button>
            <p className="text-center font-mono text-[7px] uppercase leading-3 tracking-[0.18em] text-faint">Execution controls disabled until the server control plane is connected</p>
          </div>
        </div>
      </section>

      {/* ═══════════ ZONE 2 — What it's doing · Equity ═══════════ */}
      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <section aria-label="Equity curve" className="panel-flat p-4 lg:col-span-7">
          <div className="flex items-center justify-between">
            <span className="section-label">Equity · 24h accelerated paper session</span>
            <span className="num text-[9px] text-faint">seed 42 · fees 0.3%/side · mark-to-market</span>
          </div>
          <div className="mt-3"><EquityCurve points={record?.equity_curve ?? []} height={168} /></div>
          <div className="mt-3 grid grid-cols-3 gap-3 border-t hairline-soft pt-3 text-center sm:text-left">
            <div><div className="section-label">Win rate</div><div className="num mt-0.5 text-sm text-paper">{s ? `${s.win_rate_pct.toFixed(1)}%` : "—"}</div></div>
            <div><div className="section-label">Max drawdown</div><div className="num mt-0.5 text-sm text-paper">{s ? `${s.max_drawdown_pct.toFixed(2)}%` : "—"}</div></div>
            <div><div className="section-label">Best / worst</div><div className="num mt-0.5 text-sm text-paper">{s ? `${fmtSignedUsd(s.best_trade_pnl ?? 0)} / ${fmtSignedUsd(s.worst_trade_pnl ?? 0)}` : "—"}</div></div>
          </div>
        </section>

        {/* What it's doing now */}
        <section aria-label="Current activity" className="panel-flat flex flex-col p-4 lg:col-span-5">
          <div className="flex items-center justify-between">
            <span className="section-label">What it&apos;s doing now</span>
            <Link href="/audit-log" className="num text-[9px] uppercase tracking-[0.18em] text-gold-500 hover:text-gold-400">Audit log →</Link>
          </div>
          <div className="mt-3 rounded-lg border hairline-soft bg-obsidian-900 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="num text-[9px] uppercase tracking-[0.2em] text-faint">Latest signal</span>
              <span className="num text-[8px] text-faint">{sampleEntries[0]?.ts?.slice(11, 19) ?? "--:--:--"} UTC</span>
            </div>
            {sampleEntries[0] ? (
              <>
                <div className="num mt-1.5 text-[11px] text-paper"><span className="text-up">{sampleEntries[0].event.replace("_", " ")}</span> · {shortToken(sampleEntries[0].token, 10)}</div>
                <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-muted" title={sampleEntries[0].reasons}>{sampleEntries[0].reasons}</p>
              </>
            ) : <p className="mt-1.5 text-[11px] text-faint">Awaiting first consensus window.</p>}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-lg border hairline-soft p-3 text-center">
              <div className="kpi text-xl text-paper">—</div>
              <div className="section-label mt-1">Persisted orders</div>
            </div>
            <div className="rounded-lg border hairline-soft p-3 text-center">
              <div className="kpi text-xl text-paper">—</div>
              <div className="section-label mt-1">Persisted positions</div>
            </div>
          </div>
          <div className="mt-3 min-h-0 flex-1">
            <div className="section-label">Recent fills</div>
            <ul className="mt-1.5 divide-y divide-[var(--gold-hairline-soft)]">
              {sampleEntries.slice(0, 3).map((d, i) => (
                <li key={i} className="flex items-center gap-2 py-1.5 text-[10px]">
                  <span className={`num w-16 uppercase ${d.event === "BUY" ? "text-up" : d.event === "PARTIAL_SELL" ? "text-warn" : "text-down"}`}>{d.event.replace("_", " ")}</span>
                  <span className="num text-muted">{shortToken(d.token, 8)}</span>
                  <span className="num ml-auto text-faint">{d.pnl ? fmtSignedUsd(d.pnl) : "—"}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      {/* ═══════════ ZONE 3 — Risk & health (Q4–Q5) ═══════════ */}
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <section aria-label="Active risk" className="panel-flat p-4">
          <div className="section-label">Active risk</div>
          <dl className="mt-2 space-y-2 text-[11px]">
            <div className="flex justify-between"><dt className="text-faint">Exposure</dt><dd className="num text-paper">Not available</dd></div>
            <div className="flex justify-between"><dt className="text-faint">Margin / leverage</dt><dd className="num text-paper">Not configured</dd></div>
            <div className="flex justify-between"><dt className="text-faint">Daily loss limit</dt><dd className="num text-paper">Not configured</dd></div>
            <div className="flex justify-between"><dt className="text-faint">Stop-loss exposure</dt><dd className="num text-paper">Not available</dd></div>
          </dl>
          <Link href="/risk" className="num mt-3 inline-block text-[9px] uppercase tracking-[0.2em] text-gold-500 hover:text-gold-400">Risk center →</Link>
        </section>
        <section aria-label="Feed and API health" className="panel-flat p-4">
          <div className="section-label">Feed &amp; API health</div>
          <ul className="mt-2 space-y-1.5 font-mono text-[10px]">
            <li className="flex items-center gap-2"><span className={`h-1.5 w-1.5 rounded-full ${feedOk ? "bg-up" : "bg-down"}`} /><span className="text-muted">Market overview API</span><span className="ml-auto text-faint">{feedOk ? "reachable" : "unavailable"}</span></li>
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-faint" /><span className="text-muted">GMGN</span><span className="ml-auto text-warn">not configured</span></li>
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-faint" /><span className="text-muted">Solana RPC</span><span className="ml-auto text-warn">not configured</span></li>
          </ul>
          <p className="mt-2 text-[9px] leading-4 text-faint">This checks API reachability only. Provider-level freshness and worker health are not yet connected.</p>
        </section>
        <section aria-label="Alerts preview" className="panel-flat border-warn/25 p-4">
          <div className="flex items-center justify-between">
            <span className="section-label !text-warn">Operational status</span>
            <Link href="/alerts" className="num text-[9px] uppercase tracking-[0.2em] text-warn hover:opacity-80">Status details →</Link>
          </div>
          <p className="mt-2 rounded border hairline-soft px-2.5 py-3 text-[10px] leading-5 text-muted">Live account state, durable alerts and worker execution status are not connected yet. This panel will populate from persisted operational events.</p>
        </section>
      </div>

      <ConfirmDialog
        open={closeAllOpen} busy={closeAllBusy} busyProgress={closeAllProgress}
        onClose={() => setCloseAllOpen(false)}
        title="Close all positions?"
        tone="danger"
        confirmLabel="Close all"
        confirmKeyword="CLOSE ALL"
        onConfirm={runCloseAll}
        body={<>You are about to close <strong>every open position at market</strong>. In this paper session the book is flat, so nothing moves — the instruction is still logged with your reference for the audit trail. This action cannot be undone once fills occur.</>}
      >
        <div className="mt-4 rounded-lg border hairline-soft bg-obsidian-900 p-3 font-mono text-[10px] leading-5 text-faint">
          open positions: <span className="text-paper">0</span> · est. result: <span className="text-paper">$0.00</span> · slippage model: <span className="text-paper">mark ± 0.05%</span>
        </div>
      </ConfirmDialog>
    </div>
  );
}
