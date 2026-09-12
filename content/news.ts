/**
 * Short dated announcements shown on the landing page, newest first.
 *
 * The data lives in news.json, which `pnpm content:sync` generates from the
 * Notion "News" database. Edit the content in Notion, not here -- a hand edit
 * to the JSON is overwritten by the next sync.
 */

import data from "./news.json";

export type NewsItem = {
  date: string; // YYYY-MM-DD
  /** Plain text. Use `link` for a single trailing "read more" style link. */
  text: string;
  link?: { label: string; href: string };
};

export const news: NewsItem[] = data;
