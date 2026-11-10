"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

export type BotStatus = "paper" | "running" | "paused" | "halted";
export type SessionMode = "demo" | "live-market";

interface BotContextValue {
  status: BotStatus;
  sessionMode: SessionMode;
  switchSessionMode: (mode: SessionMode) => Promise<void>;
  statusLabel: string;
  statusTone: "paper" | "running" | "paused" | "halted";
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  halt: (detail: string) => Promise<void>;
  resetPaper: () => Promise<void>;
  notify: (msg: string) => void;
  audit: (action: string, detail: string) => Promise<string | null>;
  heartbeatSeconds: number;
  feedOk: boolean | null;
}

const Ctx = createContext<BotContextValue | null>(null);

export const STATUS_META: Record<BotStatus, { label: string; tone: BotStatus }> = {
  paper: { label: "Paper trading", tone: "paper" },
  running: { label: "Running", tone: "running" },
  paused: { label: "Paused", tone: "paused" },
  halted: { label: "Halted", tone: "halted" },
};

async function postAudit(action: string, detail: string): Promise<string | null> {
  try {
    const res = await fetch("/api/audit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, detail }),
    });
    const data = (await res.json()) as { ok: boolean; ref?: string };
    return data.ok ? data.ref ?? null : null;
  } catch {
    return null;
  }
}

export function BotProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<BotStatus>("paper");
  const [sessionMode, setSessionMode] = useState<SessionMode>("demo");
  const [toast, setToast] = useState<string | null>(null);
  const [feedOk, setFeedOk] = useState<boolean | null>(null);
  const [heartbeatSeconds, setHeartbeatSeconds] = useState(0);
  const toastTimer = useRef<number | null>(null);

  // Restore the selected session. Live-market mode is read-only; it never enables orders.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("pv-session-mode");
      if (saved === "demo" || saved === "live-market") setSessionMode(saved);
    } catch { /* private mode */ }
  }, []);

  const switchSessionMode = useCallback(async (mode: SessionMode) => {
    if (mode === sessionMode) return;
    setSessionMode(mode);
    try { window.localStorage.setItem("pv-session-mode", mode); } catch { /* noop */ }
    const detail = mode === "demo"
      ? "Selected DEMO session. Virtual balances and simulated fills only."
      : "Selected LIVE MARKET session. Market data monitoring only; live order execution is disabled.";
    const ref = await postAudit("SESSION_MODE_CHANGED", detail);
    notify(ref ? `${mode === "demo" ? "Demo" : "Live market"} session selected · logged ${ref}` : `${mode === "demo" ? "Demo" : "Live market"} session selected`);
  }, [sessionMode, notify]);

  // hydrate persisted status
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("pv-bot-status");
      if (saved === "paper" || saved === "running" || saved === "paused" || saved === "halted") setStatus(saved);
    } catch { /* private mode */ }
  }, []);

  const persist = useCallback((s: BotStatus) => {
    setStatus(s);
    try { window.localStorage.setItem("pv-bot-status", s); } catch { /* noop */ }
  }, []);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 4200);
  }, []);

  const audit = useCallback((action: string, detail: string) => postAudit(action, detail), []);

  const pause = useCallback(async () => {
    if (status === "halted") { notify("Bot is halted by kill switch — reset paper session to resume."); return; }
    persist("paused");
    const ref = await postAudit("BOT_PAUSED", "Operator paused new entries (one-click control)");
    notify(ref ? `Bot paused · logged ${ref}` : "Bot paused");
  }, [status, persist, notify]);

  const resume = useCallback(async () => {
    if (status === "halted") { notify("Bot is halted by kill switch — reset paper session to resume."); return; }
    persist("running");
    const ref = await postAudit("BOT_RESUMED", "Operator resumed the paper bot");
    notify(ref ? `Bot resumed · logged ${ref}` : "Bot resumed");
  }, [status, persist, notify]);

  const halt = useCallback(async (detail: string) => {
    persist("halted");
    const ref = await postAudit("KILL_SWITCH", detail);
    notify(ref ? `Kill switch engaged · logged ${ref}` : "Kill switch engaged");
  }, [persist, notify]);

  const resetPaper = useCallback(async () => {
    persist("paper");
    const ref = await postAudit("PAPER_SESSION_RESET", "Paper session reset — bot back to PAPER TRADING");
    notify(ref ? `Paper session reset · logged ${ref}` : "Paper session reset");
  }, [persist, notify]);

  // heartbeat ticker (1s) — purely a UI liveness signal
  useEffect(() => {
    const id = window.setInterval(() => setHeartbeatSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    const id = window.setInterval(() => setHeartbeatSeconds(0), 10_000); // data refetch resets age
    return () => window.clearInterval(id);
  }, []);

  // feed reachability probe (45s cadence)
  useEffect(() => {
    let cancelled = false;
    const probe = async () => {
      try {
        const res = await fetch("/api/market", { cache: "no-store" });
        const data = (await res.json()) as { ok: boolean };
        if (!cancelled) { setFeedOk(Boolean(data.ok)); setHeartbeatSeconds(0); }
      } catch { if (!cancelled) setFeedOk(false); }
    };
    probe();
    const id = window.setInterval(probe, 45_000);
    return () => { cancelled = true; window.clearInterval(id); };
  }, []);

  const meta = STATUS_META[status];
  return (
    <Ctx.Provider value={{
      status, statusLabel: meta.label, statusTone: meta.tone, sessionMode, switchSessionMode,
      pause, resume, halt, resetPaper, notify, audit,
      heartbeatSeconds, feedOk,
    }}>
      {children}
      {toast ? <div role="status" className="toast">{toast}</div> : null}
    </Ctx.Provider>
  );
}

export function useBot() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBot must be used inside <BotProvider>");
  return ctx;
}
