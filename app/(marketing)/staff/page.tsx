import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Desk console",
  description: "PRIMEVEST desk console (design preview) — manual signal review, settlement recording and the kill switch.",
};

function LockedCard({ title, body, kpi }: { title: string; body: string; kpi?: string }) {
  return (
    <div aria-disabled="true" className="panel-flat relative p-6 opacity-90">
      <div className="flex items-center justify-between gap-4">
        <span className="num text-[9px] uppercase tracking-[0.24em] text-faint">{title}</span>
        <span className="badge">Locked · desk</span>
      </div>
      <p className="mt-4 text-[13px] leading-6 text-muted">{body}</p>
      {kpi ? <div className="num mt-4 text-[11px] text-gold-500">{kpi}</div> : null}
      <div className="mt-5 flex items-center gap-2 border-t hairline-soft pt-4">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8a6a2f" strokeWidth="2" aria-hidden="true"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
        <span className="num text-[9px] uppercase tracking-[0.2em] text-faint">Requires PRIMEVEST desk credentials · Phase 2</span>
      </div>
    </div>
  );
}

export default function StaffPage() {
  return (
    <section className="mx-auto max-w-container px-4 py-12 sm:px-6">
      <div className="max-w-2xl">
        <span className="badge badge-warn">Design preview · no desk actions available here</span>
        <h1 className="mt-5 font-display text-4xl font-semibold text-paper sm:text-5xl">The desk console,<br /><span className="gold">on paper.</span></h1>
        <p className="mt-4 leading-7 text-muted">
          How a PRIMEVEST desk officer works a bot signal in Phase 2 — review, decide, execute manually on venue,
          then settle into the ledger. This page is a locked design preview: no credentials exist here, no buttons perform actions,
          and nothing on this page can move money.
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <LockedCard
          title="01 · Review"
          body="See the exact agent coalition behind each pending signal (scout/whale/sniper votes, sizes, invalidation levels), the token's privilege flags from sniper filters, and the client's allocated cap before approving anything."
          kpi="input: BotDecision rows · output: approve / reject + notes"
        />
        <LockedCard
          title="02 · Execute manually"
          body="The officer places the order on the venue themselves (or routes it per SOP) with their own credentials and risk limits. The bot never touches keys, venues, or client funds. Slippage and partial fills are recorded by the desk, not assumed."
          kpi="input: approved signal · output: external execution ref"
        />
        <LockedCard
          title="03 · Settle in ledger"
          body="Fills reconcile against PRIMEVEST's ledger with full provenance: quantity, price, fees, timestamps, officer ID, client allocation. Client dashboards and statements read from the same rows. Manual corrections require dual sign-off."
          kpi="input: execution ref · output: ledger entries (append-only)"
        />
      </div>

      <div className="panel mt-6 grid gap-6 p-6 md:grid-cols-12">
        <div className="md:col-span-5">
          <div className="num text-[10px] uppercase tracking-[0.22em] text-faint">Kill switch</div>
          <div className="mt-3 flex items-center gap-4" aria-hidden="true">
            <div className="flex h-8 w-16 items-center rounded-full border hairline bg-obsidian-900 px-1">
              <div className="h-6 w-6 rounded-full bg-down shadow" />
            </div>
            <span className="num text-[11px] uppercase tracking-[0.18em] text-muted">BOT_EXECUTION_ENABLED = false</span>
          </div>
          <p className="mt-3 text-[11px] leading-5 text-faint">Single operator flag, independent of UI and deploys. Default state: off. Turning it on requires two desk officers and does not unwind open client positions.</p>
        </div>
        <div className="md:col-span-3">
          <div className="num text-[10px] uppercase tracking-[0.22em] text-faint">Pending activations</div>
          <div className="mt-3 rounded-lg border border-dashed hairline px-4 py-5 text-center text-[11px] text-faint">0 pending<br />(desk not provisioned)</div>
        </div>
        <div className="md:col-span-4">
          <div className="num text-[10px] uppercase tracking-[0.22em] text-faint">Phase 2 gate checklist</div>
          <ul className="num mt-3 space-y-1.5 text-[10px] leading-5 text-muted">
            <li>[ ] Counsel sign-off on disclosures</li>
            <li>[ ] Kill switch tested in prod</li>
            <li>[ ] Ledger reconciliation dual-control</li>
            <li>[ ] Client risk acceptance v0.2 signed</li>
            <li>[ ] Desk SOP v1 ratified</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
