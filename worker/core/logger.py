"""DecisionLogger — appends every decision to a JSONL audit log and keeps a
rolling in-memory buffer for the dashboard."""
import json
from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Deque, Dict, List


class DecisionLogger:
    def __init__(self, log_file: str = "logs/decisions.jsonl", buffer_size: int = 200):
        self.log_file = Path(log_file)
        self.log_file.parent.mkdir(parents=True, exist_ok=True)
        self.buffer: Deque[Dict[str, Any]] = deque(maxlen=buffer_size)
        self.counts: Dict[str, int] = {}

    def log(self, event: str, token: str, reasons: str, size_usd: float = 0.0,
            pnl: float = 0.0, extra: Dict[str, Any] | None = None) -> Dict[str, Any]:
        record = {
            "ts": datetime.now(timezone.utc).isoformat(),
            "event": event,
            "token": token,
            "reasons": reasons,
            "size_usd": round(size_usd, 4),
            "pnl": round(pnl, 4),
        }
        if extra:
            record.update(extra)
        self.buffer.append(record)
        self.counts[event] = self.counts.get(event, 0) + 1
        try:
            with self.log_file.open("a", encoding="utf-8") as fh:
                fh.write(json.dumps(record, default=str) + "\n")
        except OSError:
            # never let logging kill the trading loop
            pass
        return record

    def recent(self, n: int = 12) -> List[Dict[str, Any]]:
        return list(self.buffer)[-n:]
