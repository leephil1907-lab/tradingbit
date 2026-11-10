# TradingBit production implementation programme

This programme extends the existing five-agent TradingBit system. It is deliberately incremental: each stage must be testable and observable before the next stage depends on it. The PrimeVest visual system remains the product design standard; financial state and execution permissions remain server-side concerns.

## Current verified baseline

- Existing Python multi-agent coordinator and paper engine.
- Existing DexScreener hybrid feed and CoinGecko market overview route.
- Existing Prisma schema is currently a planning artifact; the web and worker runtime do not yet persist trading state through it.
- Existing decision logger writes JSONL locally; local service files are not a durable shared database.
- Existing market overview route previously returned hardcoded static marks with `ok: true` when CoinGecko failed. This has been changed to return HTTP 503, `ok: false`, and no quote rows when the provider is unavailable. The ticker no longer substitutes hardcoded prices.
- The control-room session selector offers Demo and read-only Live Market. Live order execution is not implemented.
- The paper engine now has deterministic accounting tests in `worker/tests/test_paper_engine.py`.

## Stage 1 — Durable PostgreSQL persistence

### Target
Use managed PostgreSQL as the system of record. The Next.js control room and Python worker must read/write the same durable records; neither local JSONL files nor checked-in JSON snapshots may be treated as authoritative trading state.

### Required entities
- Users / account ownership (integrate with a verified identity provider before multi-user trading data is exposed).
- Bot instances and immutable session environment: DEMO, SHADOW, LIVE.
- Account balances and append-only ledger entries.
- Orders, fills, positions, and position lifecycle events.
- Agent decisions, risk decisions, strategy versions and backtest runs.
- Market-data source, venue, symbol, event timestamp, ingestion timestamp and freshness metadata.
- Audit events with actor, action, target, correlation ID and immutable timestamp.

### Integrity rules
- Persist money and quantities using PostgreSQL NUMERIC/Prisma Decimal, never JavaScript floating-point as the accounting source of truth.
- Use transactions for balance/ledger/order/fill/position mutations.
- Use unique idempotency keys for order intents and external venue order IDs.
- Enforce session environment and account ownership in database constraints and server-side query filters.
- Never use browser local storage as an authorization control.
- Keep migrations versioned and tested against a disposable PostgreSQL database before production.
- Configure managed backups and document restore verification before storing production account state.

### Exit criteria
- Restarting either service does not lose balances, fills, decisions or positions.
- Concurrent worker processing cannot double-apply an order/fill.
- Demo and live account rows are isolated at the data-access layer.
- Migration and rollback/recovery procedure is documented and tested.

## Stage 2 — Genuine live market feeds

### Target
Separate public market-data ingestion from execution connectivity. Use provider adapters with explicit source attribution and freshness checks.

### Feed contract
Every quote/tick must include provider, venue, instrument, source timestamp, received timestamp, sequence where available, bid, ask, last, volume, and status. Reject malformed, negative, out-of-order or stale data. A provider outage must show unavailable/degraded state; never fabricate a price or silently label a cached value live.

### Initial coverage
- CoinGecko for broad reference spot quotes and market overview (not an execution price).
- DexScreener for DEX pair discovery, liquidity and token marks.
- Exchange WebSocket adapters for venue-specific bid/ask, trades and depth where the product needs executable CEX market data.
- A dedicated Solana launch / wallet event source only after its protocol, limits and reliability have been validated.

### Exit criteria
- UI shows provider and last-update age.
- Feed health and stale-feed rejection are tested.
- No mock feed data is mixed into live strategy decisions unless an explicitly selected test harness is active.
- Public indicative marks are not treated as executable bid/ask prices.

## Stage 3 — Functional demo execution

- Use the existing PaperEngine as the accounting core, with durable state in PostgreSQL.
- Model bid/ask spread, configurable fees, slippage, partial fills, minimum order sizes, tick/lot sizes, and insufficient liquidity.
- Make order submission idempotent and record accepted/rejected/partially-filled/filled/cancelled states.
- Ensure close-all actually closes open demo positions using the latest valid marks and records each fill.
- Keep a visible DEMO label on every order, position, P&L and export.
- Add deterministic unit and integration tests for fees, cost basis, partial exits, stop-loss, kill switch, stale marks, restart recovery and duplicate requests.

## Stage 4 — Strategy research and backtesting

- Version strategies and persist their parameters and code/config hash.
- Replay historical OHLCV/trade/order-book data with point-in-time data boundaries.
- Model spread, fees, slippage, latency and partial fills; avoid look-ahead and survivorship bias.
- Report return, realized/unrealized P&L, max drawdown, Sharpe/Sortino where statistically meaningful, win/loss distribution, exposure, turnover and benchmark comparison.
- Use HFTBacktest only for suitable event/order-book datasets and verify its assumptions against the target venue.
- Keep backtest, demo-forward-test and live results in separate namespaces.

## Stage 5 — Isolated live exchange execution

Live execution is a separate release, not a toggle on the demo engine.

- Implement venue adapters behind a narrow execution interface.
- Use separate encrypted credentials per user/account/venue, least-privilege API scopes, secret redaction, rotation and revocation.
- Enforce server-side account ownership and LIVE-specific permissions on every operation.
- Require explicit live enablement and confirmation, independent of session selection.
- Apply pre-trade risk checks, notional/position/daily-loss caps, stale-feed checks, circuit breakers and server-side kill switch.
- Use idempotent client order IDs, exchange reconciliation and robust retry handling.
- Test only against exchange sandbox/testnet first; failure-inject timeouts, duplicate requests, partial fills, rejected orders, disconnects and reconciliation mismatches.
- Do not expose withdrawal permissions or store user seed phrases/private wallet keys.

## Deployment and operational gates

- Managed PostgreSQL is not yet provisioned or connected. Do not invent a database URL or claim persistence until the actual service and secret are configured.
- Render's internal database URL should be used for services in the same Render region/workspace; external access requires TLS. Review backup/restore and plan limits before provisioning.
- Keep web and worker deployment health separate. The worker must have a durable restart policy and observable heartbeat.
- CI must run Next.js build, Python syntax checks, unit tests, migration validation and integration tests where service containers are available.
- No merge or live rollout until the checks are green and the runtime flows are exercised.

## Current blockers

1. A managed PostgreSQL instance and its secret connection string are not available in the repository configuration. Provisioning a managed database may incur charges and needs an explicit infrastructure decision.
2. The current repository has no configured user authentication / account identity layer. Production multi-user order and portfolio persistence must wait for this.
3. The current worker feed is a hybrid of live DEX discovery and synthetic mock regimes. It must be split into explicit live and deterministic test modes before any live signal can authorize orders.
4. Live venue credentials and exchange account ownership have not been configured; live execution remains disabled.
