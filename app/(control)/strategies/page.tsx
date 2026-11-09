"use client";

import { useMemo, useState } from "react";
import { useBot } from "@/components/shell/bot-context";
import ConfirmDialog from "@/components/control/ConfirmDialog";
import ActivationForm from "@/components/ActivationForm";
import PreTradeTicket from "@/components/control/PreTradeTicket";

const EQUITY = 784.61; // paper book from the seeded record — labeled in the UI

type Field = { sl: number; tp2: number; tp2Pct: number; tp3: number; tp3Pct: number; trail: number;
  riskPct: number; maxPos: number; dailyLoss: number; sizePct: number; capUsd: number };

const DEFAULTS: Field = { sl: -6, tp2: 2, tp2Pct: 40, tp3: 3, tp3Pct: 30, trail: 8, riskPct: 0.8, maxPos: 5, dailyLoss: 3, sizePct: 10, capUsd: 50 };
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const STRATEGIES = [
  { id: "consensus", name: "Launch-Momentum Consensus", ver: "v0.1 · custom", blurb: "Five-agent ≥2-of-N agreement on scout/whale/sniper signals with shield veto. Ships today as paper." },
  { id: "breakout", name: "Breakout", ver: "template", blurb: "Range-high break with volume confirmation. Not configured for this workspace." },
  { id: "trend", name: "Trend-following", ver: "template", blurb: "Higher-highs / higher-lows continuation on 4h structure. Not configured." },
  { id: "meanrev", name: "Mean reversion", ver: "template", blurb: "Fade 2σ deviations against a VWAP anchor. Not configured." },
] as const;

export default function StrategiesPage() {
  const { notify, audit, pause, resume, status } = useBot();
  const [strategy, setStrategy] = useState<string>("consensus");
  const [symbol, setSymbol] = useState("SOLUSDT");
  const [timeframe, setTimeframe] = useState("1h");
  const [f, setF] = useState<Field>(DEFAULTS);
  const [activeDays, setActiveDays] = useState<string[]>([...DAYS]);
  const [fromHour, setFromHour] = useState("00:00");
  const [toHour, setToHour] = useState("23:59");
  const [touched, setTouched] = useState(false);
  const [activationOpen, setActivationOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const set = (k: keyof Field) => (e: React.ChangeEvent<HTMLInputElement>) => { setTouched(true); setF({ ...f, [k]: Number(e.target.value) }); };

  const errors = useMemo(() => {
    const e: string[] = [];
    if (!(f.sl < 0 && f.sl >= -30)) e.push("Stop-loss must be between −0.5% and −30%.");
    if (!(f.tp2 > 1)) e.push("First take-profit must be above entry (> 1.0×).");
    if (!(f.tp3 > f.tp2)) e.push("Second take-profit must be above the first.");
    if (f.tp2Pct + f.tp3Pct > 90) e.push("Partial exits may not exceed 90% of the position combined.");
    if (f.trail < 2 || f.trail > 40) e.push("Trailing stop must be between 2% and 40%.");
    if (f.riskPct <= 0 || f.riskPct > 5) e.push("Risk per trade must be between 0 and 5% of equity.");
    if (f.maxPos < 1 || f.maxPos > 25) e.push("Max open positions must be between 1 and 25.");
    if (f.dailyLoss <= 0 || f.dailyLoss > 15) e.push("Daily loss limit must be between 0 and 15% of equity.");
    if (f.sizePct <= 0 || f.sizePct > 100) e.push("Position size must be between 0 and 100% of equity.");
    if (f.capUsd <= 0 || f.capUsd > EQUITY) e.push(`Position cap must be between $0 and $${EQUITY.toFixed(0)} (current paper equity).`);
    if (activeDays.length === 0) e.push("Select at least one trading day.");
    return e;
  }, [f, activeDays]);
  const valid = errors.length === 0;

  const sizeUsd = Math.min((f.sizePct / 100) * EQUITY, f.capUsd);
  const riskUsd = (f.riskPct / 100) * EQUITY;
  const dailyLossUsd = (f.dailyLoss / 100) * EQUITY;
  const summary = `If ${symbol} breaks above its ${timeframe} range high with volume ≥ 1.5× average AND ≥ 2 of scout/whale/sniper agree: BUY up to ${fmtUsdI(sizeUsd)} (≤ ${f.sizePct}% of equity, hard cap $${f.capUsd}) — risking ${f.riskPct}% (${fmtUsdI(riskUsd)}) if stopped. Stop-loss ${f.sl}% → full exit. ${f.tp2}×: sell ${f.tp2Pct}% · ${f.tp3}×: sell ${f.tp3Pct}% of remainder. Trailing stop ${f.trail}% off peak. Max ${f.maxPos} open · daily loss cap ${f.dailyLoss}% (${fmtUsdI(dailyLossUsd)}) — entries auto-pause at breach; Exit never pauses. Schedule ${activeDays.join(",")} ${fromHour}–${toHour} UTC.`;

  function fmtUsdI(n: number) { return `$${n.toFixed(2)}`; }

  async function saveDraft() {
    setTouched(true);
    if (!valid) { notify("Fix validation errors before saving."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/strategy", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ strategy, symbol, timeframe, mode: "paper", summary }),
      });
      const data = (await res.json()) as { ok: boolean; ref?: string };
      notify(data.ok ? `Draft saved · audit ${data.ref}` : "Save failed — try again");
    } catch { notify("Save failed — network error"); } finally { setSaving(false); }
  }

  async function runPaperTest() {
    setTouched(true);
    if (!valid) { notify("Fix validation errors before testing."); return; }
    const ref = await audit("PAPER_TEST_QUEUED", `${strategy} ${symbol} ${timeframe} queued for accelerated paper run`);
    notify(ref ? `Paper test queued · ${ref} — results land in Dashboard` : "Paper test queued");
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-paper">Strategy setup</h1>
          <p className="mt-1 text-sm text-muted">Every parameter that can cause a loss is visible, validated, and explained. Nothing hides behind “Advanced”.</p>
        </div>
        <div className="flex items-center gap-2">
          {status === "paused"
            ? <button type="button" className="ctl-btn" onClick={resume}>Resume bot</button>
            : <button type="button" className="ctl-btn ctl-btn-amber" onClick={pause}>Pause bot</button>}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        {/* ─────────── Form ─────────── */}
        <div className="flex flex-col gap-4 lg:col-span-7">
          {/* Strategy + market */}
          <section aria-label="Strategy and market" className="panel-flat p-5">
            <span className="section-label">Strategy</span>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {STRATEGIES.map((s) => {
                const active = strategy === s.id;
                const locked = s.id !== "consensus";
                return (
                  <button key={s.id} type="button" onClick={() => !locked && setStrategy(s.id)} aria-pressed={active}
                    className={`rounded-xl border p-3 text-left transition-all ${active ? "border-gold-500 bg-gold-800/30" : "hairline-soft border bg-obsidian-900"} ${locked ? "cursor-not-allowed opacity-55" : "hover:border-gold-600"}`}>
                    <div className="flex items-center justify-between gap-2"><span className="num text-[11px] text-paper">{s.name}</span><span className="num text-[8px] uppercase text-gold-500">{s.ver}</span></div>
                    <p className="mt-1.5 text-[10px] leading-4 text-muted">{s.blurb}</p>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="symbol" className="field-label">Symbol · asset &amp; venue</label>
                <select id="symbol" className="field" value={symbol} onChange={(e) => setSymbol(e.target.value)}>
                  <option>SOLUSDT</option><option>BTCUSDT</option><option>ETHUSDT</option>
                </select>
                <p className="field-hint">Binance spot pair · launch markets route via DexScreener signals in paper runs.</p>
              </div>
              <div>
                <label htmlFor="timeframe" className="field-label">Timeframe</label>
                <select id="timeframe" className="field" value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
                  <option>15m</option><option>1h</option><option>4h</option>
                </select>
                <p className="field-hint">Signal horizon for entries; exits are continuous.</p>
              </div>
            </div>
          </section>

          {/* Exit rules */}
          <section aria-label="Exit rules" className="panel-flat p-5">
            <span className="section-label">Exit rules · where money is actually made</span>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Stop-loss %", "sl", -30, -0.5, 0.5], ["TP1 ×", "tp2", 1, 5, 0.1], ["TP1 sell %", "tp2Pct", 0, 90, 5], ["TP2 ×", "tp3", 1, 10, 0.1],
                ["TP2 sell %", "tp3Pct", 0, 90, 5], ["Trail %", "trail", 2, 40, 0.5], ["Size % equity", "sizePct", 1, 100, 1], ["Cap $", "capUsd", 1, 500, 5],
              ].map(([label, key, min, max, step]) => (
                <div key={key as string}>
                  <label htmlFor={`f-${key as string}`} className="field-label">{label as string}</label>
                  <input id={`f-${key as string}`} type="number" className="field" min={min as number} max={max as number} step={step as number}
                    value={f[key as keyof Field]} onChange={set(key as keyof Field)} />
                </div>
              ))}
            </div>
            <p className="field-hint">SL hits first and can gap through on thin books — size so a worst-case fill still fits the daily limit.</p>
          </section>

          {/* Risk limits */}
          <section aria-label="Risk limits" className="panel-flat p-5">
            <span className="section-label">Risk limits · breach = entries pause automatically</span>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="riskPct" className="field-label">Risk / trade %</label>
                <input id="riskPct" type="number" className="field" min={0} max={5} step={0.1} value={f.riskPct} onChange={set("riskPct")} />
                <p className="field-hint">${riskUsd.toFixed(2)} at stop</p>
              </div>
              <div>
                <label htmlFor="maxPos" className="field-label">Max open</label>
                <input id="maxPos" type="number" className="field" min={1} max={25} step={1} value={f.maxPos} onChange={set("maxPos")} />
                <p className="field-hint">hard cap shield</p>
              </div>
              <div>
                <label htmlFor="dailyLoss" className="field-label">Max daily loss %</label>
                <input id="dailyLoss" type="number" className="field" min={0} max={15} step={0.25} value={f.dailyLoss} onChange={set("dailyLoss")} />
                <p className="field-hint">${dailyLossUsd.toFixed(2)} → pause entries</p>
              </div>
            </div>
          </section>

          {/* Schedule */}
          <section aria-label="Trading schedule" className="panel-flat p-5">
            <span className="section-label">Trading schedule · UTC</span>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {DAYS.map((d) => {
                const on = activeDays.includes(d);
                return (
                  <button key={d} type="button" aria-pressed={on}
                    onClick={() => { setTouched(true); setActiveDays(on ? activeDays.filter((x) => x !== d) : [...activeDays, d]); }}
                    className={`ctl-btn !px-3 !py-2 !text-[10px] ${on ? "ctl-btn-gold" : ""}`}>{d}</button>
                );
              })}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div><label htmlFor="fromHour" className="field-label">From</label><input id="fromHour" type="time" className="field" value={fromHour} onChange={(e) => setFromHour(e.target.value)} /></div>
              <div><label htmlFor="toHour" className="field-label">To</label><input id="toHour" type="time" className="field" value={toHour} onChange={(e) => setToHour(e.target.value)} /></div>
            </div>
          </section>
        </div>

        {/* ─────────── Sticky preview + activation ─────────── */}
        <div className="lg:col-span-5">
          <div className="panel sticky top-5 p-5">
            <div className="flex items-center justify-between">
              <span className="section-label">If this were live — plain English</span>
              <span className="badge badge-warn">Paper</span>
            </div>
            <p className="mt-3 rounded-lg border hairline-soft bg-obsidian-900 p-4 font-mono text-[10px] leading-5 text-muted">{summary}</p>

            {touched && errors.length > 0 && (
              <ul className="mt-3 space-y-1 rounded-lg border border-down/30 bg-down/5 p-3" role="alert">
                {errors.map((e) => <li key={e} className="text-[10px] leading-4 text-down">· {e}</li>)}
              </ul>
            )}

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border hairline-soft p-2.5"><div className="kpi text-sm text-paper">${riskUsd.toFixed(2)}</div><div className="mt-0.5 font-mono text-[7px] uppercase tracking-[0.18em] text-faint">Risk/trade</div></div>
              <div className="rounded-lg border hairline-soft p-2.5"><div className="kpi text-sm text-paper">{fmtUsdI(sizeUsd)}</div><div className="mt-0.5 font-mono text-[7px] uppercase tracking-[0.18em] text-faint">Size cap</div></div>
              <div className="rounded-lg border hairline-soft p-2.5"><div className="kpi text-sm text-warn">${dailyLossUsd.toFixed(2)}</div><div className="mt-0.5 font-mono text-[7px] uppercase tracking-[0.18em] text-faint">Daily stop</div></div>
            </div>

            <div className="mt-4 space-y-2">
              <button type="button" onClick={saveDraft} disabled={saving} className="ctl-btn ctl-btn-gold w-full">{saving ? "Saving…" : "Save draft · audit logged"}</button>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={runPaperTest} className="ctl-btn">Test in paper</button>
                <button type="button" onClick={() => { setStep(0); setActivationOpen(true); }} className="ctl-btn ctl-btn-amber">Activate…</button>
              </div>
              <p className="text-center font-mono text-[7px] uppercase tracking-[0.18em] text-faint">Live mode locked by policy · Phase 2 gate required</p>
            </div>
          </div>
          <PreTradeTicket
            symbol={symbol}
            sizeUsd={sizeUsd}
            slPct={f.sl}
            tp1={f.tp2}
            tp1Pct={f.tp2Pct}
            equity={EQUITY}
          />
        </div>
      </div>

      {/* Activation: deliberate 3-step — live locked, paper one click */}
      {activationOpen && (
        <div className="overlay-progress" role="dialog" aria-modal="true" aria-labelledby="activation-title">
          <div className="panel w-full max-w-lg p-6">
            <div className="flex items-center justify-between">
              <h2 id="activation-title" className="font-display text-xl text-paper">Activate the bot</h2>
              <button type="button" className="ctl-btn !px-2.5 !py-1.5 !text-[10px]" onClick={() => setActivationOpen(false)} aria-label="Close activation">✕</button>
            </div>
            <ol className="num mt-4 flex items-center gap-2 text-[9px] uppercase tracking-[0.18em]">
              {["Strategy review", "Risk review", "Mode check"].map((label, i) => (
                <li key={label} className="flex items-center gap-2">
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${step >= i ? "border-gold-400 bg-gold-400 text-obsidian-950" : "border-faint text-faint"}`}>{i + 1}</span>
                  <span className={step >= i ? "text-paper" : "text-faint"}>{label}</span>
                  {i < 2 && <span className="text-faint">—</span>}
                </li>
              ))}
            </ol>
            <div className="mt-4 min-h-[120px] rounded-lg border hairline-soft bg-obsidian-900 p-4 text-[12px] leading-6 text-muted">
              {step === 0 && <>You reviewed <span className="text-paper">{symbol} · {timeframe} · consensus ≥ 2</span>. Entry fires only on multi-agent agreement; shield can veto; exits are unconditional. Confirm you understand no single signal places a trade.</>}
              {step === 1 && <>Worst-case per trade: <span className="text-paper">${riskUsd.toFixed(2)}</span> at a −{Math.abs(f.sl)}% stop. Daily ceiling: <span className="text-paper">${dailyLossUsd.toFixed(2)}</span> then entries auto-pause. Fees modeled at 0.3%/side; live slippage not included. Confirm you accept these bounds.</>}
              {step === 2 && (
                <>
                  <p className="text-warn">Live trading is disabled by PRIMEVEST policy in this release.</p>
                  <p className="mt-1.5 text-[10px] leading-4 text-faint">If live trading ships later, availability will vary by jurisdiction and tokenized/perpetual products may be restricted where you live. Nothing in this console is investment advice.</p>
                  <p className="mt-1.5">Activate the paper desk instead — free, virtual $500, same engine:</p>
                  <div className="mt-3"><ActivationForm /></div>
                </>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              {step > 0 ? <button type="button" className="ctl-btn" onClick={() => setStep(step - 1)}>Back</button> : <span />}
              {step < 2
                ? <button type="button" className="ctl-btn ctl-btn-gold" onClick={() => setStep(step + 1)}>Confirm &amp; continue</button>
                : <button type="button" className="ctl-btn" disabled title="Disabled by policy — live execution does not exist in this build">Activate live — locked</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
