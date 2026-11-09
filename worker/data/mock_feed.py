"""MockMarketFeed — seeded synthetic market for accelerated paper simulation.

Simulates per-tick (5-minute) random walks with distinct regimes:
  flat | pump | dump | rug | moon
Spawned 'moon' launches give the exit agent room to exercise the 2x/3x partials
and the trailing stop instead of only binary win/lose.

Deterministic with --seed. NOT a price predictor; just a training ground.
"""
import random
import string
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


def _addr(rng: random.Random, n: int = 42) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(rng.choice(alphabet) for _ in range(n))


_REGIME_PARAMS = {
    "flat": (0.000, 0.030),
    "pump": (0.055, 0.085),
    "dump": (-0.045, 0.065),
    "rug":  (-0.075, 0.110),
    "moon": (0.075, 0.110),
}


def _weighted(rng, choices):
    total = sum(w for _, w in choices)
    roll = rng.uniform(0, total)
    acc = 0.0
    for name, w in choices:
        acc += w
        if roll <= acc:
            return name
    return choices[-1][0]


class MockMarketFeed:
    def __init__(self, seed: Optional[int] = None):
        self.rng = random.Random(seed)
        self.tick_count = 0
        self.tokens: Dict[str, Dict[str, Any]] = {}
        self._buyers_cache: Dict[str, List[dict]] = {}
        # seed watchlist
        for _ in range(10):
            self._spawn_token(regime=self.rng.choice(["flat", "pump", "dump", "flat"]))

    # ---------- internals ----------
    def _spawn_token(self, regime: str = "flat", is_launch: bool = False) -> Dict[str, Any]:
        rng = self.rng
        addr = _addr(rng)
        chain = rng.choice(["sol", "base", "bsc"]) if not is_launch else "sol"
        tok = {
            "address": addr,
            "symbol": "".join(rng.choice(string.ascii_uppercase) for _ in range(4)),
            "chain": chain,
            "price": round(rng.uniform(2e-6, 4e-3), 10),
            "prev_price": None,
            "liquidity_usd": round(rng.uniform(6_000, 250_000), 2),
            "regime": regime,
            "regime_ticks": 0,
            "regime_limit": rng.randint(8, 40) if regime == "moon" else rng.randint(20, 80),
            "vol_change_5m": 0.0,
            "is_launch": is_launch,
            "launched_tick": self.tick_count if is_launch else None,
        }
        self.tokens[addr] = tok
        return tok

    def _spawn_launch(self) -> Dict[str, Any]:
        """Honest mechanics: the sniper's filters are TOXICITY PREDICTORS.

        Launch "quality" (liq locked / low dev / low bundle / not serial /
        not curve-bought) is rolled first, and price regime is then drawn
        from a quality-conditional distribution. A filter-passing launch is
        still sometimes a rug — filters are informative, not oracles.
        """
        rng = self.rng
        locked = rng.random() < 0.75
        dev_hold = round(rng.choice([rng.uniform(0.5, 4.5), rng.uniform(2, 12)]), 2)
        bundled = round(rng.choice([rng.uniform(2, 14), rng.uniform(10, 35)]), 2)
        serial = rng.random() < 0.20
        curve_buy = rng.random() < 0.25
        quality = ((2 if locked else 0) + (1 if dev_hold < 5.0 else 0)
                   + (1 if bundled < 15.0 else 0)
                   + (0 if serial else 1) + (0 if curve_buy else 1))
        if quality <= 2:
            regime = _weighted(rng, [("rug", 55), ("dump", 25), ("flat", 15), ("pump", 5)])
        elif quality == 3:
            regime = _weighted(rng, [("rug", 35), ("dump", 30), ("flat", 20), ("pump", 15)])
        elif quality == 4:
            regime = _weighted(rng, [("rug", 15), ("dump", 25), ("flat", 30), ("pump", 25), ("moon", 5)])
        else:
            regime = _weighted(rng, [("moon", 25), ("pump", 25), ("flat", 30), ("dump", 15), ("rug", 5)])
        tok = self._spawn_token(regime=regime, is_launch=True)
        tok["liquidity_usd"] = round(rng.uniform(4_000, 80_000), 2)
        tok["launch_attrs"] = {
            "liquidity_locked": locked,
            "dev_hold_pct": dev_hold,
            "bundled_supply_pct": bundled,
            "serial_launcher": serial,
            "curve_bought_at_launch": curve_buy,
        }
        return tok

    def _step_token(self, tok: Dict[str, Any]) -> None:
        rng = self.rng
        tok["prev_price"] = tok["price"]
        drift, vol = _REGIME_PARAMS[tok["regime"]]
        tok["price"] *= pow(2.71828, rng.gauss(drift, vol))
        tok["price"] = max(tok["price"], 1e-12)
        tok["regime_ticks"] += 1
        if tok["regime_ticks"] >= tok["regime_limit"]:
            # regime expires: moon/pump convert to dump or flat, dumps recover to flat
            nxt = {"moon": "dump", "pump": rng.choice(["dump", "flat"]),
                   "rug": "flat", "dump": "flat", "flat": rng.choice(["flat", "pump"])}[tok["regime"]]
            tok["regime"], tok["regime_ticks"] = nxt, 0
            tok["regime_limit"] = self.rng.randint(15, 60)
        # liquidity follows price somewhat + noise
        tok["liquidity_usd"] = max(500.0, tok["liquidity_usd"] * (1 + rng.gauss(0, 0.02)))
        # simulated 5m volume spike magnitude
        if tok["regime"] in ("pump", "moon"):
            tok["vol_change_5m"] = round(rng.uniform(150, 420), 1)
        elif tok["regime"] == "rug":
            tok["vol_change_5m"] = round(rng.uniform(80, 300), 1)
        else:
            tok["vol_change_5m"] = round(rng.uniform(0, 90), 1)

    def _price_change_5m(self, tok: Dict[str, Any]) -> float:
        if not tok["prev_price"]:
            return 0.0
        return (tok["price"] / tok["prev_price"] - 1.0) * 100.0

    # ---------- public API ----------
    async def next(self) -> Dict[str, Any]:
        rng = self.rng
        self.tick_count += 1
        if len(self.tokens) < 40 and rng.random() < 0.25:
            self._spawn_launch()
        if rng.random() < 0.08:
            self._spawn_token(regime=rng.choice(["pump", "flat", "dump"]))

        prices: Dict[str, float] = {}
        trending: List[Dict[str, Any]] = []
        new_launches: List[Dict[str, Any]] = []

        for tok in list(self.tokens.values()):
            self._step_token(tok)
            prices[tok["address"]] = tok["price"]
            pc5 = self._price_change_5m(tok)
            tok["price_change_5m"] = pc5
            # trending candidate (agent applies its own thresholds)
            if pc5 > 8 and tok["vol_change_5m"] > 60:
                trending.append({
                    "address": tok["address"], "symbol": tok["symbol"], "chain": tok["chain"],
                    "price": tok["price"], "price_change_5m": round(pc5, 2),
                    "vol_change_5m": tok["vol_change_5m"],
                    "volume_m5": round(rng.uniform(5_000, 120_000), 2),
                    "liquidity_usd": round(tok["liquidity_usd"], 2),
                    "source": "mock",
                })
            # fresh launch visible for ~90s (~18 ticks) — matches sniper age filter
            if tok["is_launch"] and self.tick_count - (tok["launched_tick"] or 0) < 18:
                attrs = tok.get("launch_attrs", {})
                age = (self.tick_count - tok["launched_tick"]) * 5
                new_launches.append({
                    "address": tok["address"], "symbol": tok["symbol"], "chain": tok["chain"],
                    **attrs,
                    "age_seconds": age,
                    "price": tok["price"], "source": "mock",
                })

        # smart money: persistent buyer sets for hot tokens (stable within a tick window)
        smart_money_buys: Dict[str, List[dict]] = {}
        for tok in self.tokens.values():
            pc5 = self._price_change_5m(tok)
            hot = tok["regime"] in ("pump", "moon") or pc5 > 15
            if hot:
                if tok["address"] not in self._buyers_cache:
                    n = rng.randint(1, 6)
                    self._buyers_cache[tok["address"]] = [
                        {"wallet": _addr(rng, 36)[:12] + "…", "chain": tok["chain"],
                         "amount_usd": round(rng.uniform(200, 15_000), 2)}
                        for _ in range(n)
                    ]
                smart_money_buys[tok["address"]] = self._buyers_cache[tok["address"]]
            else:
                self._buyers_cache.pop(tok["address"], None)

        # garbage collection of dead tokens (keeps the sim small)
        dead = [a for a, t in self.tokens.items()
                if t["price"] < 1e-9 or (not t["is_launch"] and t["liquidity_usd"] < 500)]
        for a in dead:
            self.tokens.pop(a, None)
            self._buyers_cache.pop(a, None)
            prices.pop(a, None)

        return {
            "ts": datetime.now(timezone.utc).isoformat(),
            "tick": self.tick_count,
            "prices": prices,
            "trending": trending,
            "dex_trending": [],           # populated by HybridFeed when live
            "smart_money_buys": smart_money_buys,
            "new_launches": new_launches,
            "live_dex": False,
            "feed_error": None,
        }
