"use client";

import { useState } from "react";

export default function ActivationForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [reference, setReference] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    setMessage("");
    try {
      const res = await fetch("/api/activation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, mode: "paper" }),
      });
      const data = (await res.json()) as { ok: boolean; reference?: string; error?: string };
      if (!res.ok || !data.ok) {
        setState("error");
        setMessage(data.error ?? "Something went wrong. Try again.");
        return;
      }
      setReference(data.reference ?? "");
      setState("done");
    } catch {
      setState("error");
      setMessage("Network error. Try again.");
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-xl border border-up/30 bg-up/5 p-4">
        <div className="num text-[10px] uppercase tracking-[0.2em] text-up">Request recorded · pending infrastructure</div>
        <p className="mt-2 text-sm leading-6 text-muted">
          Your request was recorded on this server instance. Reference <span className="num text-paper">{reference}</span>.
          Account creation, email delivery and virtual balance provisioning are not connected yet.
        </p>
        <p className="mt-2 text-[10px] leading-4 text-faint">
          This reference confirms receipt only; it does not create an account or allocate funds. Local-file records may not survive redeployment.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
      <label htmlFor="activation-email" className="sr-only">Email for paper activation</label>
      <input
        id="activation-email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="num h-11 flex-1 rounded-lg border hairline bg-obsidian-900 px-4 text-sm text-paper placeholder:text-faint outline-none transition-colors focus:border-gold-500"
      />
      <button type="submit" disabled={state === "sending"} className="btn btn-gold h-11 disabled:opacity-60">
        {state === "sending" ? "Sending…" : "Activate paper"}
      </button>
      {message ? <p role="alert" className="text-xs text-down sm:hidden">{message}</p> : null}
    </form>
  );
}
