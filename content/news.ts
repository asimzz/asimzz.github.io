/**
 * Short dated announcements shown on the landing page, newest first.
 * TODO(asim): replace with real entries, or leave the array empty to hide the
 * section entirely.
 */

export type NewsItem = {
  date: string; // YYYY-MM-DD
  /** Plain text. Use `link` for a single trailing "read more" style link. */
  text: string;
  link?: { label: string; href: string };
};

export const news: NewsItem[] = [
  {
    date: "2026-08-01",
    text: "Placeholder news item — replace or delete these two entries.",
  },
  {
    date: "2026-05-15",
    text: "News entries support one optional link.",
    link: { label: "example", href: "https://example.com" },
  },
];
