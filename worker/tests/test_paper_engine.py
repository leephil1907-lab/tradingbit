import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from core.paper_engine import PaperEngine


class PaperEngineTests(unittest.TestCase):
    def test_open_deducts_principal_and_entry_fee(self):
        engine = PaperEngine(initial=100, max_pos=50, fee_pct=1)
        position = engine.open("TOKEN", "sol", 10, 50)
        self.assertIsNotNone(position)
        self.assertAlmostEqual(engine.balance, 50)
        self.assertAlmostEqual(position.qty, 4.95)
        self.assertAlmostEqual(engine.total_fees, 0.5)

    def test_rejects_invalid_price_and_caps_oversized_position(self):
        engine = PaperEngine(initial=100, max_pos=50)
        self.assertIsNone(engine.open("TOKEN", "sol", 0, 10))
        position = engine.open("TOKEN", "sol", 10, 51)
        self.assertIsNotNone(position)
        self.assertEqual(position.size_usd, 50)
        self.assertEqual(engine.balance, 50)
        self.assertEqual(len(engine.positions), 1)

    def test_partial_and_final_close_preserve_cost_basis(self):
        engine = PaperEngine(initial=100, max_pos=50, fee_pct=1)
        position = engine.open("TOKEN", "sol", 10, 50)
        partial_pnl = engine.partial_close(position.id, 0.5, 12, "take profit")
        self.assertAlmostEqual(partial_pnl, 4.403)
        self.assertIn(position.id, engine.positions)
        final_pnl = engine.close(position.id, 11, "stop")
        self.assertAlmostEqual(final_pnl, 1.95275)
        self.assertNotIn(position.id, engine.positions)
        self.assertEqual(len(engine.closed), 1)
        self.assertEqual(len(engine.fills), 2)
        self.assertAlmostEqual(engine.total_pnl, 6.35575)
        self.assertAlmostEqual(engine.total_fees, 1.06925)

    def test_mark_to_market_uses_current_price(self):
        engine = PaperEngine(initial=100, max_pos=50, fee_pct=0)
        position = engine.open("TOKEN", "sol", 10, 50)
        equity = engine.mark_to_market({"TOKEN": 12})
        self.assertAlmostEqual(equity, 110)
        self.assertAlmostEqual(engine.equity, 110)

    def test_unknown_position_cannot_be_closed(self):
        engine = PaperEngine()
        self.assertIsNone(engine.close("missing", 10))
        self.assertEqual(engine.balance, engine.initial_balance)


if __name__ == "__main__":
    unittest.main()
