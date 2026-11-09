"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Friction proportional to consequence.
 * - keyword provided  → user must type it exactly (CLOSE ALL, KILL SWITCH, RESET)
 * - no keyword        → single explicit confirm click
 */
export default function ConfirmDialog({
  open, onClose, title, body, confirmLabel, confirmKeyword, tone = "neutral", busy = false, busyProgress, onConfirm, children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  confirmKeyword?: string;
  tone?: "neutral" | "warn" | "danger";
  busy?: boolean;
  busyProgress?: number; // 0..100 while action executes
  onConfirm: () => void;
  children?: ReactNode;
}) {
  const [typed, setTyped] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const ok = confirmKeyword ? typed.trim().toUpperCase() === confirmKeyword.toUpperCase() : true;

  useEffect(() => {
    if (open) {
      setTyped("");
      const t = window.setTimeout(() => inputRef.current?.focus(), 60);
      const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) onClose(); };
      window.addEventListener("keydown", onKey);
      return () => { window.clearTimeout(t); window.removeEventListener("keydown", onKey); };
    }
  }, [open, busy, onClose]);

  if (!open) return null;

  const toneBtn = tone === "danger" ? "ctl-btn ctl-btn-danger" : tone === "warn" ? "ctl-btn ctl-btn-amber" : "ctl-btn ctl-btn-gold";
  const toneBar = tone === "danger" ? "bg-down" : tone === "warn" ? "bg-warn" : "bg-gold-400";

  return (
    <div className="overlay-progress" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-body"
           className="panel w-full max-w-md p-6">
        <h2 id="confirm-title" className="font-display text-xl text-paper">{title}</h2>
        <div id="confirm-body" className="mt-3 text-[13px] leading-6 text-muted">{body}</div>
        {children}
        {busy ? (
          <div className="mt-5" aria-live="polite">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-warn">
              <span>Executing…</span><span>{Math.round(busyProgress ?? 0)}%</span>
            </div>
            <div className="meter meter-warn mt-2"><div style={{ width: `${busyProgress ?? 0}%` }} /></div>
          </div>
        ) : (
          <>
            {confirmKeyword ? (
              <div className="mt-5">
                <label htmlFor="confirm-keyword" className="field-label">Type <span className="text-paper">{confirmKeyword}</span> to confirm</label>
                <input id="confirm-keyword" ref={inputRef} value={typed} onChange={(e) => setTyped(e.target.value)}
                  className="field" autoComplete="off" spellCheck={false} placeholder={confirmKeyword} />
              </div>
            ) : null}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className="ctl-btn" onClick={onClose}>Cancel</button>
              <button type="button" className={toneBtn} disabled={!ok} onClick={onConfirm}>{confirmLabel}</button>
            </div>
          </>
        )}
        <div className={`mt-4 h-0.5 w-16 rounded-full ${toneBar}`} aria-hidden="true" />
      </div>
    </div>
  );
}
