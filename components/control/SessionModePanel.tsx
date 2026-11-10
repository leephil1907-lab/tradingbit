"use client";

import Link from "next/link";

/**
 * Demo is the only executable mode in this release.
 * Live market data availability is not equivalent to permission or capability
 * to submit real orders. The live card remains locked until an authenticated
 * venue adapter, server-side risk checks, persistent order ledger, and
 * reconciliation have all been deployed and verified.
 */
export default function SessionModePanel() {
  return (
    <section aria-label="Trading sessions" className="mb-4 grid gap-3 md:grid-cols-2">
      <div className="relative overflow-hidden rounded-2xl border border-[var(--gold-hairline)] bg-[linear-gradient(135deg,rgba(223,192,138,0.12),rgba(20,17,16,0.94)_58%)] p-4 shadow-[0_16px_48px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full border border-[rgba(223,192,138,0.14)] bg-[radial-gradient(circle,rgba(223,192,138,0.16),transparent_68%)]" />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <div className="section-label">Trading session 01</div>
            <h2 className="mt-2 font-display text-xl text-paper">Demo session</h2>
            <p className="mt-1 max-w-sm text-xs leading-5 text-muted">Practice with a virtual book, strategy tests and simulated fills. No real orders or client funds.</p>
          </div>
          <span className="badge badge-up shrink-0">Available</span>
        </div>
        <div className="relative mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[var(--gold-hairline)] bg-black/20 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-gold-400">Virtual balance</span>
          <span className="rounded-full border border-[var(--gold-hairline)] bg-black/20 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted">Simulated execution</span>
          <span className="rounded-full border border-[var(--gold-hairline)] bg-black/20 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted">Risk controls</span>
        </div>
        <div className="relative mt-4 flex items-center justify-between border-t border-[var(--gold-hairline-soft)] pt-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-up">Current session</span>
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">PAPER · DEMO</span>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-[var(--gold-hairline-soft)] bg-[linear-gradient(135deg,rgba(255,255,255,0.035),rgba(16,14,12,0.94)_62%)] p-4 shadow-[0_16px_48px_rgba(0,0,0,0.16)] backdrop-blur-xl">
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <div className="section-label">Trading session 02</div>
            <h2 className="mt-2 font-display text-xl text-paper">Live session</h2>
            <p className="mt-1 max-w-sm text-xs leading-5 text-muted">Reserved for authenticated exchange execution, actual balances and reconciled order history.</p>
          </div>
          <span className="badge badge-warn shrink-0">Setup required</span>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[var(--gold-hairline-soft)] px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-faint">Venue connection</span>
          <span className="rounded-full border border-[var(--gold-hairline-soft)] px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-faint">Server-side risk</span>
          <span className="rounded-full border border-[var(--gold-hairline-soft)] px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-faint">Order reconciliation</span>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-[var(--gold-hairline-soft)] pt-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-warn">Order execution disabled</span>
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">LIVE · LOCKED</span>
        </div>
        <p className="mt-2 text-[10px] leading-4 text-faint">Live prices and charts do not mean live trading is connected. This session unlocks only after exchange authentication, backend execution controls and independent verification are complete.</p>
        <Link href="/settings#api-connections" className="mt-3 inline-flex font-mono text-[9px] uppercase tracking-[0.16em] text-gold-400 transition-colors hover:text-gold-300">Review connection settings <span aria-hidden="true" className="ml-1">→</span></Link>
      </div>
    </section>
  );
}
