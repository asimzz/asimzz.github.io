import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export type MdxFile = {
  slug: string;
  file: string;
  data: Record<string, unknown>;
  body: string;
};

/**
 * Reads every .mdx file in a content directory. Runs at build time only --
 * every caller is a server component or a build script.
 */
export function readMdxDir(dir: string): MdxFile[] {
  const absolute = path.join(process.cwd(), "content", dir);
  if (!fs.existsSync(absolute)) return [];

  return fs
    .readdirSync(absolute)
    .filter((name) => name.endsWith(".mdx"))
    .map((name) => {
      const file = path.join(dir, name);
      const parsed = matter(fs.readFileSync(path.join(absolute, name), "utf8"));
      return {
        slug: name.replace(/\.mdx$/, ""),
        file,
        data: parsed.data as Record<string, unknown>,
        body: parsed.content,
      };
    });
}

/**
 * Drafts are visible under `next dev` only. Keyed on "development" rather
 * than "not production" so a standalone build script -- where NODE_ENV is
 * unset -- excludes them too.
 */
export const includeDrafts = process.env.NODE_ENV === "development";

export function formatDate(iso: string): string {
  // Parsed as UTC so the rendered day never shifts with the build machine's
  // timezone.
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
