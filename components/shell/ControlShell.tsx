"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode, type SVGProps } from "react";
import { BotProvider, useBot, type BotStatus, type SessionMode } from "./bot-context";
import ConfirmDialog from "@/components/control/ConfirmDialog";
import ContextRail from "@/components/control/ContextRail";

/* ---------- icons (stroke, single weight, currentColor) ---------- */
type IP = SVGProps<SVGSVGElement>;
const I = {
  dashboard: (p: IP) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></svg>),
  strategies: (p: IP) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" {...p}><path d="M4 7h9M19 7h1M4 12h3M13 12h7M4 17h13M21 17h0"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="19" cy="17" r="2"/></svg>),
  positions: (p: IP) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" {...p}><path d="M4 8l8-4.5L20 8v8l-8 4.5L4 16V8z"/><path d="M4 8l8 4.5L20 8M12 12.5V21"/></svg>),
  performance: (p: IP) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" {...p}><path d="M3.5 19.5h17"/><path d="M4.5 15l5-5 4 4 6-8.5"/><path d="M15.5 5.5H19.5V9.5"/></svg>),
  risk: (p: IP) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" {...p}><path d="M12 3l8 3.2v5.3c0 4.8-3.4 9-8 10-4.6-1-8-5.2-8-10V6.2L12 3z"/><path d="M9.5 12l2 2 3.5-4.5"/></svg>),
  alerts: (p: IP) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 9.5a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6.2.4.6-.1 1.3-.9 1.3H4.9c-.8 0-1.3-.7-.9-1.3.5-.7 2-2.2 2-6.2z"/><path d="M10 20a2.2 2.2 0 0 0 4 0"/></svg>),
  audit: (p: IP) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" {...p}><path d="M6 3.5h9L19 8v12.5H6z"/><path d="M14.5 3.5V8H19"/><path d="M9 12h6M9 15.5h6M9 8.5h2.5"/></svg>),
  orders: (p: IP) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" {...p}><path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></svg>),
  connections: (p: IP) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9.5 14.5l5-5"/><path d="M8 11l-2.5 2.5a4 4 0 0 0 5.5 5.5L13.5 16.5M16 13l2.5-2.5a4 4 0 0 0-5.5-5.5L10.5 7.5"/></svg>),
  settings: (p: IP) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" {...p}><circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v3.4M12 17.8v3.4M2.8 12h3.4M17.8 12h3.4M5.2 5.2l2.4 2.4M16.4 16.4l2.4 2.4M18.8 5.2l-2.4 2.4M7.6 16.4l-2.4 2.4"/></svg>),
  pause: (p: IP) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M9 5v14M15 5v14"/></svg>),
  play: (p: IP) => (<svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M8.5 5.4v13.2c0 1 1.1 1.6 2 1.1l10-6.6c.8-.5.8-1.7 0-2.2l-10-6.6c-.9-.5-2 .1-2 1.1z"/></svg>),
  skull: (p: IP) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" {...p}><path d="M12 3a7.5 7.5 0 0 0-7.5 7.5c0 2.6 1.3 4.4 3 5.5V19a1.5 1.5 0 0 0 1.5 1.5h6A1.5 1.5 0 0 0 16.5 19v-3c1.7-1.1 3-2.9 3-5.5A7.5 7.5 0 0 0 12 3z"/><circle cx="9.7" cy="11.2" r="0.4" fill="currentColor"/><circle cx="14.3" cy="11.2" r="0.4" fill="currentColor"/><path d="M11 16.5v1.6M13.2 16.5v1.6"/></svg>),
  sun: (p: IP) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" {...p}><circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M4.9 4.9l1.9 1.9M17.2 17.2l1.9 1.9M19.1 4.9l-1.9 1.9M6.8 17.2l-1.9 1.9"/></svg>),
  moon: (p: IP) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" {...p}><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>),
};

const NAV: { group: string; items: { href: string; label: string; icon: keyof typeof I; badge?: number }[] }[] = [
  { group: "Monitor", items: [
    { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
    { href: "/performance", label: "Performance", icon: "performance" },
    { href: "/risk", label: "Risk center", icon: "risk" },
  ]},
  { group: "Trade", items: [
    { href: "/strategies", label: "Strategies", icon: "strategies" },
    { href: "/positions", label: "Positions", icon: "positions" },
    { href: "/positions#orders", label: "Orders", icon: "orders" },
  ]},
  { group: "System", items: [
    { href: "/alerts", label: "Alerts", icon: "alerts", badge: 2 },
    { href: "/audit-log", label: "Audit log", icon: "audit" },
    { href: "/settings#api-connections", label: "API connections", icon: "connections" },
    { href: "/settings", label: "Settings", icon: "settings" },
  ]},
];

const PILL: Record<BotStatus, string> = { paper: "pill-paper", running: "pill-running", paused: "pill-paused", halted: "pill-halted" };

function StatusPill({ compact = false }: { compact?: boolean }) {
  const { status, statusLabel } = useBot();
  return (
    <span className={`pill ${PILL[status]}`} role="status" aria-label={`Bot status: ${statusLabel}`}>
      <span className="pill-dot" />{compact ? statusLabel.split(" ")[0] : statusLabel}
    </span>
  );
}

function SessionSelector({ compact = false }: { compact?: boolean }) {
  const { sessionMode, switchSessionMode } = useBot();
  const options: { mode: SessionMode; label: string }[] = [
    { mode: "demo", label: "Demo" },
    { mode: "live-market", label: "Live market" },
  ];
  return (
    <div className={`glass-panel rounded-xl p-1 ${compact ? "flex items-center gap-1" : "grid grid-cols-2 gap-1"}`}
      role="group" aria-label="Trading session">
      {options.map((option) => {
        const active = sessionMode === option.mode;
        return (
          <button key={option.mode} type="button" onClick={() => void switchSessionMode(option.mode)}
            aria-pressed={active}
            className={`glass-control rounded-lg px-2.5 py-2 font-mono text-[9px] uppercase tracking-[0.12em] ${active ? "text-gold-300" : "text-faint hover:text-paper"}`}>
            {option.label}
          </button>
        );
      })}
      {sessionMode === "live-market" ? <span className="sr-only">Read-only market monitoring. Live order execution is disabled.</span> : null}
    </div>
  );
}

function KillSwitch() {
  const { halt } = useBot();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const engage = () => {
    setBusy(true); setProgress(0);
    const id = window.setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          window.clearInterval(id);
          return 100;
        }
        return p + 12.5;
      });
    }, 90);
    window.setTimeout(async () => {
      window.clearInterval(id);
      setOpen(false); setBusy(false); setProgress(0);
      await halt("Operator engaged EMERGENCY STOP — all entries blocked, open positions unaffected (paper)");
    }, 900);
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="ctl-btn ctl-btn-danger w-full" aria-label="Emergency stop — halt the bot immediately">
        <I.skull width={14} height={14} /> Kill switch
      </button>
      <ConfirmDialog
        open={open} busy={busy} busyProgress={progress}
        onClose={() => setOpen(false)}
        title="Engage the kill switch?"
        tone="danger"
        confirmLabel="Kill switch"
        confirmKeyword="KILL SWITCH"
        onConfirm={engage}
        body={<>This blocks <strong>all new entries immediately</strong> and flags the session as halted. Open paper positions are left as-is — halting is not a substitute for exit rules. The action is written to the audit log with your session reference.</>}
      />
    </>
  );
}

function PauseResume() {
  const { status, pause, resume } = useBot();
  const halted = status === "halted";
  const paused = status === "paused";
  return paused ? (
    <button type="button" onClick={resume} disabled={halted} className="ctl-btn w-full" aria-label="Resume the bot">
      <I.play width={13} height={13} /> Resume bot
    </button>
  ) : (
    <button type="button" onClick={pause} disabled={halted} className="ctl-btn ctl-btn-amber w-full" aria-label="Pause the bot — stops new entries, exits still run">
      <I.pause width={13} height={13} /> Pause bot
    </button>
  );
}

function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    const saved = window.localStorage.getItem("pv-theme");
    const initial = saved === "light" ? "light" : "dark";
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
  }, []);
  const flip = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try { window.localStorage.setItem("pv-theme", next); } catch { /* noop */ }
    window.dispatchEvent(new Event("pv-theme"));
  };
  return (
    <button type="button" onClick={flip} className="ctl-btn w-full" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} title="Toggle dark / light">
      {theme === "dark" ? <I.sun width={13} height={13} /> : <I.moon width={13} height={13} />}
      {theme === "dark" ? "Light mode" : "Dark mode"}
    </button>
  );
}

function ShellInner({ children, equity, pnl, alertsCount }: { children: ReactNode; equity: string; pnl: string; alertsCount: number }) {
  const pathname = usePathname();
  const { status, sessionMode } = useBot();
  const showRail = pathname === "/dashboard" || pathname === "/performance" || pathname === "/risk";

  return (
    <div className="flex min-h-dvh bg-obsidian-950 text-paper">
      {/* ───────── Desktop sidebar ───────── */}
      <aside className="sticky top-0 hidden h-dvh w-[15rem] shrink-0 flex-col border-r hairline bg-obsidian-900 md:flex" aria-label="Primary navigation">
        <Link href="/" className="flex items-center gap-2.5 border-b hairline-soft px-4 py-4" aria-label="PRIMEVEST Trading Bot — overview">
          <Image src="/brand/icon.svg" alt="" width={30} height={30} />
          <span className="leading-none">
            <span className="block font-display text-[13px] font-semibold tracking-[0.2em]">PRIMEVEST</span>
            <span className="mt-0.5 block font-mono text-[7px] tracking-[0.3em] text-gold-500">TRADING&nbsp;BOT</span>
          </span>
        </Link>
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {NAV.map((group) => (
            <div key={group.group}>
              <div className="section-label px-2">{group.group}</div>
              <ul className="mt-1.5 space-y-1">
                {group.items.map((item) => {
                  const bareHref = item.href.split("#")[0]; const active = pathname === bareHref && !item.href.includes("#") || (item.href === "/positions" && pathname.startsWith("/positions"));
                  const Icon = I[item.icon];
                  return (
                    <li key={item.href}>
                      <Link href={item.href} className="nav-item" data-active={active} aria-current={active ? "page" : undefined}>
                        <Icon width={16} height={16} />
                        <span>{item.label}</span>
                        {item.badge ? <span className="ml-auto rounded-full border border-warn/40 bg-warn/10 px-1.5 py-0.5 font-mono text-[9px] text-warn">{item.badge}</span> : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        {/* Fixed safety cluster — always one click to pause or stop */}
        <div className="border-t hairline px-3 py-3">
          <div className="flex items-center justify-between px-1">
            <div><div className="section-label">Equity · paper</div><div className="num mt-0.5 text-sm text-gold-400">{equity}</div></div>
            <div className="text-right"><div className="section-label">Session PnL</div><div className="num mt-0.5 text-sm text-up">{pnl}</div></div>
          </div>
          <div className="mt-3 space-y-2">
            <StatusPill />
            <PauseResume />
            <KillSwitch />
            <ThemeToggle />
          </div>
          <p className="mt-2 px-1 text-center font-mono text-[7px] uppercase tracking-[0.2em] text-faint">Demo execution · live orders disabled</p>
        </div>
      </aside>

      {/* ───────── Main column ───────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <div className="flex h-14 items-center justify-between border-b hairline bg-obsidian-900 px-4 md:hidden">
          <Link href="/" className="flex items-center gap-2"><Image src="/brand/icon.svg" alt="" width={22} height={22} /><span className="font-display text-[11px] font-semibold tracking-[0.18em]">PRIMEVEST</span></Link>
          <div className="flex items-center gap-2"><SessionSelector compact /><StatusPill compact /></div>
        </div>
        {/* Halted banner — cannot be missed, cannot be dismissed without reset */}
        {sessionMode === "live-market" ? (\n          <div role="status" className="border-b border-gold-500/25 bg-gold-500/5 px-4 py-2 text-center font-mono text-[9px] uppercase tracking-[0.14em] text-gold-300">Live market session · read-only monitoring · order execution disabled</div>\n        ) : null}\n        {status === "halted" ? (
          <div role="alert" className="flex flex-wrap items-center justify-center gap-3 border-b border-down/40 bg-down/10 px-4 py-2 text-center">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-down">Kill switch engaged — all new entries blocked</span>
            <Link href="/settings" className="font-mono text-[9px] uppercase tracking-[0.18em] text-down underline underline-offset-2">Reset paper session in Settings →</Link>
          </div>
        ) : null}
        <main className="min-w-0 flex-1 px-4 pb-20 pt-4 sm:px-5 md:pb-6 md:pt-5">{children}</main>
      </div>

      {/* ───────── Context rail (monitoring screens) ───────── */}
      {showRail ? <ContextRail /> : null}

      {/* ───────── Mobile bottom nav: 5 destinations ───────── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid h-16 grid-cols-5 border-t hairline bg-obsidian-900/95 backdrop-blur md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }} aria-label="Mobile navigation">
        {[
          { href: "/dashboard", label: "Home", icon: "dashboard" as const },
          { href: "/positions", label: "Positions", icon: "positions" as const },
          { href: "/positions#orders", label: "Orders", icon: "strategies" as const },
          { href: "/alerts", label: "Alerts", icon: "alerts" as const },
          { href: "/settings", label: "Settings", icon: "settings" as const },
        ].map((item) => {
          const active = item.href !== "/positions#orders" && pathname === item.href;
          const Icon = I[item.icon];
          return (
            <Link key={item.label} href={item.href} className={`flex flex-col items-center justify-center gap-0.5 ${active ? "text-gold-400" : "text-muted"}`} aria-current={active ? "page" : undefined}>
              <Icon width={19} height={19} />
              <span className="font-mono text-[8px] uppercase tracking-[0.14em]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function ControlShell({ children, equity, pnl, alertsCount }: { children: ReactNode; equity: string; pnl: string; alertsCount: number }) {
  return (
    <BotProvider>
      <ShellInner equity={equity} pnl={pnl} alertsCount={alertsCount}>{children}</ShellInner>
    </BotProvider>
  );
}
