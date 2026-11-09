export function fmtUsd(n: number, digits = 2): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: digits, maximumFractionDigits: digits });
}
export function fmtSignedUsd(n: number): string {
  const sign = n >= 0 ? "+" : "−";
  return `${sign}$${Math.abs(n).toFixed(2)}`;
}
export function fmtPct(n: number, digits = 2): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(digits)}%`;
}
export function pnlClass(n: number): string {
  return n > 0 ? "text-up" : n < 0 ? "text-down" : "text-muted";
}
export function shortToken(t: string, n = 10): string {
  return t.length > n ? `${t.slice(0, n)}…` : t;
}
