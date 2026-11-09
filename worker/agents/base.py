from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Union


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


@dataclass
class Signal:
    agent: str
    token: str
    chain: str
    side: str              # "buy" | "sell" | "hold" | "block"
    strength: float        # 0-1
    reason: str
    meta: Dict[str, Any] = field(default_factory=dict)
    ts: datetime = field(default_factory=utcnow)


class BaseAgent(ABC):
    name: str = "base"

    @abstractmethod
    async def evaluate(self, market_state: Dict[str, Any]) -> Optional[Union[Signal, List[Signal]]]:
        """Return a Signal, a list of Signals, or None."""
        ...
