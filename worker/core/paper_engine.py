"""Paper trading engine — virtual balance, positions, fees, partial fills.

No real keys, no real orders. Fills are simulated at the mark price found in
market_state['prices']. A per-side fee (POSITION_FEE_PCT, default 0.3%) is
applied so paper results aren't flattering.

Cost-basis model: `cost_remaining` tracks the unamortized portion of the entry
cash outlay. Partial sells consume a proportional slice, so realized PnL per
fill is exact. A position's recorded PnL in `closed` is its lifetime total
(entry -> all partials -> final exit), which keeps the recap stats honest.
"""
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


@dataclass
class Position:
    id: str
    token: str
    chain: str
    entry_price: float
    size_usd: float          # original cash outlay at entry (display)
    qty: float               # remaining qty
    opened_at: datetime
    partials_taken: int = 0
    peak_price: float = 0.0  # updated by coordinator each tick
    cost_remaining: float = 0.0
    realized_pnl: float = 0.0

    def __post_init__(self):
        if not self.peak_price:
            self.peak_price = self.entry_price
        if not self.cost_remaining:
            self.cost_remaining = self.size_usd


class PaperEngine:
    def __init__(self, initial: float = 500.0, max_pos: float = 50.0,
                 max_open: int = 10, sl: float = -6.0, fee_pct: float = 0.3):
        self.initial_balance = initial
        self.balance = initial
        self.positions: Dict[str, Position] = {}
        self.closed: List[Dict[str, Any]] = []   # fully closed positions (lifetime PnL)
        self.fills: List[Dict[str, Any]] = []    # every sell fill, partial or full
        self.max_pos_usd = max_pos
        self.max_open = max_open
        self.stop_loss_pct = sl
        self.fee_pct = fee_pct
        self.total_pnl = 0.0
        self.total_fees = 0.0

    # ---------- valuation ----------
    def mark_to_market(self, prices: Dict[str, float]) -> float:
        value = sum(p.qty * prices.get(p.token, p.entry_price) for p in self.positions.values())
        self._equity_cache = self.balance + value
        return self._equity_cache

    @property
    def equity(self) -> float:
        return getattr(self, "_equity_cache",
                       self.balance + sum(p.qty * p.entry_price for p in self.positions.values()))

    def update_peaks(self, prices: Dict[str, float]) -> None:
        for p in self.positions.values():
            px = prices.get(p.token)
            if px and px > p.peak_price:
                p.peak_price = px

    # ---------- opening ----------
    def can_open(self, size_usd: float) -> bool:
        return (len(self.positions) < self.max_open
                and 0 < size_usd <= self.max_pos_usd + 1e-9
                and size_usd <= self.balance + 1e-9)

    def open(self, token: str, chain: str, price: float, size_usd: float) -> Optional[Position]:
        if price <= 0:
            return None
        size_usd = min(size_usd, self.max_pos_usd, self.balance)
        if not self.can_open(size_usd):
            return None
        fee = size_usd * self.fee_pct / 100.0
        qty = (size_usd - fee) / price
        if qty <= 0:
            return None
        pos = Position(
            id=str(uuid.uuid4())[:8], token=token, chain=chain,
            entry_price=price, size_usd=size_usd, qty=qty, opened_at=utcnow(),
        )
        self.positions[pos.id] = pos
        self.balance -= size_usd
        self.total_fees += fee
        return pos

    # ---------- closing ----------
    def partial_close(self, pos_id: str, fraction: float, price: float,
                      reason: str = "closed",
                      partial_level: Optional[int] = None) -> Optional[float]:
        pos = self.positions.get(pos_id)
        if pos is None or price <= 0:
            return None
        fraction = min(max(fraction, 0.0), 1.0)
        sell_qty = pos.qty * fraction
        gross = sell_qty * price
        fee = gross * self.fee_pct / 100.0
        proceeds = gross - fee
        alloc_cost = pos.cost_remaining * fraction
        pnl = proceeds - alloc_cost

        pos.qty -= sell_qty
        pos.cost_remaining -= alloc_cost
        pos.realized_pnl += pnl
        if partial_level is not None:
            pos.partials_taken = max(pos.partials_taken, partial_level)

        self.balance += proceeds
        self.total_pnl += pnl
        self.total_fees += fee

        fill = {
            "position_id": pos.id, "token": pos.token, "chain": pos.chain,
            "qty": sell_qty, "price": price, "proceeds": proceeds,
            "fee": fee, "pnl": pnl, "fraction": fraction,
            "partial": fraction < 1.0, "reason": reason,
            "ts": utcnow().isoformat(),
        }
        self.fills.append(fill)

        if fraction >= 1.0 - 1e-12 or pos.qty <= 1e-12:
            self.positions.pop(pos_id, None)
            self.closed.append({
                "id": pos.id, "token": pos.token, "chain": pos.chain,
                "entry_price": pos.entry_price, "exit_price": price,
                "size_usd": pos.size_usd, "pnl": pos.realized_pnl,
                "partials_taken": pos.partials_taken, "reason": reason,
                "opened_at": pos.opened_at.isoformat(),
                "closed_at": utcnow().isoformat(),
            })
        return pnl

    def close(self, pos_id: str, price: float, reason: str = "closed") -> Optional[float]:
        return self.partial_close(pos_id, 1.0, price, reason=reason)
