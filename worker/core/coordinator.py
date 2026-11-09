"""Coordinator — gathers agent signals each tick and acts only on consensus.

Flow per tick:
  1. Update position peaks from latest prices; ingest prices into the engine cache.
  2. Poll every agent (shield/exit first so they always run even if others error).
  3. Any 'block' signal vetoes opening NEW positions this tick (exits still run).
  4. Buys grouped per token; >= MIN_AGREEING_AGENTS distinct agents -> open position
     (skipped for tokens already held).
  5. Sells executed through the engine (partial fills supported via meta['fraction']).
  6. Everything is written to the JSONL decision log.
"""
import asyncio
from typing import Any, Dict, List

from agents.base import Signal


class Coordinator:
    def __init__(self, agents, engine, logger, min_agree: int = 2):
        # shield/exit (if present) evaluated first so limits always apply
        self.agents = sorted(
            agents,
            key=lambda a: {"shield": 0, "exit": 1}.get(getattr(a, "name", ""), 99),
        )
        self.engine = engine
        self.logger = logger
        self.min_agree = min_agree
        self._nc_logged: set = set()  # dedupe identical NO_CONSENSUS lines

    async def _collect(self, market_state: Dict[str, Any]) -> List[Signal]:
        signals: List[Signal] = []
        for agent in self.agents:
            try:
                sig = await agent.evaluate(market_state)
            except Exception as exc:  # a faulty agent must never kill the loop
                self.logger.log("AGENT_ERROR", "*", f"{getattr(agent, 'name', '?')}: {exc!r}")
                continue
            if not sig:
                continue
            signals.extend(sig if isinstance(sig, list) else [sig])
        return signals

    async def tick(self, market_state: Dict[str, Any]) -> Dict[str, Any]:
        prices = market_state.get("prices", {}) or {}
        self.engine.update_peaks(prices)
        self.engine.mark_to_market(prices)

        signals = await self._collect(market_state)

        blocks = [s for s in signals if s.side == "block"]
        blocked = bool(blocks)
        for b in blocks:
            self.logger.log("BLOCK", b.token, b.reason, extra={"agent": b.agent})

        # ---- Exits first (risk reduction is never gated by consensus) ----
        realized = 0.0
        sell_count = 0
        for s in [s for s in signals if s.side == "sell"]:
            pid = s.meta.get("position_id")
            pos = self.engine.positions.get(pid) if pid else None
            if pos is None:  # fallback: match by token
                matches = [p for p in self.engine.positions.values() if p.token == s.token]
                pos = matches[0] if matches else None
                pid = pos.id if pos else None
            if pos is None:
                continue
            price = prices.get(pos.token, pos.entry_price)
            fraction = float(s.meta.get("fraction", 1.0))
            pnl = self.engine.partial_close(
                pos.id, fraction, price, reason=s.reason,
                partial_level=s.meta.get("partial_level"),
            )
            realized += pnl or 0.0
            sell_count += 1
            self.logger.log(
                "SELL" if fraction >= 1.0 else "PARTIAL_SELL",
                pos.token, s.reason, size_usd=pos.size_usd * fraction,
                pnl=pnl or 0.0,
                extra={"agent": s.agent, "chain": pos.chain, "fraction": fraction,
                       "exit_kind": s.meta.get("exit_kind")},
            )

        # ---- Buys with consensus ----
        buy_count = 0
        if not blocked:
            by_token: Dict[str, List[Signal]] = {}
            for s in signals:
                if s.side == "buy":
                    by_token.setdefault(s.token, []).append(s)
            held = {p.token for p in self.engine.positions.values()}
            for token, sigs in by_token.items():
                agents_agreeing = {s.agent for s in sigs}
                if len(agents_agreeing) < self.min_agree:
                    key = (token, tuple(sorted(agents_agreeing)))
                    if key not in self._nc_logged:
                        self._nc_logged.add(key)
                        if len(self._nc_logged) > 500:
                            self._nc_logged.clear()
                        top = ", ".join(f"{s.agent}:{s.strength:.2f}" for s in sigs)
                        self.logger.log("NO_CONSENSUS", token,
                                        f"only {len(agents_agreeing)}/{self.min_agree} agents ({top})")
                    continue
                if token in held:
                    continue
                price = prices.get(token)
                if not price or price <= 0:
                    self.logger.log("SKIP_NO_PRICE", token, "no mark price in feed")
                    continue
                size = min(self.engine.max_pos_usd, self.engine.balance * 0.10)
                pos = self.engine.open(token, sigs[0].chain, price, size)
                if pos is None:
                    self.logger.log("SKIP_LIMIT", token, "engine refused (limits/balance)")
                    continue
                held.add(token)
                buy_count += 1
                reasons = " | ".join(f"{s.agent}:{s.reason}" for s in sigs)
                strength = sum(s.strength for s in sigs) / len(sigs)
                self.logger.log(
                    "BUY", token, reasons, size_usd=pos.size_usd, pnl=0.0,
                    extra={"chain": pos.chain, "price": price,
                           "agents": sorted(agents_agreeing),
                           "avg_strength": round(strength, 2),
                           "position_id": pos.id},
                )

        return {
            "signals": len(signals), "buys": buy_count, "sells": sell_count,
            "blocked": blocked, "realized_pnl": realized,
            "open_positions": len(self.engine.positions),
            "balance": self.engine.balance,
            "equity": self.engine.equity,
        }
