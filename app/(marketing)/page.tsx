import Link from "next/link";
import AgentGlyph from "@/components/AgentGlyph";
import EquityCurve from "@/components/EquityCurve";
import StatTile from "@/components/StatTile";
import { loadTrackRecord } from "@/lib/record";
import { fmtPct, fmtUsd } from "@/lib/format";

const AGENTS = [
  { glyph: "scout" as const, name: "Scout", role: "Volume-spike & top-gainer detection across launch markets.", spec: "vol-change 5m ≥ +180% · price 5m ≥ +25% · liq ≥ $8k" },
  { glyph: "whale" as const, name: "Whale", role: "Smart-money confluence — counts tracked wallets buying the same mint.", spec: "≥ 3 tracked wallets · same token · same tick" },
  { glyph: "sniper" as const, name: "Sniper", role: "Clean new-launch filter on pump.fun-style bonding curves.", spec: "liq locked · dev < 5% · bundle < 15% · age < 90s" },
  { glyph: "shield" as const, name: "Shield", role: "Hard risk veto. Can only say no. Overrides everything.", spec: "max open positions · min cash buffer · blocks new buys" },
  { glyph: "exit" as const, name: "Exit", role: "Owns every exit: hard stop, scaled take-profits, trailing stop.", spec: "SL −6% · 40% @ 2.0× · 30% @ 3.0× · 8% off peak trail" },
];

export default function Home() {
  const record = loadTrackRecord();
  const s = record?.summary;

  return (
    <>
      {/* ───────────────────────── HERO ───────────────────────── */}
      <section className="mx-auto max-w-container px-4 pb-16 pt-14 sm:px-6 md:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h1 className="font-display text-5xl font-semibold leading-[1.04] tracking-tight text-paper sm:text-6xl xl:text-7xl">
              Precision,<br />
              <span className="gold">automated.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted">
              PRIMEVEST TRADING BOT is a five-agent consensus system for volatile launch markets.
              No single signal can open a position — the Core acts only when independent agents agree,
              and every decision lands in a permanent audit log.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link href="/track-record" className="btn btn-gold">See the track record</Link>
              <Link href="/agents" className="btn btn-ghost">How consensus works<span aria-hidden="true">→</span></Link>
            </div>
            <p className="num mt-8 text-[10px] uppercase leading-5 tracking-[0.18em] text-faint">
              Paper mode · No real funds moved by this bot<br />Not financial advice
            </p>
          </div>

          {/* Consensus snapshot panel */}
          <div className="lg:col-span-5">
            <div className="panel p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <span className="num text-[10px] uppercase tracking-[0.2em] text-faint">Consensus snapshot</span>
                <span className="badge badge-warn">Paper</span>
              </div>
              <div className="mt-5 flex items-end justify-between gap-4">
                <div>
                  <div className="num text-4xl text-paper">{s ? fmtUsd(s.final_equity) : "$500.00"}</div>
                  <div className="mt-1 text-[11px] text-faint">virtual equity · initial $500.00</div>
                </div>
                {s ? (
                  <div className="text-right">
                    <div className={`num text-lg ${s.total_pnl >= 0 ? "text-up" : "text-down"}`}>{fmtPct(s.total_pnl_pct)}</div>
                    <div className="text-[10px] text-faint">over 24h sim</div>
                  </div>
                ) : null}
              </div>
              <div className="mt-4">
                <EquityCurve points={record?.equity_curve ?? []} height={150} />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 border-t hairline-soft pt-4">
                <div><div className="num text-base text-paper">{s?.win_rate_pct.toFixed(0) ?? "—"}%</div><div className="text-[9px] uppercase tracking-[0.18em] text-faint">Win rate</div></div>
                <div><div className="num text-base text-paper">{s?.closed_trades ?? 0}</div><div className="text-[9px] uppercase tracking-[0.18em] text-faint">Closed trades</div></div>
                <div><div className="num text-base text-paper">{s ? `${s.max_drawdown_pct.toFixed(1)}%` : "—"}</div><div className="text-[9px] uppercase tracking-[0.18em] text-faint">Max drawdown</div></div>
              </div>
              <p className="mt-4 text-[10px] leading-4 text-faint">
                Accelerated 24h simulation · seed 42 · seeded synthetic regimes with live DexScreener marks · fees 0.3%/side.
                Illustrative of mechanics only — not a forecast of live results.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────── FIVE AGENTS ───────────────────── */}
      <section className="border-t hairline-soft bg-obsidian-900/40">
        <div className="mx-auto max-w-container px-4 py-16 sm:px-6">
          <h2 className="font-display text-3xl font-semibold text-paper sm:text-4xl">Five agents. <span className="gold">One decision.</span></h2>
          <p className="mt-3 max-w-2xl text-muted">Each agent sees the tape differently. The Core is deliberately hard to convince — aggression is concentrated in the agents, restraint lives in the coordinator.</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {AGENTS.map((a) => (
              <div key={a.name} className="panel-flat flex flex-col gap-4 p-5">
                <div className="flex items-center justify-between">
                  <AgentGlyph agent={a.glyph} className="text-gold-400" size={30} />
                  <span className="num text-[9px] uppercase tracking-[0.22em] text-faint">0{AGENTS.indexOf(a) + 1}</span>
                </div>
                <div>
                  <div className="font-display text-lg text-paper">{a.name}</div>
                  <p className="mt-1.5 text-[12.5px] leading-5 text-muted">{a.role}</p>
                </div>
                <code className="mt-auto border-t hairline-soft pt-3 font-mono text-[9px] leading-4 text-gold-500">{a.spec}</code>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────── CONSENSUS DIAGRAM ─────────────────── */}
      <section className="mx-auto max-w-container px-4 py-16 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 className="font-display text-3xl font-semibold text-paper sm:text-4xl">Consensus, not <span className="gold">conviction.</span></h2>
            <p className="mt-4 leading-7 text-muted">
              Every tick, the Core gathers signals from all five agents. Shield can veto. Exit can only sell.
              Buys require <span className="text-paper">≥ 2 distinct agents to agree on the same token</span> —
              then, and only then, the paper engine fills a $50-max tranche at the mark price, fees included,
              into a permanent decision ledger.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-muted">
              <li className="flex gap-2"><span className="gold">→</span> Exits are never gated by consensus — risk reduction always executes.</li>
              <li className="flex gap-2"><span className="gold">→</span> Shield&apos;s veto blocks new buys even when agents agree.</li>
              <li className="flex gap-2"><span className="gold">→</span> NO_CONSENSUS outcomes are logged too — the misses are auditable.</li>
            </ul>
          </div>
          <div className="lg:col-span-7">
            <div className="panel p-6">
              <div className="flex flex-wrap items-center justify-center gap-3">
                {(["scout", "whale", "sniper"] as const).map((g) => (
                  <div key={g} className="flex flex-col items-center gap-2 rounded-xl border hairline px-4 py-3">
                    <AgentGlyph agent={g} size={26} className="text-gold-400" />
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">{g}</span>
                  </div>
                ))}
                <span className="num text-xl text-faint">+</span>
                <div className="flex flex-col items-center gap-2 rounded-xl border border-down/30 bg-down/5 px-4 py-3">
                  <AgentGlyph agent="shield" size={26} className="text-down" />
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-down">shield veto</span>
                </div>
              </div>
              <div className="my-5 flex items-center justify-center gap-3">
                <span className="h-px w-16 bg-gold-800" />
                <span className="num text-[9px] uppercase tracking-[0.24em] text-gold-500">signals ≥ 2/3 agree</span>
                <span className="h-px w-16 bg-gold-800" />
              </div>
              <div className="mx-auto flex max-w-sm flex-col items-center gap-2 rounded-xl border border-gold-700 bg-gold-800/30 px-6 py-4">
                <AgentGlyph agent="core" size={30} className="text-gold-400" />
                <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold-400">Primevest Core</span>
                <span className="num text-[10px] text-muted">min_agree = 2 · dedupe held tokens · cap size $50 / 10%</span>
              </div>
              <div className="my-5 flex items-center justify-center gap-3">
                <span className="h-px w-16 bg-gold-800" />
                <span className="num text-[9px] uppercase tracking-[0.24em] text-gold-500">then, and only then</span>
                <span className="h-px w-16 bg-gold-800" />
              </div>
              <div className="rounded-xl border hairline-soft bg-obsidian-900 p-4">
                <div className="num text-[10px] leading-5 text-muted">
                  <span className="text-up">BUY</span> token=&quot;AWaB…v7pump&quot; size=$50.00 fill=mark fee=0.15<br />
                  agents=[scout, whale] avg_strength=0.90 · position_id=3f9ac21e<br />
                  <span className="text-faint">→ decisions.jsonl (permanent, append-only)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── WHAT THE RECORD SHOWS — AND WHAT IT CANNOT ───────── */}
      <section className="border-t hairline-soft">
        <div className="mx-auto max-w-container px-4 py-16 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <h2 className="font-display text-3xl font-semibold text-paper sm:text-4xl">Shown,<br />not <span className="gold">promised.</span></h2>
              <p className="mt-4 text-muted">The track record on this site is our real paper output — including the losing ticks. Here is what it can and cannot tell you.</p>
              <Link href="/track-record" className="btn btn-ghost mt-6">Open the full ledger<span aria-hidden="true">→</span></Link>
            </div>
            <div className="lg:col-span-4">
              <div className="panel-flat h-full p-6">
                <div className="num text-[10px] uppercase tracking-[0.2em] text-up">It shows</div>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-muted">
                  <li>✓ Consensus logic works under fee drag and 6% hard stops</li>
                  <li>✓ Scaled exits: partials at 2×/3× bank gains; trailing locks the runner</li>
                  <li>✓ Drawdown stayed near {s ? `${s.max_drawdown_pct.toFixed(1)}%` : "~1–2%"} in the seeded paper run</li>
                  <li>✓ Every fill, fee and reason is reconstructable from the JSONL log</li>
                </ul>
              </div>
            </div>
            <div className="lg:col-span-4">
              <div className="panel-flat h-full border-down/25 p-6">
                <div className="num text-[10px] uppercase tracking-[0.2em] text-down">It cannot show</div>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-muted">
                  <li>× Live slippage, failed transactions, priority fees, or MEV sandwiching</li>
                  <li>× Liquidity vaporising between signal and fill (rug pulls)</li>
                  <li>× Sentiment, news, chain halts, RPC degradation</li>
                  <li>× Future returns of any kind — the feed is synthetic by design</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────── CTA BAND ───────────────────────── */}
      <section className="border-t hairline-soft">
        <div className="mx-auto max-w-container px-4 py-16 text-center sm:px-6">
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-semibold leading-tight text-paper sm:text-5xl">Start with a virtual <span className="gold">$500.</span></h2>
          <p className="mx-auto mt-4 max-w-xl text-muted">Activate the paper bot on live data, watch the agents disagree, and judge the discipline — before anything involving your capital exists.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/dashboard" className="btn btn-gold">Activate paper bot</Link>
            <Link href="/disclosures" className="btn btn-ghost">Read the disclosures</Link>
          </div>
        </div>
      </section>
    </>
  );
}
