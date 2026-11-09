"""HybridFeed — mock simulator core + optional LIVE DexScreener trending data.

DexScreener needs no API key:
  GET https://api.dexscreener.com/token-boosts/top/v1          (top boosted tokens)
  GET https://api.dexscreener.com/token-profiles/latest/v1     (latest token profiles)
  GET https://api.dexscreener.com/latest/dex/tokens/{csv}      (up to 30 addrs per call)

Live additions appear in state['dex_trending'] (Scout prefers them) and their
mark prices are merged into state['prices']. All network failures fall back to
mock-only data and are surfaced via state['feed_error'] — the sim never crashes
because the network blinked.

Rate limits: DexScreener allows generous but finite public throughput; we refresh
at most every DEX_REFRESH_SECONDS (default 20s) regardless of tick rate.

For live NEW-LAUNCH detection (pump.fun bonding-curve creates) you need a
websocket source — e.g. PumpPortal (wss://pumpportal.fun/api/data) or a private
Geyser feed — see README "Going live". This module intentionally does not
stream launches over HTTP.
"""
import asyncio
import time
from typing import Any, Dict, List, Optional

import aiohttp

from .mock_feed import MockMarketFeed

BOOSTS_URL = "https://api.dexscreener.com/token-boosts/top/v1"
PROFILES_URL = "https://api.dexscreener.com/token-profiles/latest/v1"
TOKENS_URL = "https://api.dexscreener.com/latest/dex/tokens/{csv}"


class HybridFeed:
    def __init__(self, live: bool = True, seed: Optional[int] = None,
                 refresh_seconds: float = 20.0, max_tokens: int = 25,
                 timeout_seconds: float = 8.0):
        self.live = live
        self.mock = MockMarketFeed(seed=seed)
        self.refresh_seconds = refresh_seconds
        self.max_tokens = max_tokens
        self.timeout = aiohttp.ClientTimeout(total=timeout_seconds)
        self._dex_trending: List[Dict[str, Any]] = []
        self._dex_prices: Dict[str, float] = {}
        self._last_fetch = 0.0
        self.last_error: Optional[str] = None
        self._fetch_count = 0

    async def _get_json(self, session: aiohttp.ClientSession, url: str):
        async with session.get(url) as resp:
            resp.raise_for_status()
            return await resp.json(content_type=None)

    async def _refresh_dex(self) -> None:
        try:
            async with aiohttp.ClientSession(timeout=self.timeout) as session:
                boosts, profiles = await asyncio.gather(
                    self._get_json(session, BOOSTS_URL),
                    self._get_json(session, PROFILES_URL),
                )
                addrs: List[str] = []
                seen = set()
                for item in (boosts or []) + (profiles or []):
                    addr = item.get("tokenAddress")
                    chain = item.get("chainId")
                    if not addr or chain not in {"solana", "base", "bsc", "ethereum"}:
                        continue
                    if addr in seen:
                        continue
                    seen.add(addr)
                    addrs.append(addr)
                    if len(addrs) >= self.max_tokens:
                        break
                if not addrs:
                    self.last_error = "dexscreener: no boosted/profiled tokens returned"
                    return
                dex_trending: List[Dict[str, Any]] = []
                dex_prices: Dict[str, float] = {}
                # token-pairs endpoint accepts up to 30 comma-separated addresses
                for i in range(0, len(addrs), 30):
                    chunk = ",".join(addrs[i:i + 30])
                    data = await self._get_json(session, TOKENS_URL.format(csv=chunk))
                    best_by_token: Dict[str, Dict[str, Any]] = {}
                    for pair in data.get("pairs") or []:
                        base = (pair.get("baseToken") or {}).get("address")
                        if not base:
                            continue
                        liq = (pair.get("liquidity") or {}).get("usd") or 0.0
                        cur = best_by_token.get(base)
                        if cur is None or liq > (cur.get("liquidity") or {}).get("usd", 0.0):
                            best_by_token[base] = pair
                    for base, pair in best_by_token.items():
                        try:
                            price = float(pair.get("priceUsd") or 0.0)
                        except (TypeError, ValueError):
                            price = 0.0
                        if price <= 0:
                            continue
                        vol = (pair.get("volume") or {})
                        chg = (pair.get("priceChange") or {})
                        chain = pair.get("chainId", "solana")
                        chain = {"solana": "sol", "ethereum": "eth"}.get(chain, chain)
                        entry = {
                            "address": base,
                            "symbol": (pair.get("baseToken") or {}).get("symbol", ""),
                            "chain": chain,
                            "price": price,
                            "price_change_5m": float(chg.get("m5") or 0.0),
                            "price_change_1h": float(chg.get("h1") or 0.0),
                            "volume_m5": float(vol.get("m5") or 0.0),
                            "liquidity_usd": float((pair.get("liquidity") or {}).get("usd") or 0.0),
                            "dex": pair.get("dexId", ""),
                            "source": "dexscreener",
                        }
                        dex_trending.append(entry)
                        dex_prices[base] = price
                self._dex_trending = dex_trending
                self._dex_prices = dex_prices
                self._fetch_count += 1
                self.last_error = None
        except Exception as exc:
            self.last_error = f"dexscreener: {exc!r}"
            # keep last-good cache; if we never had data, mock still drives the sim

    async def next(self) -> Dict[str, Any]:
        state = await self.mock.next()
        if self.live:
            now = time.monotonic()
            if now - self._last_fetch >= self.refresh_seconds:
                await self._refresh_dex()
                self._last_fetch = now
            if self._dex_trending:
                state["dex_trending"] = list(self._dex_trending)
                merged = dict(state["prices"])
                merged.update(self._dex_prices)
                state["prices"] = merged
        state["live_dex"] = self.live
        state["feed_error"] = self.last_error
        return state
