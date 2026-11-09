import { fmtUsd } from "@/lib/format";

export default function EquityCurve({
  points, height = 170,
}: { points: { hour: number; equity: number }[]; height?: number }) {
  if (!points.length) return null;
  const W = 720, H = height, PAD = { t: 12, r: 8, b: 22, l: 8 };
  const values = points.map((p) => p.equity);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 1e-9);
  const x = (i: number) => PAD.l + (i / (points.length - 1)) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - (v - min) / span) * (H - PAD.t - PAD.b);
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.equity).toFixed(1)}`).join(" ");
  const area = `${line} L${x(points.length - 1).toFixed(1)},${H - PAD.b} L${x(0).toFixed(1)},${H - PAD.b} Z`;
  const last = points[points.length - 1]!;
  const gridYs = [0.25, 0.5, 0.75].map((f) => PAD.t + f * (H - PAD.t - PAD.b));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img"
         aria-label={`Paper account equity curve from ${fmtUsd(values[0]!)} to ${fmtUsd(last.equity)} over ${points.length - 1} simulated hours`}>
      <defs>
        <linearGradient id="eq-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#dfc088" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#dfc088" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {gridYs.map((gy, i) => (
        <line key={i} x1={PAD.l} x2={W - PAD.r} y1={gy} y2={gy} stroke="rgba(223,192,138,0.08)" strokeDasharray="3 5" />
      ))}
      <path d={area} fill="url(#eq-fill)" />
      <path d={line} fill="none" stroke="#dfc088" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(points.length - 1)} cy={y(last.equity)} r="3.2" fill="#dfc088" />
      <text x={PAD.l} y={H - 6} fill="#9ca3af" fontSize="10" fontFamily="var(--font-mono), monospace">+0h</text>
      <text x={W - PAD.r} y={H - 6} textAnchor="end" fill="#9ca3af" fontSize="10" fontFamily="var(--font-mono), monospace">+{points.length - 1}h</text>
    </svg>
  );
}
