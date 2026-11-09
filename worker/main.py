#!/usr/bin/env python3
"""Multi-agent paper-trading bot — entry point.

    python main.py                    # live dashboard + mock sim (+ DexScreener if enabled)
    python main.py --no-dashboard     # plain log lines (Docker / systemd / non-TTY)
    python main.py --no-live-dex      # fully offline: mock data only, no network at all
    python main.py --hours 1 --seed 42

PAPER MODE is the default and there is no code path here that places real orders.
Live execution requires separate work (private RPC + keys + signing) described in
README.md — do not bolt private keys onto this file.
"""
import argparse
import asyncio
import sys

from dotenv import load_dotenv

load_dotenv()

from rich.console import Console  # noqa: E402
from rich.live import Live        # noqa: E402

from config import settings                       # noqa: E402
from core.paper_engine import PaperEngine        # noqa: E402
from core.coordinator import Coordinator          # noqa: E402
from core.logger import DecisionLogger            # noqa: E402
from core.dashboard import build_layout           # noqa: E402
from agents.scout import ScoutAgent               # noqa: E402
from agents.whale import WhaleAgent               # noqa: E402
from agents.sniper import SniperAgent             # noqa: E402
from agents.shield import ShieldAgent             # noqa: E402
from agents.exit import ExitAgent                 # noqa: E402
from data.feed import HybridFeed                  # noqa: E402

console = Console()


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Multi-agent paper trading simulator")
    p.add_argument("--no-dashboard", action="store_true", help="disable Rich live dashboard")
    p.add_argument("--no-live-dex", action="store_true",
                   help="disable all network (DexScreener + pumpdata.fun); mock only")
    p.add_argument("--hours", type=int, default=24, help="simulated hours to run (default 24)")
    p.add_argument("--tick-seconds", type=float, default=0.1,
                   help="wall-clock delay between 5-minute sim ticks (default 0.1)")
    p.add_argument("--seed", type=int, default=None, help="RNG seed for reproducible mock runs")
    return p.parse_args()


def build_system(seed):
    engine = PaperEngine(
        initial=settings.initial_balance,
        max_pos=settings.max_position_usd,
        max_open=settings.max_open_positions,
        sl=settings.stop_loss_pct,
        fee_pct=settings.position_fee_pct,
    )
    logger = DecisionLogger(settings.log_file)
    live_network = settings.live_dex
    agents = [
        ScoutAgent(),
        WhaleAgent(min_buyers=3),
        SniperAgent(remote_check=live_network),
        ShieldAgent(engine),
        ExitAgent(engine,
                  take_profit_2x=settings.take_profit_2x,
                  take_profit_3x=settings.take_profit_3x,
                  partial_at_2x=settings.partial_at_2x,
                  partial_at_3x=settings.partial_at_3x,
                  trail_pct=settings.trail_pct),
    ]
    core = Coordinator(agents, engine, logger, settings.min_agreeing_agents)
    return engine, logger, core


def print_recap(engine: PaperEngine, hours: int) -> None:
    equity = engine.equity
    pnl = equity - engine.initial_balance
    wins = [c for c in engine.closed if c["pnl"] > 0]
    win_rate = (len(wins) / len(engine.closed) * 100.0) if engine.closed else 0.0
    console.rule("[bold cyan]24h PAPER RECAP")
    console.print(f"Final equity   : [bold]${equity:,.2f}[/bold]  (started ${engine.initial_balance:,.2f})")
    console.print(f"Total PnL      : [{'green' if pnl >= 0 else 'red'}]{pnl:+,.2f}[/{'green' if pnl >= 0 else 'red'}] "
                  f"({pnl / engine.initial_balance * 100:+.2f}%)")
    console.print(f"Realized PnL   : ${engine.total_pnl:+,.2f}   fees paid: ${engine.total_fees:,.2f}")
    console.print(f"Closed trades  : {len(engine.closed)}   sell fills: {len(engine.fills)}")
    console.print(f"Win rate       : {win_rate:.1f}%")
    if engine.closed:
        best = max(engine.closed, key=lambda c: c["pnl"])
        worst = min(engine.closed, key=lambda c: c["pnl"])
        console.print(f"Best trade     : [green]+${best['pnl']:.2f}[/green] ({best['token'][:8]}… reason: {best['reason']})")
        console.print(f"Worst trade    : [red]${worst['pnl']:.2f}[/red] ({worst['token'][:8]}… reason: {worst['reason']})")
    if engine.positions:
        console.print(f"Open positions : {len(engine.positions)} (mark-to-market included above; not yet closed)")
    console.print(f"Decision log   : {settings.log_file}")
    console.rule("[bold yellow]Before you even THINK about live")
    for tip in [
        "Run 20+ seeds back-to-back; a single lucky run means nothing.",
        "MIN_AGREEING_AGENTS=3 is materially stricter than 2 — compare both.",
        "Tighten Sniper filters (dev hold <3%, age <45s, bundled <10%) before trusting it.",
        "Paper PnL >> live PnL: your live costs are slippage, priority fees, failed txs and MEV.",
        "Live needs private high-throughput Solana RPC (+ Geyser for <1s latency); public endpoints will lag.",
        "Never deploy capital you cannot 100% afford to lose. This code is not financial advice.",
    ]:
        console.print(f"  • {tip}")


async def amain() -> int:
    args = parse_args()
    live = settings.live_dex and not args.no_live_dex

    console.print("[bold yellow]PAPER TRADING — educational research code. "
                  "Memecoin launch sniping carries extreme risk. Not financial advice.[/bold yellow]")
    engine, logger, core = build_system(args.seed)
    feed = HybridFeed(live=live, seed=args.seed, refresh_seconds=settings.dex_refresh_seconds)

    console.print(f"Starting {args.hours}h paper sim | balance ${engine.balance:.2f} | "
                  f"feed: {'LIVE dexscreener+mock' if live else 'mock only (offline)'} | "
                  f"seed: {args.seed}")

    dashboard = None
    if not args.no_dashboard:
        dashboard = Live(build_layout(engine, logger, price_map={}, tick=0, hour=0,
                                      total_hours=args.hours, feed_live=live,
                                      feed_error=None),
                        refresh_per_second=4, console=console, screen=False)
        dashboard.start()

    last_prices: dict = {}
    tick_global = 0
    try:
        for hour in range(args.hours):
            for minute in range(0, 60, 5):
                tick_global += 1
                state = await feed.next()
                await core.tick(state)
                last_prices = state.get("prices", {})
                if dashboard is not None:
                    dashboard.update(build_layout(
                        engine, logger, price_map=last_prices, tick=tick_global,
                        hour=hour, total_hours=args.hours, feed_live=live,
                        feed_error=state.get("feed_error")))
                    await asyncio.sleep(args.tick_seconds)
                else:
                    await asyncio.sleep(args.tick_seconds)
            engine.mark_to_market(last_prices)
            if args.no_dashboard:
                console.print(f"Hour {hour + 1:>2}/{args.hours} | equity ${engine.equity:,.2f} | "
                              f"cash ${engine.balance:,.2f} | open {len(engine.positions)} | "
                              f"realized PnL ${engine.total_pnl:+,.2f}")
    except KeyboardInterrupt:
        console.print("\n[yellow]Interrupted — closing out to recap.[/yellow]")
    finally:
        if dashboard is not None:
            dashboard.stop()

    # Mark any still-open positions at last known prices for the recap accounting
    engine.mark_to_market(last_prices)
    print_recap(engine, args.hours)
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(amain()))
