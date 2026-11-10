# TradingBit session modes

## Demo session

Demo is the currently available execution session. It uses a virtual balance and simulated fills. The interface must label every balance, position, order, P&L figure and performance result as DEMO/PAPER. Live market data may be used as a price input only when its source and freshness are available; it must never turn a simulated fill into a real execution.

Demo records must remain isolated from live records. Resetting a demo book must never affect live balances, orders or positions.

## Live session

The Live session is displayed as setup-required and remains locked in this release. The existing repository has no authenticated exchange order adapter or production order reconciliation path. A live market-data feed is not an execution connection.

Before unlocking live execution, implement and verify all of the following:

1. Authenticated user identity and server-side authorization for each account.
2. Per-user encrypted exchange credentials with least-privilege scopes; withdrawal permissions must not be requested.
3. An exchange adapter with idempotent client order IDs, order state transitions, retries and rate-limit handling.
4. Server-side pre-trade risk validation, per-user exposure caps, daily loss limits, max order size, stale-feed rejection and a global kill switch.
5. Persistent live orders, fills, fees, balances and positions in a transactional database with a migration ledger.
6. Reconciliation against exchange balances, open orders and fills; discrepancies must halt new entries.
7. Separate DEMO and LIVE namespaces/records and explicit confirmation before entering a live session.
8. Integration tests against exchange sandbox/testnet, failure-injection tests and an operational rollback procedure.

## Mode semantics

- DEMO: virtual funds, simulated execution, no external order submission.
- SHADOW: real market data and strategy decisions, no external order submission.
- LIVE_MANUAL: live signals routed for explicit desk/manual execution and independently recorded settlement.
- LIVE_AUTO: only introduce after the controls above are implemented and reviewed. It is not enabled by this UI change.

The session selector is deliberately informational until the backend supports these guarantees. Do not implement a frontend-only toggle that suggests live execution is available.