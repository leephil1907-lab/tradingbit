# PrimeVest Atlas session model

## Current release contract

PrimeVest Atlas exposes two user-selectable sessions in the PrimeVest control shell:

- **Demo**: the existing virtual paper-trading workflow. Orders/fills are simulated by the Python paper engine and must be labeled as simulated.
- **Live market**: live market-data monitoring only. It is deliberately read-only in this release. Selecting it does not create an exchange session, authenticate an exchange account, expose credentials, or enable order placement.

The selected view is persisted in browser local storage and a session-change audit event is submitted to the existing audit endpoint. This preference is not an authorization or execution control.

## Hard separation requirements before live execution

Do not implement live order placement by changing a UI flag. A production live-trading release requires all of the following:

1. A server-side venue adapter with an allowlisted set of supported exchanges and instruments.
2. Encrypted credential storage, least-privilege API scopes, secret redaction, and credential rotation/revocation.
3. Authenticated user ownership and authorization checks on every order and account endpoint.
4. Separate persistent account, order, fill, position, and balance records for demo and live environments.
5. Idempotent order submission, exchange client-order IDs, retry policy, and reconciliation against venue reports.
6. Independent pre-trade risk checks, per-account limits, daily loss limits, stale-feed rejection, and server-side kill switch.
7. Explicit user consent and a deliberate live-order confirmation step.
8. Integration tests against venue sandbox/testnet, failure-injection tests, and a reviewed operational runbook.

Never reuse demo balances, simulated fills, or demo performance records in a live portfolio or public live track record. A session selector is a display preference only and must never grant execution permission.

## Release verification checklist

- [ ] Demo mode continues to use only the virtual paper engine.
- [ ] Live market mode displays a persistent read-only notice.
- [ ] Live market mode cannot submit, amend, or cancel exchange orders.
- [ ] Session preference survives reload and is scoped to the current browser profile.
- [ ] Session changes are audit logged; audit failure is visible to the user.
- [ ] Feed source and timestamp are shown; stale/unavailable data is not labeled live.
- [ ] No static fallback quote is presented as a live quote.
- [ ] Demo and live records are isolated at the database and API layers before live execution is introduced.
