"use client";

import { useEffect, useState } from "react";
import { useBot } from "@/components/shell/bot-context";
import ConfirmDialog from "@/components/control/ConfirmDialog";

type Probe = { state: "untested" | "ok" | "fail"; ms?: number };
const NOTIFY_KEY = "pv-notify-prefs";

async function probe(url: string): Promise<Probe> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 6000);
  const started = performance.now();
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    return res.ok ? { state: "ok", ms: Math.round(performance.now() - started) } : { state: "fail" };
  } catch { return { state: "fail" }; } finally { clearTimeout(t); }
}

const CONNECTIONS = [
  { id: "dexscreener", name: "DexScreener", detail: "Solana launch discovery · public API · no key required", probeUrl: "https://api.dexscreener.com/latest/dex/search?q=solana" },
  { id: "coingecko", name: "CoinGecko", detail: "BTC/ETH/SOL context + OHLC · public API · 45s server cache", probeUrl: "https://api.coingecko.com/api/v3/ping" },
  { id: "binance", name: "Binance spot", detail: "Candle + volume data for charts · public klines", probeUrl: "https://api.binance.com/api/v3/ping" },
  { id: "gmgn", name: "GMGN.AI", detail: "Whale flow + rug intelligence · requires GMGN_API_KEY · Phase 2", probeUrl: null },
  { id: "solana-rpc", name: "Solana RPC", detail: "Execution-grade chain reads · private endpoint · Phase 2", probeUrl: null },
] as const;

export default function SettingsPage() {
  const { notify, audit, resetPaper } = useBot();
  const [probes, setProbes] = useState<Record<string, Probe>>({});
  const [prefs, setPrefs] = useState({ fills: true, rejections: true, disconnects: true, riskEvents: true });
  const [resetOpen, setResetOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try { const raw = window.localStorage.getItem(NOTIFY_KEY); if (raw) setPrefs(JSON.parse(raw)); } catch { /* noop */ }
  }, []);
  const flip = (k: keyof typeof prefs) => {
    const next = { ...prefs, [k]: !prefs[k] };
    setPrefs(next);
    try { window.localStorage.setItem(NOTIFY_KEY, JSON.stringify(next)); } catch { /* noop */ }
    notify(`Notifications: ${k} ${next[k] ? "on" : "off"}`);
  };

  async function testConnection(id: string, probeUrl: string) {
    setProbes((p) => ({ ...p, [id]: { state: "untested" } }));
    const result = await probe(probeUrl);
    setProbes((p) => ({ ...p, [id]: result }));
    notify(result.state === "ok" ? `${id}: reachable (${result.ms}ms)` : `${id}: unreachable — check network or provider status`);
  }

  async function doReset() {
    setBusy(true);
    await new Promise((r) => setTimeout(r, 900));
    resetPaper();
    await audit("PAPER_SESSION_RESET", "Paper session state cleared by operator");
    setBusy(false);
    setResetOpen(false);
    notify("Paper session state reset. Ledger of closed trades is unchanged.");
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-3xl font-semibold text-paper">Settings &amp; security</h1>
      <p className="mt-1 text-sm text-muted">Connections, notifications, permissions and the audit trail — everything an operator should see at a glance.</p>

      {/* ── API connections ─────────────────────────────── */}
      <section id="api-connections" aria-label="API connections" className="panel-flat mt-4 overflow-hidden scroll-mt-6">
        <div className="flex items-center justify-between gap-3 border-b hairline px-5 py-4"><span className="section-label">API connections</span><span className="num text-[8px] uppercase tracking-[0.18em] text-faint">Read-only in paper mode</span></div>
        <ul className="divide-y hairline-soft">
          {CONNECTIONS.map((c) => {
            const p = probes[c.id] ?? { state: "untested" as const };
            const dot = p.state === "ok" ? "var(--up)" : p.state === "fail" ? "var(--down)" : c.probeUrl ? "var(--warn)" : "var(--text-faint)";
            return (
              <li key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: dot, boxShadow: p.state === "ok" ? "0 0 8px rgba(46,230,168,0.4)" : undefined }} />
                <div className="min-w-0 flex-1">
                  <div className="num text-[11px] text-paper">{c.name} {c.probeUrl === null && <span className="ml-2 rounded border border-warn/30 bg-warn/10 px-1.5 py-0.5 text-[7px] uppercase tracking-[0.18em] text-warn">Phase 2</span>}</div>
                  <div className="mt-0.5 text-[9px] leading-4 text-faint">{c.detail}</div>
                </div>
                {c.probeUrl
                  ? <button type="button" className="ctl-btn !px-3 !py-1.5 !text-[9px]" onClick={() => testConnection(c.id, c.probeUrl)}>{p.state === "untested" ? "Test" : p.state === "ok" ? `OK · ${p.ms}ms` : "Retest"}</button>
                  : <button type="button" className="ctl-btn !px-3 !py-1.5 !text-[9px] opacity-50" disabled title="Phase 2 — provisioned with counsel-gated activation">Locked</button>}
              </li>
            );
          })}
        </ul>
      </section>

      {/* ── Notifications ───────────────────────────────── */}
      <section aria-label="Notifications" className="panel-flat mt-4 p-5">
        <div className="flex items-center justify-between"><span className="section-label">Notifications</span><a href="/audit-log" className="num text-[9px] uppercase tracking-[0.2em] text-gold-500 hover:text-gold-400">Full audit log →</a></div>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {([
            ["fills", "Order fills", "entry/exit confirmations with fees"],
            ["rejections", "Order rejections", "shield vetoes and risk-rule rejections with reason"],
            ["disconnects", "Feed disconnects", "stale prices, dead RPC, mark unavailable"],
            ["riskEvents", "Risk-limit events", "daily-loss warnings at 80%, auto-pause at 100%"],
          ] as const).map(([key, label, hint]) => (
            <li key={key}>
              <button type="button" role="switch" aria-checked={prefs[key]} onClick={() => flip(key)}
                className="flex w-full items-center justify-between gap-3 rounded-lg border hairline-soft bg-obsidian-900 px-4 py-3 text-left transition-colors hover:border-gold-700">
                <span><span className="block text-[12px] text-paper">{label}</span><span className="mt-0.5 block text-[9px] text-faint">{hint}</span></span>
                <span className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${prefs[key] ? "bg-gold-500" : "bg-obsidian-700"}`}>
                  <span className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-obsidian-950 transition-transform ${prefs[key] ? "translate-x-[16px]" : "translate-x-0"}`} />
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[9px] leading-4 text-faint">In this paper build these preferences render as in-app alerts; Phase 2 wires delivery (webhook + email) with the desk SLA.</p>
      </section>

      {/* ── Permissions ─────────────────────────────────── */}
      <section aria-label="Permissions" className="panel-flat mt-4 overflow-hidden">
        <div className="border-b hairline px-5 py-4"><span className="section-label">Permissions</span></div>
        <dl className="divide-y hairline-soft">
          {[
            ["Activate paper desk", "Allowed · one click, virtual book", "ok"],
            ["Activate live trading", "Disabled by PRIMEVEST policy — Phase 2 counsel + desk gates", "locked"],
            ["Withdraw funds", "Not applicable — paper mode holds no keys or custody", "locked"],
            ["Change risk limits", "Allowed with confirmation + mandatory audit entry", "ok"],
            ["Close all positions", "Allowed · typed confirmation (CLOSE ALL) + audit ref", "warn"],
            ["Kill switch", "Always available · typed confirmation · halts entries · never unwinds", "danger"],
          ].map(([action, rule, tone]) => (
            <div key={action as string} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
              <dt className="text-[12px] text-paper">{action}</dt>
              <dd className={`num max-w-[420px] text-right text-[9px] uppercase leading-4 tracking-[0.12em] ${tone === "ok" ? "text-up" : tone === "locked" ? "text-faint" : tone === "warn" ? "text-warn" : "text-down"}`}>{rule}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── Security posture ────────────────────────────── */}
      <section aria-label="Security" className="panel-flat mt-4 p-5">
        <span className="section-label">Security posture</span>
        <ul className="mt-2 text-[11px] leading-6 text-muted">
          <li>· Session auth is managed by the PRIMEVEST terminal account — this console is role-scoped and never stores credentials in the browser.</li>
          <li>· No API keys are bundled with the client; server routes read env vars only (GMGN_API_KEY, SOLANA_RPC_URL — Phase 2).</li>
          <li>· Every state change writes an audit entry with a <span className="num text-paper">PB-</span> reference; the log is append-only on this instance.</li>
        </ul>
      </section>

      {/* ── Danger zone ─────────────────────────────────── */}
      <section aria-label="Danger zone" className="mt-4 rounded-xl border border-down/35 bg-down/5 p-5">
        <span className="section-label !text-down">Danger zone</span>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[12px] text-paper">Reset paper session state</div>
            <p className="mt-0.5 max-w-md text-[9px] leading-4 text-faint">Clears local bot state (status, dismissed alerts) on this browser. Closed-trade ledger, audit log and activation records are kept.</p>
          </div>
          <button type="button" className="ctl-btn ctl-btn-danger-outline" onClick={() => setResetOpen(true)}>Reset session…</button>
        </div>
      </section>

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset paper session"
        body="This clears local bot status and dismissed alerts on this browser. It never touches the ledger or audit log. Type the keyword to proceed."
        confirmKeyword="RESET" tone="danger"
        confirmLabel="Reset session"
        busy={busy}
        onConfirm={doReset}
      />
    </div>
  );
}
