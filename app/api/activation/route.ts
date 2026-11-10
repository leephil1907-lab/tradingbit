import { appendFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * PAPER activation only. Writes a request to data/activations.jsonl so the
 * desk can follow up. Real-money activation does NOT exist in this codebase:
 * it requires PRIMEVEST desk review + ledger integration (Phase 2).
 * Stores: email, mode, reference, timestamp. No keys, no funds, nothing else.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: unknown; mode?: unknown };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!EMAIL_RE.test(email) || email.length > 254) {
      return Response.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
    }
    const reference = `PB-${randomUUID().slice(0, 8).toUpperCase()}`;
    const record = { reference, email, mode: "paper", received_at: new Date().toISOString() };
    const dir = path.join(process.cwd(), "data");
    mkdirSync(dir, { recursive: true });
    appendFileSync(path.join(dir, "activations.jsonl"), JSON.stringify(record) + "\n", "utf-8");
    return Response.json({ ok: true, reference });
  } catch {
    return Response.json({ ok: false, error: "Activation request storage unavailable. Please retry." }, { status: 503 });
  }
}
