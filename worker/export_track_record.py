#!/usr/bin/env python3
"""Generate data/track-record.json — a REAL snapshot from the paper engine.

Not marketing copy: every number here comes from an actual engine run.
Labeling is part of the file (mode=PAPER, seed, fee assumptions, timestamp).
The web app renders this file verbatim or shows an empty state.
"""
import asyncio
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

WORKER = Path(__file__).resolve().parent
sys.path.insert(0, str(WORKER))

from config import settings                     # noqa: E402
from core.paper_engine import PaperEngine      # noqa: E402
from core.coordinator import Coordinator        # noqa: E402
from core.logger import DecisionLogger          # noqa: E402
from agents.scout import ScoutAgent             # noqa: E402
from agents.whale import WhaleAgent             # noqa: E402
from agents.sniper import SniperAgent           # noqa: E402
from agents.shield import ShieldAgent           # noqa: E402
from agents.exit import ExitAgent               # noqa: E402
from data.feed import HybridFeed                # noqa: E402

SEED = int(sys.argv[1]) if len(sys.argv) > 1 else 42
HOURS = int(sys.argv[2]) if len(sys.argv) > 2 else 24
OUT = Path(sys.argv[3]) if len(sys.argv) > 3 else WORKER.parent / "data" / "track-record.json"


async def main():
    engine = PaperEngine(settings.initial_balance, settings.max_position_usd,
                         settings.max_open_positions, settings.stop_loss_pct,
                         settings.position_fee_pct)
    logger = DecisionLogger(str(WORKER / "logs" / "export.jsonl"))
    agents = [
        ScoutAgent(), WhaleAgent(3), SniperAgent(remote_check=False),
        ShieldAgent(engine),
        ExitAgent(engine, settings.take_profit_2x, settings.take_profit_3x,
                  settings.partial_at_2x, settings.partial_at_3x, settings.trail_pct),
    ]
    core = Coordinator(agents, engine, logger, settings.min_agreeing_agents)
    feed = HybridFeed(live=settings.live_dex, seed=SEED,
                      refresh_seconds=settings.dex_refresh_seconds)

    curve = [{"hour": 0, "equity": engine.initial_balance}]
    prices = {}
    tick = 0
    for hour in range(HOURS):
        for _ in range(12):  # 5-minute ticks
            tick += 1
            state = await feed.next()
            await core.tick(state)
            prices = state.get("prices", {})
        engine.mark_to_market(prices)
        curve.append({"hour": hour + 1, "equity": round(engine.equity, 2)})

    engine.mark_to_market(prices)
    final_eq = engine.equity
    peak = curve[0]["equity"]; max_dd = 0.0
    for pt in curve:
        peak = max(peak, pt["equity"])
        max_dd = max(max_dd, (peak - pt["equity"]) / peak * 100.0)

    wins = [c for c in engine.closed if c["pnl"] > 0]
    best = max(engine.closed, key=lambda c: c["pnl"], default=None)
    worst = min(engine.closed, key=lambda c: c["pnl"], default=None)

    out = {
        "meta": {
            "mode": "PAPER",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "seed": SEED,
            "simulated_hours": HOURS,
            "market_data": "Live DexScreener marks at generation time + seeded synthetic regimes (mock_feed)",
            "fee_pct_per_side": settings.position_fee_pct,
            "initial_balance": settings.initial_balance,
            "min_agreeing_agents": settings.min_agreeing_agents,
            "disclaimer": ("Paper-trading results on a simulated and partially live-marked feed. "
                           "Not indicative of live performance. No real orders are placed or settled by this bot. "
                           "Trading volatile assets carries substantial risk of loss."),
        },
        "summary": {
            "final_equity": round(final_eq, 2),
            "total_pnl": round(final_eq - engine.initial_balance, 2),
            "total_pnl_pct": round((final_eq / engine.initial_balance - 1) * 100, 2),
            "realized_pnl": round(engine.total_pnl, 2),
            "fees_paid": round(engine.total_fees, 2),
            "closed_trades": len(engine.closed),
            "sell_fills": len(engine.fills),
            "win_rate_pct": round(len(wins) / len(engine.closed) * 100, 1) if engine.closed else 0.0,
            "max_drawdown_pct": round(max_dd, 2),
            "open_positions": len(engine.positions),
            "best_trade_pnl": round(best["pnl"], 2) if best else None,
            "worst_trade_pnl": round(worst["pnl"], 2) if worst else None,
        },
        "equity_curve": curve,
        "closed_trades": [
            {
                "token": c["token"][:10] + "…",
                "chain": c["chain"],
                "entry_price": c["entry_price"],
                "exit_price": c["exit_price"],
                "size_usd": round(c["size_usd"], 2),
                "pnl": round(c["pnl"], 2),
                "reason": c["reason"],
                "partials_taken": c["partials_taken"],
                "closed_at": c["closed_at"],
            } for c in engine.closed
        ],
    }
    # --- seed sweep (mock-only, deterministic): the honest "distribution" of outcomes ---
    sweep_runs = []
    for extra_seed in range(1, 21):
        e2 = PaperEngine(settings.initial_balance, settings.max_position_usd,
                         settings.max_open_positions, settings.stop_loss_pct,
                         settings.position_fee_pct)
        l2 = DecisionLogger(str(WORKER / "logs" / "sweep.jsonl"))
        a2 = [ScoutAgent(), WhaleAgent(3), SniperAgent(remote_check=False),
              ShieldAgent(e2),
              ExitAgent(e2, settings.take_profit_2x, settings.take_profit_3x,
                        settings.partial_at_2x, settings.partial_at_3x, settings.trail_pct)]
        c2 = Coordinator(a2, e2, l2, settings.min_agreeing_agents)
        f2 = HybridFeed(live=False, seed=extra_seed, refresh_seconds=9999)
        pr2 = {}
        for _ in range(HOURS * 12):
            st = await f2.next()
            await c2.tick(st)
            pr2 = st.get("prices", {})
        e2.mark_to_market(pr2)
        wins2 = [c for c in e2.closed if c["pnl"] > 0]
        sweep_runs.append({
            "seed": extra_seed,
            "pnl_pct": round((e2.equity / settings.initial_balance - 1) * 100, 2),
            "closed_trades": len(e2.closed),
            "win_rate_pct": round(len(wins2) / len(e2.closed) * 100, 1) if e2.closed else 0.0,
        })
    pnl_pcts = sorted(r["pnl_pct"] for r in sweep_runs)
    out["seed_sweep"] = {
        "note": "20 independent accelerated 24h simulations (seeds 1-20), mock-feed only, "
                "same parameters as the canonical run. Synthetic data; not a prediction of live results. "
                "Published so the reader sees losing runs too — not just a favourable seed.",
        "runs": sweep_runs,
        "aggregate": {
            "mean_pnl_pct": round(sum(pnl_pcts) / len(pnl_pcts), 2),
            "median_pnl_pct": round((pnl_pcts[9] + pnl_pcts[10]) / 2, 2),
            "best_pnl_pct": pnl_pcts[-1],
            "worst_pnl_pct": pnl_pcts[0],
            "profitable_runs": sum(1 for p in pnl_pcts if p > 0),
            "total_runs": len(pnl_pcts),
        },
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, indent=2))
    print("wrote", OUT)
    print("equity", round(final_eq, 2), "| pnl", round(final_eq - engine.initial_balance, 2),
          "| trades", len(engine.closed), "| maxDD", round(max_dd, 2), "%")


if __name__ == "__main__":
    asyncio.run(main())
