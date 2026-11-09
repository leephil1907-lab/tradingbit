# TradingBit by PRIMEVEST — Build Plan
**Goal:** standalone, PRIMEVEST-branded AI trading-bot product (memecoin/Solana focus to start), linked from primevest-web.onrender.com, repo: leephil1907-lab/tradingbit (currently empty).

Design source of truth: the live PRIMEVEST site + `primevest-icon.svg` (gold "P" monogram, copied to `primevest-brand/`). No separate design upload was received.

---

## 0. Non-negotiables (read first)

These are not negotiable design choices; the product only ships respecting them:

1. **No fake execution.** If users deposit real money, the bot must not show simulated fills as if they happened. Bot output = **signals + manual desk execution/settlement** (consistent with PRIMEVEST's existing manual-deposit, ledger-provenance model), until a real licensed execution venue is integrated.
2. **No guaranteed-return marketing, no invented track record.** The public track-record page shows *real* paper (later real) fills with fees/slippage assumptions stated. If there is no record yet, the page says so.
3. **Licensing.** PRIMEVEST appears to operate as a brokerage-style terminal with manual deposits. Whether it is actually authorised in the jurisdictions it serves is a legal question for your counsel, not for code. Before real client funds touch the bot: confirm license scope (what activities, which regulators, client-asset rules), disclosures, risk warnings, KYC/AML, and jurisdiction restrictions. If PRIMEVEST is not licensed, the product stays paper-only — full stop.
4. **Risk disclosure acceptance** is required before any "activate bot" action, stored in DB with timestamp/version.
5. **Kill switch**: one ENV/feature-flag (`BOT_EXECUTION_ENABLED=false` by default) halts everything regardless of UI state.

I can build the whole technical platform to the paper/shadow standard today. Real-funds phases additionally gate on the paper track record and your legal confirmation.

---

## 1. What already exists (assets)

**Brand system (extracted from primevest-web.onrender.com + its icon.svg):**
- Backgrounds: `#0a0908` / `#0d0b08` (obsidian), panel `#141a28`–`#0f141f` (blue-obsidian alt), gold-tinted surface `#32291d`
- Gold gradient (mark): `#b8924a → #dfc088 → #f0d9a8`; accent gold `#cfa95f`, dark gold `#8a6a2f`
- Text: `#eef1f6` (primary), `#c9c2b4` (muted), `#9ca3af` (faint)
- Up: `#2ee6a8`/`#2dcf95`/`#a7d43d` · Down: `#ff5b6e`/`#ff6a78` · Warning: `#ffb020`
- Type: **Playfair Display** (display serif), **Inter** (body), **IBM Plex Mono** (data/ledger/numerals)
- Voice: measured, precise ("Precision, in every fill."). Short sentences, no hype.
- Logo: `primevest-icon.svg` (amber/gold gradient voxel-P on `#0a0908` rounded square). Wordmark: "PRIMEVEST" set in serif caps.

**PRIMEVEST platform (vantabrokerage repo — the template to mirror):** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind 3.4 · Prisma 6 · PostgreSQL · Render (web + worker, `render.yaml`) · auth (bcrypt), ledger with provenance, manual deposits, SUPERADMIN staff console, TradingView/CoinGecko/Kraken integrations.

**Bot engine (built & tested in workspace):** `multi_agent_trader/` — Python, 5-agent consensus (scout/whale/sniper/shield/exit), paper engine with fees + partial take-profits + trailing stop, live DexScreener feed, JSONL decision audit log, Docker/systemd. This becomes the bot worker.

**TradingBit repo:** empty — clean slate.

---

## 2. Recommended product shape

**"TradingBit — the PRIMEVEST execution intelligence bot"** — standalone app, PRIMEVEST brand, linked from the terminal's nav ("Bots").

Hybrid architecture (matches PRIMEVEST's web+worker pattern):

```
tradingbit.primevest-web.onrender.com   (Render subdomain / custom domain)

┌─────────────────────────────┐        ┌───────────────────────────────────┐
│ tradingbit-web (Next.js 15) │        │ tradingbit-worker (Python 3.11)   │
│  - public landing           │  SQL   │  - multi-agent strategy engine    │
│  - client dashboard         │◄──────►│  - DexScreener/GMGN feeds         │
│  - track record (public)    │ Prisma │  - PAPER/SHADOW fills             │
│  - deposits (manual, desk)  │        │  - writes decisions + fills to DB │
│  - disclosures & acceptance │        │  - FastAPI / internal API          │
│  - staff console (desk)     │        │  - scheduler + kill switch        │
└─────────────┬───────────────┘        └───────────────────────────────────┘
              │                                   │
        ┌─────┴───────────────────────────────────┴─────┐
        │  PostgreSQL (Render, same instance as          │
        │  PRIMEVEST or a TradingBit schema/database)     │
        └────────────────────────────────────────────────┘
```

Auth: reuse PRIMEVEST identity (shared DB users/session model) so one PRIMEVEST login works on both — or SSO via shared session cookie. Ledger stays the single source of truth for money movement (desk-approved, manual rails — same as terminal).

---

## 3. Pages & design language

**Design language (PRIMEVEST-consistent):** obsidian canvas, gold hairline borders, panel surfaces, gold gradient logo, Playfair Display for hero/serif moments, Plex Mono for all numerals (prices, PnL, timestamps), Inter body/UI. Disclaimers in muted mono, always visible in dashboard footer. No neon casino aesthetics — "private wealth desk", not "casino".

Screens (MVP):
1. **Landing** — hero ("The desk, automated." or similar, non-promissory), what the bot does (agents, consensus), **honest track record module**, risk section, CTA "Practice with a $500 virtual book" + "Onboard (manual review)".
2. **Dashboard** — equity curve, cash vs deployed, open/closed positions, last N agent decisions (live feed), bot status (PAPER badge), fees paid, win rate (all real, from DB).
3. **Agents** — per-agent status cards (scout/whale/sniper/shield/exit) with their latest signals — the differentiating, truthful "how it decided" view.
4. **Track record (public)** — full fills list, fees, slippage assumption, max drawdown, methodology note. Or "Building record — no live claims until <date>".
5. **Activate / deposits** — paper activation instantly; real activation only if eligibility flags + risk-disclosure acceptance + desk review (manual, like PRIMEVEST deposits).
6. **Disclosures & legal** — risk warning, no-guarantee language, ToS, privacy, jurisdiction list (your counsel supplies text).
7. **Staff console** — desk actions: review bot signal → execute manually → record settlement in ledger; feature-flag kill switch; per-client activation approvals.

---

## 4. Data model (Prisma sketch)

```prisma
model TradingBot        { id String @id @default(cuid())  name String  mode BotMode  // PAPER | SHADOW | LIVE_MANUAL
                          config Json  enabled Boolean @default(false)  createdAt DateTime @default(now()) }
enum BotMode            { PAPER SHADOW LIVE_MANUAL }
model BotPosition       { id String @id @default(cuid())  botId String  symbol String  chain String
                          entryPrice Decimal  qty Decimal  costBasis Decimal  partials Int @default(0)
                          peakPrice Decimal  status String  openedAt DateTime @default(now())  closedAt DateTime? }
model BotFill           { id String @id @default(cuid())  positionId String  botId String
                          side String  qty Decimal  price Decimal  fee Decimal  pnl Decimal?
                          reason String  exitKind String?  createdAt DateTime @default(now()) }
model BotDecision       { id String @id @default(cuid())  botId String  ts DateTime @default(now())
                          event String  token String  reasons String  agents String[]  payload Json }
model TrackSnapshot     { id String @id @default(cuid())  botId String  equity Decimal  realizedPnl Decimal  fees Decimal  takenAt DateTime @default(now()) }
model BotActivation     { id String @id @default(cuid())  userId String  botId String  mode BotMode
                          disclosuresVersion String  acceptedAt DateTime @default(now())  approvedByStaffId String?  status String }
model ManualExecution   { id String @id @default(cuid())  activationId String  signalId String?
                          deskStaffId String  executedAt DateTime?  externalRef String?  notes String? }
```
Money movement stays in existing PRIMEVEST ledger tables; bot tables reference it, never shadow it.

---

## 5. Worker ↔ web API

- Python `botd` exposes `GET /healthz`, `GET /status`, `GET /decisions?limit=`, `GET /positions`, `POST /paper/activate` (internal), `POST /kill`.
- Web reads via server components + Prisma directly for DB data (fills/positions/decisions), and via internal HTTP for live bot status. No client-side secrets.
- Simulation clock: paper engine marks-to-market on live DexScreener prices every 5 min; decisions.jsonl → `BotDecision` table (bulk insert + retain file).

---

## 6. Phases (gated)

- **Phase 0 — Scaffold (1–2 days):** repo init from PRIMEVEST skeleton (shared tooling/config), CI (build+typecheck+tests), `render.yaml`, brand tokens as CSS vars from §1, icon in place. *Gate: green build on Render.*
- **Phase 1 — Paper (week 1):** bot runs on live data, $500 virtual book, results persisted. Public track-record page (clearly labeled PAPER). *Gate: 2–4 weeks of real recorded paper results; review.*
- **Phase 2 — Shadow (weeks 3–6):** real-eligible clients onboarded with disclosures; bot produces signals; **desk executes manually** and records settlements; clients see real PnL. *Gate: counsel sign-off + desk SOP + positive (or honest) record.*
- **Phase 3 — Limited live support (later):** per-client caps, full ledger reconciliation, withdrawal cool-off, staff console hardening.
- **Phase 4 — Scale/iterate.**

Success metrics per phase: uptime, audit-log completeness (every fill traceable), drawdown vs limits, zero unexplained ledger deltas, disclosure acceptance rate — **never** "return %" as the headline.

---

## 7. Risks & mitigations

- **Performance mirage (paper ≫ live):** ship fees/slippage sliders in paper config; publish assumptions; no marketing of backtest numbers.
- **Solana feed fragility / MEV:** paper phase reveals; live phase requires private RPC + (for aggressive strategies) Geyser — budget for it.
- **Regulatory:** counsel review before Phase 2; jurisdiction gating; blocked-country list.
- **Brand risk:** bot blow-up damages PRIMEVEST terminal trust — scope bot to small allocations, ring-fence from brokerage cash.
- **Secrets:** GMGN/RPC keys in Render env vars; never in repo; worker uses least-privilege DB role (write bot tables + read ledger only).

---

## 8. What I need from you

1. **Legal basis** (Phase 2+): license name/number/jurisdiction covering client-fund trading or discretionary signals; counsel-approved disclosure text. (Paper phase needs none of this.)
2. **Go-ahead on plan & scope** (and any changes).
3. **GitHub**: connector unavailable in this workspace — you'll `git push` (or connect GitHub later); repo `leephil1907-lab/tradingbit`.
4. **Infra**: Render account access to create `tradingbit-web`, `tradingbit-worker`, Postgres (reuse PRIMEVEST DB w/ separate schema, or new DB). Supabase connector IS available in this workspace if you prefer it.
5. **Secrets**: GMGN API key (optional), Solana RPC URL(s) (Phase 2+), `STAFF`/`ADMIN` seed user, domain/subdomain choice.
6. **Wordmark & assets**: confirm using PRIMEVEST name/logo for TradingBit ("TradingBit — by PRIMEVEST") and where the site should link it.
7. **Copy approvals**: every public page's risk copy, reviewed by you + counsel.

## 9. What I can start immediately (on your go-ahead)

Scaffold the repo in this workspace (Next.js app + design system + Prisma schema + landing + dashboard fed by the paper bot from `multi_agent_trader/`), verify build, and hand you the tree to push to `tradingbit`. Docker/Render config included. Phase 1 data starts accumulating the day the worker first deploys.
