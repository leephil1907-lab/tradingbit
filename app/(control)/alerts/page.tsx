"use client";

import { useEffect, useState } from "react";

type Severity = "action" | "critical" | "warning" | "info";
interface AlertItem {
  id: string; severity: Severity; title: string;
  what: string; why: string; next: string; ts: string;
}

const SEED_ALERTS: AlertItem[] = [
  {
    id: "policy-live-disabled", severity: "action", ts: "2026-11-09T02:47:00Z",
    title: "Live trading is disabled by policy",
    what: "This release ships with no real-money execution path. The Activate button in Strategies is permanently locked in paper mode.",
    why: "Real-money trading from this desk requires completed Phase 2 gates: counsel sign-off on disclosures, desk SOP, tested kill switch and dual-control settlement.",
    next: "Nothing to buy, nothing to connect. Activate the paper desk (free, virtual $500) or contact the desk via the PRIMEVEST terminal if you believe this is in error.",
  },
  {
    id: "feed-synthetic-equity", severity: "warning", ts: "2026-11-09T02:47:00Z",
    title: "Equity figures reflect a synthetic run with live marks",
    what: "The Dashboard and Performance pages render data/track-record.json — a seeded simulation (seed 42) with DexScreener/CoinGecko marks captured at generation time.",
    why: "Synthetic regimes flatter selection logic. Numbers shown are mechanics demonstrations, not evidence of live edge, expectancy, or drawdown in real markets.",
    next: "Treat every figure as illustrative. Re-read the methodology strip on the Performance page before drawing any conclusion.",
  },
  {
    id: "feed-caching", severity: "info", ts: "2026-11-09T02:47:00Z",
    title: "Market context is cached, not streamed",
    what: "BTC/ETH/SOL context on this screen comes from CoinGecko and DexScreener public endpoints with a 45-second server cache.",
    why: "Public endpoints rate-limit; a cache protects the app and the providers. If this panel shows Degraded, treat any visible price as stale — it is labeled as such.",
    next: "No action required. For execution-grade feeds, Phase 2 provisions private RPC and paid data.",
  },
  {
    id: "activation-pending", severity: "info", ts: "2026-11-09T02:47:00Z",
    title: "Paper desk activation is pending your email",
    what: "The activation form on the Dashboard writes to the desk queue (activations.jsonl on this instance during preview).",
    why: "Provisioning is manual so a human verifies intent before a virtual book is opened — the same habit that will gate real money later.",
    next: "Submit your email on the Dashboard; the desk provisions your virtual $500 book and confirms by email.",
  },
];

const SEVERITY_META: Record<Severity, { label: string; cls: string }> = {
  action: { label: "Action required", cls: "alert-action" },
  critical: { label: "Critical", cls: "alert-critical" },
  warning: { label: "Warning", cls: "alert-warning" },
  info: { label: "Info", cls: "alert-info" },
};

export default function AlertsPage() {
  const [dismissed, setDismissed] = useState<string[]>([]);
  useEffect(() => {
    try { setDismissed(JSON.parse(window.localStorage.getItem("pv-alerts-dismissed") ?? "[]") as string[]); } catch { /* noop */ }
  }, []);
  const persist = (ids: string[]) => {
    setDismissed(ids);
    try { window.localStorage.setItem("pv-alerts-dismissed", JSON.stringify(ids)); } catch { /* noop */ }
  };
  const open = SEED_ALERTS.filter((a) => !dismissed.includes(a.id));
  const bySeverity = (s: Severity) => open.filter((a) => a.severity === s);
  const order: Severity[] = ["action", "critical", "warning", "info"];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-paper">Alerts</h1>
          <p className="mt-1 text-sm text-muted">What happened, why it matters, and what to do — nothing else.</p>
        </div>
        <button type="button" className="ctl-btn !text-[10px]" onClick={() => persist(SEED_ALERTS.map((a) => a.id))}>Mark all read</button>
      </div>

      <div className="num mt-4 flex flex-wrap gap-3 text-[9px] uppercase tracking-[0.18em] text-faint">
        {order.map((s) => <span key={s}>{SEVERITY_META[s].label}: <span className="text-paper">{bySeverity(s).length}</span></span>)}
      </div>

      {order.map((sev) => {
        const list = bySeverity(sev);
        if (sev === "critical" && list.length === 0) {
          return (
            <div key={sev} className="mt-6 rounded-xl border border-up/25 bg-up/5 px-4 py-3 flex items-center gap-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--up)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5 5L20 6.5"/></svg>
              <p className="text-[12px] text-muted"><span className="num text-up">Critical · none.</span> Feeds reachable, no rejections, no limit events. This is the state the bot is designed to hold.</p>
            </div>
          );
        }
        if (!list.length) return null;
        return (
          <section key={sev} aria-label={SEVERITY_META[sev].label} className="mt-6">
            <h2 className="section-label">{SEVERITY_META[sev].label}</h2>
            <div className="mt-2 flex flex-col gap-3">
              {list.map((a) => (
                <article key={a.id} className={`alert-card ${SEVERITY_META[a.severity].cls}`}>
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-[13px] font-semibold text-paper">{a.title}</h3>
                    <button type="button" className="num shrink-0 text-[9px] uppercase tracking-[0.18em] text-faint hover:text-paper" onClick={() => persist([...dismissed, a.id])} aria-label={`Dismiss: ${a.title}`}>Dismiss</button>
                  </div>
                  <dl className="mt-2 grid gap-x-6 gap-y-1.5 text-[11px] leading-5 sm:grid-cols-3">
                    <div><dt className="num text-[8px] uppercase tracking-[0.2em] text-faint">What happened</dt><dd className="text-muted">{a.what}</dd></div>
                    <div><dt className="num text-[8px] uppercase tracking-[0.2em] text-faint">Why it matters</dt><dd className="text-muted">{a.why}</dd></div>
                    <div><dt className="num text-[8px] uppercase tracking-[0.2em] text-faint">What to do</dt><dd className="text-muted">{a.next}</dd></div>
                  </dl>
                  <div className="num mt-2 text-[8px] uppercase tracking-[0.2em] text-faint">{a.ts.replace("T", " · ").replace("Z", " UTC")}</div>
                </article>
              ))}
            </div>
          </section>
        );
      })}

      {dismissed.length > 0 && (
        <button type="button" className="num mt-6 text-[9px] uppercase tracking-[0.2em] text-faint hover:text-paper" onClick={() => persist([])}>Restore dismissed ({dismissed.length})</button>
      )}
    </div>
  );
}
