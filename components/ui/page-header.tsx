export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <header className="mb-10">
      <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h1>
      {description && (
        <p className="text-ink-muted mt-3 text-base">{description}</p>
      )}
    </header>
  );
}
