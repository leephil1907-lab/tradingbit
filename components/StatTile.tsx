export default function StatTile({
  label, value, sub, tone = "neutral",
}: { label: string; value: string; sub?: string; tone?: "neutral" | "up" | "down" | "gold" }) {
  const toneCls =
    tone === "up" ? "text-up" : tone === "down" ? "text-down" : tone === "gold" ? "text-gold-400" : "text-paper";
  return (
    <div className="panel-flat px-4 py-4">
      <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-faint">{label}</div>
      <div className={`num mt-2 text-xl leading-none ${toneCls}`}>{value}</div>
      {sub ? <div className="mt-2 text-[10px] leading-4 text-faint">{sub}</div> : null}
    </div>
  );
}
