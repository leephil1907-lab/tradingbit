import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto flex max-w-container flex-col items-center px-4 py-28 text-center">
      <p className="num text-xs tracking-[0.3em] text-gold-500">404</p>
      <h1 className="mt-4 font-display text-4xl text-paper">This market doesn&apos;t exist.</h1>
      <p className="mt-3 max-w-md text-sm text-muted">The page you&apos;re looking for was delisted, or never listed.</p>
      <Link href="/" className="btn btn-gold mt-8">Back to Trading Bot</Link>
    </section>
  );
}
