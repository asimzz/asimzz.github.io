import Link from "next/link";

/** A titled block on the landing page, with an optional "see all" link. */
export function Section({
  title,
  href,
  linkLabel = "see all",
  children,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-14">
      <div className="border-line mb-5 flex items-baseline justify-between border-b pb-2">
        <h2 className="font-serif text-xl font-semibold tracking-tight">
          {title}
        </h2>
        {href && (
          <Link
            href={href}
            className="text-ink-faint hover:text-accent text-sm transition-colors"
          >
            {linkLabel} &rarr;
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
