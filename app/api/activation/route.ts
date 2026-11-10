import { appendFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * DEMO activation request only. The request is acknowledged only after the
 * local append succeeds. Durable storage and authenticated ownership require
 * the production database stage.
 */
export async function POST(req: Request) {
  let body: { email?: unknown; mode?: unknown };
  try {
    body = (await req.json()) as { email?: unknown; mode?: unknown };
  } catch {
    return Response.json({ ok: false, error: "Malformed request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return Response.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
  }

  const reference = `PV-${randomUUID().slice(0, 8).toUpperCase()}`;
  const record = { reference, email, mode: "demo", received_at: new Date().toISOString() };
  try {
    const dir = path.join(process.cwd(), "data");
    mkdirSync(dir, { recursive: true });
    appendFileSync(path.join(dir, "activations.jsonl"), JSON.stringify(record) + "\n", "utf-8");
    return Response.json({ ok: true, reference });
  } catch {
    return Response.json({ ok: false, error: "Activation request storage unavailable. Please retry." }, { status: 503 });
  }
}
