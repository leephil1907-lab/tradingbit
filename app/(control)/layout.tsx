import type { Metadata } from "next";
import ControlShell from "@/components/shell/ControlShell";
import { loadTrackRecord } from "@/lib/record";

export const metadata: Metadata = {
  title: "Control room",
  robots: { index: false, follow: false },
};

export default function ControlLayout({ children }: { children: React.ReactNode }) {
  const record = loadTrackRecord();
  const equity = record ? `${record.summary.final_equity.toFixed(2)}` : "—";
  const pnl = record ? `${record.summary.realized_pnl >= 0 ? "+" : ""}${Math.abs(record.summary.realized_pnl).toFixed(2)}` : "—";
  return (
    <ControlShell equity={equity} pnl={pnl}>
      {children}
    </ControlShell>
  );
}
