import type { ReactElement } from "react";

type Agent = "scout" | "whale" | "sniper" | "shield" | "exit" | "core";

const paths: Record<Agent, ReactElement> = {
  scout: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <path d="M12 12 L18.5 5.5" />
    </>
  ),
  whale: (
    <>
      <path d="M4 13c2 3.4 7 4.6 11 1.8" />
      <path d="M6 17c2 2 6 2.8 9 1" />
      <path d="M15.5 12.5l4.5-8" />
      <path d="M15.5 12.5l-6.2-1.4" />
      <circle cx="13.6" cy="10.6" r="0.4" fill="currentColor" stroke="none" />
    </>
  ),
  sniper: (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 1.5v4M12 18.5v4M1.5 12h4M18.5 12h4" />
    </>
  ),
  shield: (
    <>
      <path d="M12 2.5l7.5 3v6c0 5-3.2 9.4-7.5 10.5C7.7 20.9 4.5 16.5 4.5 11.5v-6l7.5-3z" />
      <path d="M9.5 12.2l2 2 3.6-4.2" />
    </>
  ),
  exit: (
    <>
      <path d="M5 21V4" />
      <path d="M5 4.5c4-2.2 7.5 2.2 11.5 0v9c-4 2.2-7.5-2.2-11.5 0" />
    </>
  ),
  core: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 3.5v3.5M12 17v3.5M3.5 12H7M17 12h3.5" />
    </>
  ),
};

export default function AgentGlyph({ agent, size = 26, className = "" }: { agent: Agent; size?: number; className?: string }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className} role="img" aria-hidden="true"
    >
      {paths[agent]}
    </svg>
  );
}
