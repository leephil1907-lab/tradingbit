"""ShieldAgent — hard risk limits. Emits side='block' when limits would be violated.

Coordinator treats any 'block' signal as a veto on opening new positions this tick
(exits are still processed).
"""
from typing import Any, Dict, Optional

from .base import BaseAgent, Signal, utcnow


class ShieldAgent(BaseAgent):
    name = "shield"

    def __init__(self, paper_engine, min_cash_buffer_usd: float = 10.0):
        self.engine = paper_engine
        self.min_cash_buffer_usd = min_cash_buffer_usd

    async def evaluate(self, market_state: Dict[str, Any]) -> Optional[Signal]:
        open_count = len(self.engine.positions)
        if open_count >= self.engine.max_open:
            return Signal(
                agent=self.name, token="*", chain="*", side="block",
                strength=1.0, reason=f"Max open positions reached ({open_count})",
                meta={"open_count": open_count}, ts=utcnow(),
            )
        if self.engine.balance < self.min_cash_buffer_usd:
            return Signal(
                agent=self.name, token="*", chain="*", side="block",
                strength=1.0,
                reason=f"Cash buffer too low (${self.engine.balance:.2f} < ${self.min_cash_buffer_usd:.2f})",
                meta={"balance": self.engine.balance}, ts=utcnow(),
            )
        return None
