import { profile } from "@/content/site";
import { ET_AL, type Publication } from "@/lib/publications";

/** Compares an author string against the site owner, surname first or last. */
function isOwner(author: string): boolean {
  const surname = profile.name.split(" ").at(-1)?.toLowerCase();
  if (!surname) return false;
  const normalized = author.toLowerCase();
  return (
    normalized === profile.name.toLowerCase() ||
    (normalized.includes(surname) &&
      normalized.includes(profile.name.split(" ")[0].toLowerCase()))
  );
}

export function PublicationEntry({
  publication,
}: {
  publication: Publication;
}) {
  return (
    <article className="border-line border-b pb-6 last:border-b-0">
      <h3 className="font-serif text-base leading-snug font-semibold tracking-tight">
        {publication.title}
      </h3>

      {publication.authors.length > 0 && (
        <p className="text-ink-muted mt-1.5 text-sm">
          {publication.authors.map((author, index) => (
            <span key={`${author}-${index}`}>
              {isOwner(author) ? (
                <strong className="text-ink font-semibold">{author}</strong>
              ) : (
                author
              )}
              {index < publication.authors.length - 1 &&
                // "Asim Mohamed et al.", not "Asim Mohamed, et al."
                (publication.authors[index + 1] === ET_AL ? " " : ", ")}
            </span>
          ))}
        </p>
      )}

      {publication.venue && (
        <p className="text-ink-faint mt-1 text-sm italic">
          {publication.venue}
          {publication.detail && (
            <span className="not-italic">, {publication.detail}</span>
          )}
          <span className="not-italic"> ({publication.year})</span>
        </p>
      )}

      {publication.links.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {publication.links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="border-line text-ink-muted hover:border-accent hover:text-accent rounded border px-2 py-0.5 text-xs transition-colors"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
