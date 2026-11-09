export default function Sparkline({ data, positive, width = 96, height = 30 }: {
  data: number[]; positive: boolean; width?: number; height?: number;
}) {
  if (!data.length) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const span = Math.max(max - min, 1e-9);
  const pts = data.map((v, i) =>
    `${((i / (data.length - 1)) * width).toFixed(1)},${(height - 2 - ((v - min) / span) * (height - 4)).toFixed(1)}`
  ).join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">
      <polyline points={pts} fill="none" stroke={positive ? "var(--up)" : "var(--down)"} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" opacity="0.9" />
    </svg>
  );
}
