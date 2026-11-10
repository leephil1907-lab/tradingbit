import { readFileSync, appendFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

export interface AuditEntry {
  ref: string; ts: string; actor: string; action: string; detail: string;
}

const DIR = path.join(process.cwd(), "data");
const SEED = path.join(DIR, "audit.seed.jsonl");
const RUNTIME = path.join(DIR, "audit.jsonl");

function parseJsonl(file: string): AuditEntry[] {
  try {
    return readFileSync(file, "utf-8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as AuditEntry);
  } catch { return []; }
}

/** Merged, newest-first. Seed entries are labeled demo infrastructure. */
export function readAudit(limit = 100): AuditEntry[] {
  const all = [...parseJsonl(RUNTIME), ...parseJsonl(SEED)];
  all.sort((a, b) => b.ts.localeCompare(a.ts));
  return all.slice(0, limit);
}

export function appendAudit(action: string, detail: string, actor = "operator"): AuditEntry {
  const entry: AuditEntry = {
    ref: `PB-${randomBytes(4).toString("hex").toUpperCase()}`,
    ts: new Date().toISOString(),
    actor,
    action: action.slice(0, 64),
    detail: detail.slice(0, 280),
  };
  mkdirSync(DIR, { recursive: true });
  appendFileSync(RUNTIME, JSON.stringify(entry) + "\n", "utf-8");
  return entry;
}
