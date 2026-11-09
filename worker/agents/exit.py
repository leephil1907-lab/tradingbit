"""ExitAgent — full exit management.

Rules (in priority order):
  1. Hard stop-loss          -> sell 100% of remaining qty
  2. Partial at 2x           -> sell PARTIAL_AT_2X (default 40%) of current qty
  3. Partial at 3x           -> sell PARTIAL_AT_3X (default 30%) of current qty
  4. Trailing stop           -> sell 100% of remaining qty; armed after price >= 1.5x entry
                                or after the first partial was taken; triggers when price
                                falls TRAIL_PCT% below the running peak.

partials_taken is incremented by the coordinator when it executes the sell,
so each partial level fires at most once per position.
"""
from typing import Any, Dict, List, Optional

from .base import BaseAgent, Signal, utcnow


class ExitAgent(BaseAgent):
    name = "exit"

    def __init__(self, paper_engine,
                 take_profit_2x: float = 2.0,
                 take_profit_3x: float = 3.0,
                 partial_at_2x: float = 0.40,
                 partial_at_3x: float = 0.30,
                 trail_pct: float = 8.0,
                 trail_arm_mult: float = 1.5):
        self.engine = paper_engine
        self.take_profit_2x = take_profit_2x
        self.take_profit_3x = take_profit_3x
        self.partial_at_2x = partial_at_2x
        self.partial_at_3x = partial_at_3x
        self.trail_pct = trail_pct
        self.trail_arm_mult = trail_arm_mult

    def _sell(self, pos, chain: str, fraction: float, strength: float,
              reason: str, meta: Dict[str, Any]) -> Signal:
        m = dict(meta)
        m["fraction"] = fraction
        m["position_id"] = pos.id
        return Signal(
            agent=self.name, token=pos.token, chain=chain,
            side="sell", strength=strength, reason=reason, meta=m, ts=utcnow(),
        )

    async def evaluate(self, market_state: Dict[str, Any]) -> Optional[List[Signal]]:
        prices = market_state.get("prices", {}) or {}
        signals: List[Signal] = []
        for pos in list(self.engine.positions.values()):
            current = prices.get(pos.token, pos.entry_price)
            if not current or current <= 0:
                continue
            pnl_pct = (current / pos.entry_price - 1.0) * 100.0

            # 1) Hard stop-loss
            if pnl_pct <= self.engine.stop_loss_pct:
                signals.append(self._sell(
                    pos, pos.chain, 1.0, 1.0,
                    f"Stop loss hit ({pnl_pct:.1f}%)",
                    {"pnl_pct": pnl_pct, "exit_kind": "stop_loss"},
                ))
                continue

            # 2) Partial at 2x
            if pos.partials_taken < 1 and current >= pos.entry_price * self.take_profit_2x:
                signals.append(self._sell(
                    pos, pos.chain, self.partial_at_2x, 0.9,
                    f"Partial take-profit at {self.take_profit_2x:.1f}x (+{pnl_pct:.1f}%)",
                    {"pnl_pct": pnl_pct, "exit_kind": "partial_2x", "partial_level": 1},
                ))
                continue  # one exit action per position per tick

            # 3) Partial at 3x
            if pos.partials_taken < 2 and current >= pos.entry_price * self.take_profit_3x:
                signals.append(self._sell(
                    pos, pos.chain, self.partial_at_3x, 0.9,
                    f"Partial take-profit at {self.take_profit_3x:.1f}x (+{pnl_pct:.1f}%)",
                    {"pnl_pct": pnl_pct, "exit_kind": "partial_3x", "partial_level": 2},
                ))
                continue

            # 4) Trailing stop (peak tracked/updated by the coordinator each tick)
            armed = pos.partials_taken >= 1 or pos.peak_price >= pos.entry_price * self.trail_arm_mult
            if armed and pos.peak_price > 0:
                drawdown_pct = (1.0 - current / pos.peak_price) * 100.0
                if drawdown_pct >= self.trail_pct:
                    signals.append(self._sell(
                        pos, pos.chain, 1.0, 0.95,
                        f"Trailing stop: {drawdown_pct:.1f}% off peak ({pnl_pct:.1f}% PnL)",
                        {"pnl_pct": pnl_pct, "exit_kind": "trailing_stop",
                         "drawdown_pct": drawdown_pct},
                    ))
        return signals or None
