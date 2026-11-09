import { readAudit, appendAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ ok: true, entries: readAudit(100) });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { action?: unknown; detail?: unknown };
    const action = typeof body.action === "string" ? body.action.trim() : "";
    const detail = typeof body.detail === "string" ? body.detail.trim() : "";
    if (!action || !detail || action.length > 64 || detail.length > 280) {
      return Response.json({ ok: false, error: "action/detail required (64/280 chars max)" }, { status: 400 });
    }
    const entry = appendAudit(action, detail);
    return Response.json({ ok: true, ref: entry.ref });
  } catch {
    return Response.json({ ok: false, error: "Malformed request." }, { status: 400 });
  }
}
