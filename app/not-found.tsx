import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <p className="text-accent font-mono text-sm">404</p>
      <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight">
        Page not found
      </h1>
      <p className="text-ink-muted mt-3 text-base">
        That page does not exist, or it moved.
      </p>
      <Link
        href="/"
        className="border-line text-ink-muted hover:border-accent hover:text-accent mt-8 inline-block rounded-full border px-4 py-1.5 text-sm transition-colors"
      >
        &larr; Back home
      </Link>
    </div>
  );
}
