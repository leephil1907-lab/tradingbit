# PRIMEVEST TRADING BOT — by PRIMEVEST

> Precision, automated. A five-agent consensus system for volatile launch markets — paper-traded first, permanently audit-logged, real-money activation only via PRIMEVEST desk review (when it ships).

Live product: linked from [PRIMEVEST](https://primevest-web.onrender.com/) · Repo: `leephil1907-lab/tradingbit`

## Status: Phase 0/1 — paper product

| Phase | State | What exists |
|---|---|---|
| 0 Scaffold | ✅ done | Next.js app, PRIMEVEST design system, brand icon, CI-ready build |
| 1 Paper | ✅ done (runs on deploy) | Public, labeled paper track record from the actual engine (`data/track-record.json`) |
| 2 Shadow desk | ⏳ gated | Requires counsel sign-off, ledger wiring, desk SOP, kill-switch drill |
| 3 Limited live | ⏳ gated | Requires Phase 2 data + per-client caps + reconciliation |
| 4 Scale | ⏳ gated | — |

**Nothing in this repository places real orders or moves client funds.** There is no signing code, no venue connector, no strategy execution path for real money. Real-money activation will be introduced as a separate, reviewed release after the gates above — not as a flag flip.

## Quickstart

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production build
npm start            # serve production build
```

### Regenerating the paper track record

```bash
python -m venv worker/.venv && source worker/.venv/bin/activate
pip install -r worker/requirements.txt
python worker/export_track_record.py 42 24 data/track-record.json   # seed, hours, out
```

Writes a fully-labeled JSON snapshot (mode `PAPER`, seed, fees, assumptions, disclaimers, 20-run seed sweep). The web app renders it verbatim; nothing is invented at render time.

## Design system

PRIMEVEST obsidian & gold, extracted from the live terminal:

| Token | Value | Use |
|---|---|---|
| `obsidian-950/900/850` | `#0a0908 / #0d0b08 / #100e0c` | page backgrounds |
| `obsidian-800/750` | `#141110 / #1a1714` | panels, raised surfaces |
| `gold-400/500/600` | `#dfc088 / #cfa95f / #b8924a` | brand accent, buttons, glyphs |
| `gold-800` hairline | `rgba(223,192,138,0.16)` | borders |
| Up / down / warn | `#2ee6a8 / #ff5b6e / #ffb020` | PnL, risk |
| Display / body / data | Playfair Display / Inter / IBM Plex Mono | headlines / UI / numerals |

Logo: `app/icon.svg` = the PRIMEVEST voxel-P on obsidian (`public/brand/icon.svg` mirrors it). Do not recolor, redraw, or re-set "PRIMEVEST" in a different face — the terminal's lockup rules apply here verbatim.

## Architecture

```
app/
  (marketing)/           Public front door (Header/Ticker/Footer chrome)
    page.tsx             Landing · track-record/ · agents/ · disclosures/ · staff/
  (control)/             Control room — the operator console (BotProvider shell, noindex)
    layout.tsx           Loads record + renders sidebar/bottom-nav shell
    dashboard/           Status card (BOT STATUS, paper badge, equity, P&L, open risk,
                         daily-loss meter, feed heartbeat) · Close-all (typed) · kill switch
    strategies/          Full parameter surface — everything loss-causing is visible and
                         validated; plain-English preview; 3-step activation (live locked)
    positions/           Lightweight-charts candles (Binance klines → CoinGecko fallback),
                         instrument/timeframe tabs, honest blotter of closed fills
    performance/         PF/expectancy/avg W-L, fees, max DD, best/worst, CSV export
    risk/                Daily-loss allowance meter (80% warn marker), active rules,
                         triggered ledger, kill-switch history
    alerts/              Tiered action/critical/warning/info with what/why/next steps
    settings/            API connections with live probes, notification switches,
                         permissions matrix, danger zone (typed RESET)
    audit-log/           Merged seed+runtime JSONL, PB- refs, force-dynamic
  api/                   market (CoinGecko, 45s cache) · health · activation · audit (GET/POST)
                         strategy (validate+log) · performance.csv · activation
components/
  shell/                 ControlShell (sidebar, mobile bottom bar, kill switch, halted
                         banner, theme toggle) · bot-context (status, heartbeat, audit)
  control/               ConfirmDialog (typed friction + progress) · ContextRail · PriceChart
lib/                     record.ts (typed snapshot loader) · format.ts (USD) · audit.ts (JSONL)
worker/                  Python engine — agents, consensus coordinator, paper engine,
                         fees, partial take-profits, trailing stop, JSONL decision log
data/                    track-record.json · decisions.sample.json · audit.seed.jsonl
                         (runtime audit.jsonl is gitignored)
render.yaml              Render blueprint: web service now; worker cron scaffolded (Phase 2)
```

### Control room (operator console)

- **Three-zone desktop** — sidebar (fixed nav, equity + session P&L + one-click pause/resume + **pinned kill switch**) | content | context rail (live quotes, feed health, alerts) on Dashboard/Performance/Risk only. **Mobile**: monitoring + emergency control only — bottom bar (Dashboard/Positions/Orders/Alerts/Settings), ≥44px targets, no dense tables.
- **Dark default, light optional** — every color flows through CSS vars; `[data-theme='light']` re-declares them; toggle pinned in the sidebar footer (persisted in `localStorage`).
- **Friction ladder** — Pause = 1 click; Close all = type `CLOSE ALL`; Kill switch = type `KILL SWITCH` (halts entries, never unwinds, sidebar-pinned); risk-limit changes confirm + audit; every state change is logged with a `PB-` reference.
- **Honesty** — all figures are the seeded paper run (`data/track-record.json`, seed 42: $500.00 → $784.61, +56.92%, 5W/2L, max DD 1.48%), labeled paper everywhere; empty states are real (book is flat).
- **Live mode does not exist** in this build — the activation wizard's final step is disabled by policy; paper activation is one click.

Worker and web are deliberately decoupled: the worker produces an audit-grade JSON artifact; the web renders it. In Phase 2 both read/write the shared Postgres (schema included), with the bot worker as a separate Render service.

## Honesty rules (enforced in review)

1. No invented numbers anywhere — the UI shows `data/track-record.json` or an empty state.
2. Paper badges and disclaimers on every surface carrying a number.
3. Losing runs are published alongside winners (seed sweep) as soon as they exist.
4. No guaranteed-return language, no "risk-free", no "passive income" copy, ever.
5. Real-money activation cannot ship without: counsel sign-off, desk SOP, tested kill switch, dual-control settlement, and explicit per-client risk acceptance recorded in the DB.

## Deployment (Render)

1. Push to `leephil1907-lab/tradingbit`.
2. Render → New → Blueprint → select repo → `render.yaml` provisions `primevest-trading-bot` (health check `/api/health`).
3. Set `NEXT_PUBLIC_PRIMEVEST_URL` (defaults to the live terminal URL) — the terminal should link this app from its nav ("Trading Bot").
4. Phase 2: uncomment the cron block, add a `DATABASE_URL` (Render Postgres), wire Prisma.

## Security

No secrets in the repo (`.env.example` holds placeholders). The worker needs no keys for paper mode. GMGN/RPC/Solana keys arrive only in Phase 2, via Render env vars, least-privilege DB role. Report issues privately to the PRIMEVEST desk, not via public issues.

## License

© 2026 PRIMEVEST. All rights reserved. Proprietary and confidential. Not open source.
