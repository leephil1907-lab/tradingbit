import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ status: "ok", service: "primevest-trading-bot", mode: "PAPER", ts: new Date().toISOString() });
}
