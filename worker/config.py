"""Central settings. Everything paper-first: PAPER_MODE defaults to true."""
from functools import cached_property

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    paper_mode: bool = True
    initial_balance: float = 500.0
    max_position_usd: float = 50.0
    max_open_positions: int = 10
    stop_loss_pct: float = -6.0
    take_profit_2x: float = 2.0
    take_profit_3x: float = 3.0
    partial_at_2x: float = 0.40   # fraction of position sold at 2x
    partial_at_3x: float = 0.30   # fraction of position sold at 3x
    trail_pct: float = 8.0        # trailing stop, % off peak (active after 1.5x or first partial)
    position_fee_pct: float = 0.3  # per side, paper-mode realism

    min_agreeing_agents: int = 2

    # Stored as raw string so CHAINS=sol,base,bsc works without JSON quoting.
    chains: str = "sol,base,bsc"

    live_dex: bool = True
    dex_refresh_seconds: float = 20.0

    gmgn_api_key: str = ""
    solana_rpc_http: str = ""
    solana_rpc_wss: str = ""
    geyser_endpoint: str = ""
    geyser_token: str = ""

    dashboard_refresh: float = 2.0

    log_level: str = "INFO"
    log_file: str = "logs/decisions.jsonl"

    @cached_property
    def chains_list(self) -> list[str]:
        return [c.strip().lower() for c in self.chains.split(",") if c.strip()]


settings = Settings()
