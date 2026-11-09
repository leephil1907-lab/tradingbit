"""ScoutAgent — GMGN-style trending / volume-spike / top-gainer detection.

Prefers live DexScreener data (state['dex_trending']) when the feed provided it,
otherwise falls back to the mock/simulated trending list (state['trending']).
"""
from typing import Any, Dict, List, Optional

from .base import BaseAgent, Signal, utcnow


class ScoutAgent(BaseAgent):
    name = "scout"

    def __init__(self, min_liquidity_usd: float = 8_000.0,
                 min_vol_change_5m: float = 180.0,
                 min_live_volume_m5: float = 25_000.0,
                 min_price_change_5m: float = 25.0):
        self.min_liquidity_usd = min_liquidity_usd
        self.min_vol_change_5m = min_vol_change_5m
        self.min_live_volume_m5 = min_live_volume_m5
        self.min_price_change_5m = min_price_change_5m

    async def evaluate(self, market_state: Dict[str, Any]) -> Optional[Signal]:
        # Evaluate live DexScreener candidates AND mock/simulated candidates:
        # live lists alone are sparse, so a hard "prefer live" rule starves consensus.
        seen = set()
        candidates: List[Dict[str, Any]] = []
        for t in list(market_state.get("dex_trending") or []) + list(market_state.get("trending") or []):
            key = t.get("address")
            if key and key not in seen:
                seen.add(key)
                candidates.append(t)
        best: Optional[Signal] = None
        for t in candidates:
            liq = t.get("liquidity_usd", 0) or 0
            if liq < self.min_liquidity_usd:
                continue
            price_chg = t.get("price_change_5m", 0) or 0
            if price_chg < self.min_price_change_5m:
                continue
            # Mock feed gives % volume spike; live DexScreener gives absolute $ volume.
            vol_spike = (t.get("vol_change_5m", 0) or 0)
            live_vol = (t.get("volume_m5", 0) or 0)
            is_spike = vol_spike > self.min_vol_change_5m or live_vol > self.min_live_volume_m5
            if not is_spike:
                continue
            strength = min(0.95, 0.5 + max(vol_spike, 0) / 400.0 if vol_spike else 0.7)
            sig = Signal(
                agent=self.name,
                token=t["address"],
                chain=t.get("chain", "sol"),
                side="buy",
                strength=round(strength, 2),
                reason=(f"Volume spike {vol_spike:.0f}% / ${live_vol:,.0f} m5 "
                        f"+ price +{price_chg:.1f}% (liq ${liq:,.0f})"),
                meta=t,
                ts=utcnow(),
            )
            if best is None or sig.strength > best.strength:
                best = sig
        return best
