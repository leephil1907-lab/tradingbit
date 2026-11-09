import type { Metadata } from "next";
import { loadTrackRecord, loadDecisionSample } from "@/lib/record";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = { title: "Dashboard · Control room" };

export default function DashboardPage() {
  const record = loadTrackRecord();
  const sample = loadDecisionSample();
  return <DashboardClient record={record} sampleEntries={sample?.entries ?? []} />;
}
