import type { Metadata } from "next";
import Link from "next/link";
import AgentGlyph from "@/components/AgentGlyph";

export const metadata: Metadata = {
  title: "The five agents",
  description: "How PRIMEVEST Trading Bot sees: scout, whale, sniper, shield, exit — and the Core that refuses to act without consensus.",
};

const AGENTS = [
  {
    glyph: "scout" as const, name: "Scout", tag: "GMGN-style momentum",
    does: "Ranks launch-market candidates by 5-minute volume acceleration and price velocity. Prefers live DexScreener boosted/profiled tokens; falls back to simulated flow when offline.",
    rules: ["vol-change 5m ≥ +180% (or m5 volume ≥ $25k on live feeds)", "price change 5m ≥ +25%", "liquidity ≥ $8,000"],
    notFor: "It does not know why a token is moving — only that it is. That is Whale and Sniper's job to corroborate.",
  },
  {
    glyph: "whale" as const, name: "Whale", tag: "smart-money confluence",
    does: "Tracks wallet sets flagged as consistently early winners and counts how many bought the same mint in the current window. Confluence of three or more independent tracked wallets is a buy signal.",
    rules: ["≥ 3 tracked wallets in the same token", "chain-aware buyer grouping", "strength scales with buyer count"],
    notFor: "It cannot distinguish a coordinated insider cabal from informed flow — the Shield and Exit exist precisely for this blind spot.",
  },
  {
    glyph: "sniper" as const, name: "Sniper", tag: "pump.fun-style clean launches",
    does: "Subscribes to new-launch events and applies a toxicity filter: liquidity locked, dev hold < 5%, bundled supply < 15%, age < 90 seconds. Optionally vetoed by a pumpdata.fun community check for the mint.",
    rules: ["liquidity_locked == true", "dev_hold_pct < 5.0 · bundled_supply_pct < 15.0", "age_seconds < 90 · no serial-launcher or curve-buy flags"],
    notFor: "It never fires on its own — one clean launch out of a hundred is still untradable without a second agent agreeing.",
  },
  {
    glyph: "shield" as const, name: "Shield", tag: "the risk veto",
    does: "The only agent with absolute authority — and it can only say no. Blocks new positions at the max-open-positions cap or when the cash buffer falls below the safety floor. Exits always flow past it.",
    rules: ["open positions ≥ MAX_OPEN_POSITIONS → block", "balance < $10 buffer → block", "blocks never override Exit — risk reduction outranks risk prevention"],
    notFor: "It does not optimize, time entries, or score alpha. It is a circuit breaker, and proud of it.",
  },
  {
    glyph: "exit" as const, name: "Exit", tag: "the discipline",
    does: "Owns every position after entry: hard stop-loss, scaled take-profits, and an adaptive trailing stop. Sells 40% at 2×, 30% at 3×, then trails the remainder 8% below its peak once armed (after 1.5× or the first partial).",
    rules: ["hard SL −6.0% from entry → 100% out", "partial 40% @ 2.0× entry · partial 30% @ 3.0× entry", "trail 8% off peak, armed at 1.5× or after first partial"],
    notFor: "It is deliberately boring. Exciting exits are how accounts round-trip from +200% to −6%.",
  },
];

export default function AgentsPage() {
  return (
    <section className="mx-auto max-w-container px-4 py-12 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl font-semibold text-paper sm:text-5xl">Five agents,<br /><span className="gold">zero groupthink.</span></h1>
        <p className="mt-4 leading-7 text-muted">
          Each agent is deliberately narrow — one job, one clock, one worldview. The Core (min_agree = 2) treats agreement
          as evidence and treats silence as no. Below is exactly what each one does, exactly what trips it, and exactly
          what it does not do.
        </p>
      </div>

      <div className="mt-12 flex flex-col gap-4">
        {AGENTS.map((a, i) => (
          <div key={a.name} className="panel-flat grid gap-6 p-6 md:grid-cols-12">
            <div className="flex items-start gap-4 md:col-span-3">
              <div className="rounded-xl border hairline bg-obsidian-900 p-3">
                <AgentGlyph agent={a.glyph} size={34} className="text-gold-400" />
              </div>
              <div>
                <div className="num text-[9px] uppercase tracking-[0.22em] text-faint">Agent 0{i + 1}</div>
                <div className="font-display text-2xl text-paper">{a.name}</div>
                <div className="mt-0.5 text-[11px] text-gold-500">{a.tag}</div>
              </div>
            </div>
            <div className="md:col-span-5">
              <p className="text-sm leading-6 text-muted">{a.does}</p>
              <div className="mt-3 rounded-lg border hairline-soft bg-obsidian-900 p-3">
                <div className="num text-[8px] uppercase tracking-[0.22em] text-faint">Trigger rules</div>
                <ul className="mt-1.5 space-y-1">
                  {a.rules.map((r) => <li key={r} className="num text-[10px] leading-4 text-gold-500">· {r}</li>)}
                </ul>
              </div>
            </div>
            <div className="md:col-span-4">
              <div className="num text-[8px] uppercase tracking-[0.22em] text-faint">What it is not</div>
              <p className="mt-1.5 text-[12px] leading-5 text-muted">{a.notFor}</p>
            </div>
          </div>
        ))}
      </div>

      {/* The Core */}
      <div className="panel mt-8 p-6 sm:p-8">
        <div className="grid gap-6 md:grid-cols-12 md:items-center">
          <div className="flex items-center gap-4 md:col-span-4">
            <div className="rounded-xl border border-gold-700 bg-gold-800/30 p-3">
              <AgentGlyph agent="core" size={36} className="text-gold-400" />
            </div>
            <div>
              <div className="num text-[9px] uppercase tracking-[0.22em] text-faint">The arbiter</div>
              <div className="font-display text-2xl text-paper">The Core</div>
            </div>
          </div>
          <div className="md:col-span-8">
            <p className="leading-7 text-muted">
              The Core is deliberately dumb: collect signals, discard blocked buys, group by token, require
              <span className="text-paper"> ≥ 2 distinct agents to agree</span> on the same side for the same mint,
              skip tokens already held, size the position at the lesser of $50 or 10% of cash, fill at the mark,
              log everything — including the NO_CONSENSUS ticks that produced nothing. The intelligence lives in the
              agents; the integrity lives in the Core.
            </p>
            <div className="mt-4 inline-flex max-w-2xl items-center border-l-2 border-gold-600 bg-gold-800/20 px-4 py-2">
              <code className="num text-[11px] leading-5 text-gold-300">if len(&#123;s.agent for s in buys&#125;) &gt;= min_agreeing_agents: open(token)</code>
            </div>
            <p className="mt-3 text-[11px] text-faint">That is the entire secret. No overrides, no discretion, no exceptions — which is exactly why you can audit it.</p>
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-4">
        <Link href="/track-record" className="btn btn-gold">See what this consensus produced</Link>
        <Link href="/disclosures" className="btn btn-ghost">Read the risk disclosures</Link>
      </div>
    </section>
  );
}
