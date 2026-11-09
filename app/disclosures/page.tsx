import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disclosures & risk",
  description: "PRIMEVEST Trading Bot — risk disclosures, product nature, eligibility and data-source statements.",
};

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="border-t hairline-soft py-7 first:border-t-0 first:pt-0">
      <div className="num text-[9px] uppercase tracking-[0.24em] text-faint">§{n}</div>
      <h2 className="mt-1.5 font-display text-xl text-paper">{title}</h2>
      <div className="mt-3 max-w-3xl space-y-3 text-[13px] leading-6 text-muted">{children}</div>
    </section>
  );
}

export default function DisclosuresPage() {
  return (
    <section className="mx-auto max-w-container px-4 py-12 sm:px-6">
      <div className="max-w-2xl">
        <div className="rounded-xl border border-warn/30 bg-warn/5 px-4 py-3">
          <span className="num text-[9px] uppercase tracking-[0.22em] text-warn">Draft — pending PRIMEVEST counsel review</span>
          <p className="mt-1 text-[11px] leading-5 text-muted">Final legal text, eligibility rules and jurisdiction lists will replace this draft before any real-money activation is enabled. Nothing here constitutes legal text acceptance.</p>
        </div>
        <h1 className="mt-6 font-display text-4xl font-semibold text-paper sm:text-5xl">Disclosures <span className="gold">&amp; risk.</span></h1>
        <p className="mt-3 text-muted">Read this page before activating the bot — on paper or otherwise.</p>
      </div>

      <div className="panel-flat mt-10 p-6 sm:p-8">
        <Section n="1" title="Nature of this product">
          <p>PRIMEVEST Trading Bot is a research and simulation product. In its current release it places <strong>no real orders</strong>, holds no client assets, and executes no trades on any venue. Fills shown in the dashboard and track record are simulated at mark prices with modeled fees.</p>
          <p>Future releases may introduce <strong>manual desk execution</strong>: signals are reviewed by a human PRIMEVEST desk who may act at their discretion, and outcomes are settled through the PRIMEVEST ledger. No future release places autonomous orders with client funds.</p>
        </Section>
        <Section n="2" title="Simulated results are not live results">
          <p>Backtests and accelerated simulations omit or cannot capture: slippage, partial fills, failed or dropped transactions, priority and Jito fees, MEV (including sandwiching), liquidity disappearing between signal and settlement, venue halts, oracle/RPC outages, and model drift.</p>
          <p>Simulated equity curves on this site reflect a synthetic seeded environment with live-marked pricing at generation time. They demonstrate system behavior, not expectancy in live markets. Past simulated performance does not predict future results, and does not predict live performance even of this same strategy.</p>
        </Section>
        <Section n="3" title="Risks of the underlying markets">
          <p>Memecoin launch markets exhibit extreme volatility, concentrated ownership, thin and transient liquidity, privileged insider information asymmetry, rug pulls, honeypots, and smart-contract defects. Total loss of any amount allocated is possible and common in this segment — including on tokens that pass every available automated filter.</p>
          <p>Fees (network, priority, venue, and modeled here at 0.3%/side) compound against returns; churn erodes small balances.</p>
        </Section>
        <Section n="4" title="No guarantee; no advice; no fiduciary duty">
          <p>PRIMEVEST makes no representation, warranty or guarantee — express or implied — regarding profitability, accuracy, availability, or fitness for any purpose. Nothing on this site is investment, legal, accounting or tax advice, and no advisory, brokerage or fiduciary relationship is created by your use of the product.</p>
          <p>You alone are responsible for your decisions, your tax obligations, and your compliance with the laws of your jurisdiction.</p>
        </Section>
        <Section n="5" title="Eligibility & jurisdiction">
          <p>Real-money activation (when offered) will require identity verification, risk-disclosure acceptance recorded against your account, and PRIMEVEST desk approval. The product is not offered where restricted by law. PRIMEVEST may decline, suspend or terminate any activation at its sole discretion, including after approval.</p>
        </Section>
        <Section n="6" title="Data sources & accuracy">
          <p>Market data is sourced from public third-party endpoints (including DexScreener and CoinGecko) and seeded synthetic generators for simulation. PRIMEVEST does not warrant the accuracy, completeness or timeliness of any data shown. Venue data — TradingView, Kraken — displayed elsewhere in the PRIMEVEST product belongs to its respective owners.</p>
        </Section>
        <Section n="7" title="Conflicts & incentives">
          <p>In the paper release, PRIMEVEST earns nothing from the bot: no spread, no commission, no performance fee. If real-money activation is introduced, any fees, spreads or desk charges will be disclosed here before you opt in. PRIMEVEST and its staff may hold positions in instruments displayed or simulated by the bot; such positions are not a recommendation.</p>
        </Section>
        <Section n="8" title="Limitation of liability">
          <p>To the fullest extent permitted by law, PRIMEVEST and its affiliates, officers, employees and agents shall not be liable for any indirect, incidental, special, consequential or exemplary damages, or any loss of profits, revenue, data or goodwill, arising out of or relating to use of this product — including trading losses on any future real-money functionality — even if advised of the possibility.</p>
        </Section>
        <Section n="9" title="Kill switch & control">
          <p>The bot can be disabled instantly by PRIMEVEST via an operator flag independent of the user interface. Disabling the bot does not unwind positions already entered under any future manual-execution SOP. You may request deactivation at any time; it takes effect within one business day of desk acknowledgment.</p>
        </Section>
        <Section n="10" title="Contact & complaints">
          <p>For questions, corrections to these disclosures, or complaints: use the support channels inside the PRIMEVEST terminal, with the reference from your activation email (format PB-XXXXXXXX). Complaints are acknowledged within two business days; findings are issued in writing.</p>
        </Section>
      </div>

      <p className="num mt-8 text-[10px] uppercase leading-5 tracking-[0.18em] text-faint">Version 0.1 (paper release) · Last updated 9 November 2026 · Pending counsel sign-off</p>
    </section>
  );
}
