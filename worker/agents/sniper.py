"""SniperAgent — clean new-launch detection (pump.fun / LaunchLab style filters).

Local filters: liquidity locked, dev hold < 5%, bundled supply < 15%, age < 90s.
Optional remote cross-check: pumpdata.fun community check endpoint for the mint —
tokens flagged 'skip', serial launchers, heavy curve-at-launch concentration, etc.
are vetoed. Network failures degrade gracefully to local filters only.
"""
import asyncio
from typing import Any, Dict, List, Optional

import aiohttp

from .base import BaseAgent, Signal, utcnow

PUMPDATA_URL = "https://pumpdata.fun/free/check/{mint}.json"


class SniperAgent(BaseAgent):
    name = "sniper"

    def __init__(self, max_dev_hold_pct: float = 5.0,
                 max_bundled_pct: float = 15.0,
                 max_age_seconds: int = 90,
                 remote_check: bool = True,
                 http_timeout: float = 1.5):
        self.max_dev_hold_pct = max_dev_hold_pct
        self.max_bundled_pct = max_bundled_pct
        self.max_age_seconds = max_age_seconds
        self.remote_check = remote_check
        self.http_timeout = http_timeout
        self._check_cache: Dict[str, Optional[dict]] = {}

    async def _pumpdata_check(self, mint: str) -> Optional[dict]:
        if mint in self._check_cache:
            return self._check_cache[mint]
        verdict: Optional[dict] = None
        try:
            timeout = aiohttp.ClientTimeout(total=self.http_timeout)
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.get(PUMPDATA_URL.format(mint=mint)) as resp:
                    if resp.status == 200:
                        verdict = await resp.json(content_type=None)
        except Exception:
            verdict = None  # fail-open on network: local filters still apply
        self._check_cache[mint] = verdict
        return verdict

    @staticmethod
    def _remote_verdict_ok(verdict: Optional[dict]) -> bool:
        """Return False only when the remote check clearly flags the mint as skip/avoid."""
        if not verdict or not isinstance(verdict, dict):
            return True  # unknown -> don't block on network/schema failure
        for key in ("skip", "should_skip", "flagged"):
            if verdict.get(key) is True:
                return False
        for key in ("verdict", "result", "status", "action", "recommendation"):
            if str(verdict.get(key, "")).lower() in {"skip", "avoid", "flag", "rug", "unsafe", "bad"}:
                return False
        return True

    async def evaluate(self, market_state: Dict[str, Any]) -> Optional[List[Signal]]:
        launches: List[Dict[str, Any]] = market_state.get("new_launches", []) or []
        signals: List[Signal] = []
        for t in launches:
            if not t.get("liquidity_locked", False):
                continue
            if (t.get("dev_hold_pct", 100) or 100) >= self.max_dev_hold_pct:
                continue
            if (t.get("bundled_supply_pct", 100) or 100) >= self.max_bundled_pct:
                continue
            if (t.get("age_seconds", 9999) or 9999) >= self.max_age_seconds:
                continue
            if t.get("serial_launcher", False) or t.get("curve_bought_at_launch", False):
                continue
            mint = t.get("address", "")
            # Remote check only for pump.fun-style mints (they end in "pump");
            # skip it for synthetic/mock addresses so we don't spam the free API.
            if (self.remote_check and t.get("chain", "sol") == "sol"
                    and mint and mint.endswith("pump")):
                verdict = await self._pumpdata_check(mint)
                if not self._remote_verdict_ok(verdict):
                    continue
            signals.append(Signal(
                agent=self.name,
                token=mint,
                chain=t.get("chain", "sol"),
                side="buy",
                strength=0.9,
                reason=("Clean launch: liq locked, low dev, low bundle, "
                        f"age {t.get('age_seconds', '?')}s"),
                meta=t,
                ts=utcnow(),
            ))
        return signals or None
