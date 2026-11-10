import type { Metadata } from "next";
import { readAudit } from "@/lib/audit";

export const metadata: Metadata = { title: "Audit log · Control room" };
export const dynamic = "force-dynamic";

export default function AuditLogPage() {
  const entries = readAudit(100);
  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-paper">Audit log</h1>
          <p className="mt-1 text-sm text-muted">Every material action, newest first. Seed entries are labeled infrastructure of this demo instance.</p>
        </div>
        <span className="num text-[9px] uppercase tracking-[0.18em] text-faint">{entries.length} entries</span>
      </div>

      <section aria-label="Audit entries" className="panel-flat mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="dtable min-w-[720px]">
            <thead><tr><th>Ref</th><th>Timestamp (UTC)</th><th>Actor</th><th>Action</th><th>Detail</th></tr></thead>
            <tbody className="num">
              {entries.map((e) => (
                <tr key={e.ref}>
                  <td className="text-gold-400">{e.ref}</td>
                  <td className="text-faint">{e.ts.replace("T", " ").replace("Z", "")}</td>
                  <td className="text-muted">{e.actor}</td>
                  <td className="text-paper">{e.action}</td>
                  <td className="max-w-[380px] font-sans text-[10px] leading-4 text-muted">{e.detail}</td>
                </tr>
              ))}
              {entries.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-sm text-faint">No entries yet. Actions you take in this console appear here with a PB- reference.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <p className="mt-3 text-[9px] leading-4 text-faint">Runtime entries are written to the service's local JSONL file and are not durable across redeploys. PostgreSQL persistence, authenticated actors, dual-control review and immutable export remain future production requirements. Seed entries describe demo infrastructure; runtime actions appear at the top.</p>
    </div>
  );
}
