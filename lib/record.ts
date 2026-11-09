import { readFileSync } from "node:fs";
import path from "node:path";

export interface TrackRecord {
  meta: {
    mode: string;
    generated_at: string;
    seed: number;
    simulated_hours: number;
    market_data: string;
    fee_pct_per_side: number;
    initial_balance: number;
    min_agreeing_agents: number;
    disclaimer: string;
  };
  summary: {
    final_equity: number;
    total_pnl: number;
    total_pnl_pct: number;
    realized_pnl: number;
    fees_paid: number;
    closed_trades: number;
    sell_fills: number;
    win_rate_pct: number;
    max_drawdown_pct: number;
    open_positions: number;
    best_trade_pnl: number | null;
    worst_trade_pnl: number | null;
  };
  equity_curve: { hour: number; equity: number }[];
  closed_trades: {
    token: string; chain: string; entry_price: number; exit_price: number;
    size_usd: number; pnl: number; reason: string; partials_taken: number; closed_at: string;
  }[];
  seed_sweep?: {
    note: string;
    runs: { seed: number; pnl_pct: number; closed_trades: number; win_rate_pct: number }[];
    aggregate: {
      mean_pnl_pct: number; median_pnl_pct: number;
      best_pnl_pct: number; worst_pnl_pct: number;
      profitable_runs: number; total_runs: number;
    };
  };
}

export interface DecisionSample {
  note: string;
  entries: {
    ts: string; event: string; token: string; reasons: string;
    size_usd: number; pnl: number;
  }[];
}

function readJson<T>(rel: string): T | null {
  try {
    const p = path.join(process.cwd(), rel);
    return JSON.parse(readFileSync(p, "utf-8")) as T;
  } catch {
    return null;
  }
}

export function loadTrackRecord(): TrackRecord | null {
  return readJson<TrackRecord>("data/track-record.json");
}

export function loadDecisionSample(): DecisionSample | null {
  return readJson<DecisionSample>("data/decisions.sample.json");
}
