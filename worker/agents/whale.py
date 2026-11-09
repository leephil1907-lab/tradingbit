"""WhaleAgent — smart-money confluence (GMGN smart-money / KOL tracking style).

Emits a buy when >= min_buyers tracked wallets bought the same token.
"""
from typing import Any, Dict, Optional

from .base import BaseAgent, Signal, utcnow


class WhaleAgent(BaseAgent):
    name = "whale"

    def __init__(self, min_buyers: int = 3):
        self.min_buyers = min_buyers

    async def evaluate(self, market_state: Dict[str, Any]) -> Optional[Signal]:
        smart_buys = market_state.get("smart_money_buys", {}) or {}
        best: Optional[Signal] = None
        for token, buyers in smart_buys.items():
            if not isinstance(buyers, list) or len(buyers) < self.min_buyers:
                continue
            chain = buyers[0].get("chain", "sol") if buyers else "sol"
            sig = Signal(
                agent=self.name,
                token=token,
                chain=chain,
                side="buy",
                strength=min(0.95, 0.6 + 0.1 * len(buyers)),
                reason=f"{len(buyers)} tracked smart wallets bought",
                meta={"buyers": buyers},
                ts=utcnow(),
            )
            if best is None or sig.strength > best.strength:
                best = sig
        return best
