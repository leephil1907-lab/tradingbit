"""Rich live dashboard — equity curve-ish stats, open positions, recent decisions.

Toggle off with --no-dashboard (required in Docker/systemd/non-TTY logs).
"""
from typing import Any, Dict, List, Optional

from rich import box
from rich.layout import Layout
from rich.panel import Panel
from rich.table import Table
from rich.text import Text


def _short(token: str, n: int = 8) -> str:
    return f"{token[:n]}…" if len(token) > n else token


def _pnl_style(v: float) -> str:
    return "bold green" if v >= 0 else "bold red"


def build_layout(engine, logger, *, price_map: Dict[str, float], tick: int,
                 hour: int, total_hours: int,
                 feed_live: bool, feed_error: Optional[str],
                 signals_last: int = 0, buys_last: int = 0) -> Layout:
    equity = engine.mark_to_market(price_map)
    deployed = equity - engine.balance
    realized = engine.total_pnl

    layout = Layout()
    layout.split_column(
        Layout(name="header", size=3),
        Layout(name="stats", size=5),
        Layout(name="positions", ratio=2),
        Layout(name="decisions", ratio=3),
        Layout(name="footer", size=3),
    )

    paper_badge = Text(" PAPER MODE ", style="bold black on yellow")
    header_text = Text()
    header_text.append("Multi-Agent Trader", style="bold cyan")
    header_text.append("  ")
    header_text.append_text(paper_badge)
    header_text.append(f"   hour {hour + 1}/{total_hours}   tick {tick}", style="dim")
    layout["header"].update(Panel(header_text, box=box.SIMPLE, padding=(0, 1)))

    stats = Table.grid(expand=True, padding=(0, 2))
    stats.add_column(justify="center")
    stats.add_column(justify="center")
    stats.add_column(justify="center")
    stats.add_column(justify="center")
    stats.add_column(justify="center")
    stats.add_row(
        Text(f"${equity:,.2f}\nEQUITY", style="bold white", justify="center"),
        Text(f"${engine.balance:,.2f}\nCASH", style="white", justify="center"),
        Text(f"${realized:+,.2f}\nREALIZED PnL", style=_pnl_style(realized), justify="center"),
        Text(f"${deployed:,.2f}\nDEPLOYED", style="white", justify="center"),
        Text(f"${engine.total_fees:,.2f}\nFEES", style="dim", justify="center"),
    )
    layout["stats"].update(Panel(stats, title="Account", box=box.ROUNDED, padding=(0, 1)))

    pt = Table(expand=True, box=box.SIMPLE_HEAD, pad_edge=False)
    for col, just in [("Pos", "left"), ("Token", "left"), ("Chain", "left"),
                      ("Entry", "right"), ("Mark", "right"), ("PnL %", "right"),
                      ("Peak", "right"), ("Size $", "right"), ("Partials", "center")]:
        pt.add_column(col, justify=just, no_wrap=True)
    if engine.positions:
        for i, pos in enumerate(sorted(engine.positions.values(), key=lambda p: p.opened_at), 1):
            mark = price_map.get(pos.token, pos.entry_price)
            pnl_pct = (mark / pos.entry_price - 1.0) * 100.0
            pt.add_row(
                str(i), _short(pos.token), pos.chain,
                f"{pos.entry_price:.2e}", f"{mark:.2e}",
                Text(f"{pnl_pct:+.1f}%", style=_pnl_style(pnl_pct)),
                f"{pos.peak_price:.2e}",
                f"{pos.cost_remaining:,.2f}",
                str(pos.partials_taken),
            )
    else:
        pt.add_row("—", "no open positions", "", "", "", "", "", "", "")
    layout["positions"].update(Panel(pt, title=f"Open Positions ({len(engine.positions)})",
                                     box=box.ROUNDED))

    dt = Table(expand=True, box=box.SIMPLE_HEAD, pad_edge=False, show_header=True)
    dt.add_column("Time (UTC)", style="dim", no_wrap=True)
    dt.add_column("Event", no_wrap=True)
    dt.add_column("Token", no_wrap=True)
    dt.add_column("Details", ratio=1)
    dt.add_column("PnL", justify="right", no_wrap=True)
    recent = logger.recent(9)
    if recent:
        for rec in reversed(recent):
            event = rec.get("event", "")
            style = {"BUY": "bold green", "SELL": "bold red",
                     "PARTIAL_SELL": "yellow", "BLOCK": "magenta",
                     "NO_CONSENSUS": "dim", "AGENT_ERROR": "bold red"}.get(event, "white")
            pnl = rec.get("pnl", 0.0) or 0.0
            dt.add_row(
                str(rec.get("ts", ""))[11:19],
                Text(event, style=style),
                _short(str(rec.get("token", ""))),
                str(rec.get("reasons", ""))[:90],
                Text(f"{pnl:+.2f}", style=_pnl_style(pnl)) if pnl else Text(""),
            )
    else:
        dt.add_row("—", "waiting for signals…", "", "", "")
    layout["decisions"].update(Panel(dt, title="Recent Decisions (logs/decisions.jsonl)",
                                     box=box.ROUNDED))

    feed_txt = "LIVE DexScreener + mock sim" if feed_live else "mock sim (offline)"
    if feed_error:
        feed_txt += f"  [red]feed issue: {feed_error[:70]}[/]"
    footer = Text.from_markup(
        f"Feed: {feed_txt}   |   consensus ≥ 2 agents required   |   "
        "[yellow]Educational paper trading — not financial advice.[/]"
    )
    layout["footer"].update(Panel(footer, box=box.SIMPLE, padding=(0, 1)))
    return layout
