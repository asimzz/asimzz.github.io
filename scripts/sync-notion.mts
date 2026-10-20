/**
 * Pulls every piece of site content out of Notion and writes it into the files
 * the app already reads.
 *
 * Notion is the source of truth; content/ is a generated one-way mirror. Editing
 * a generated file by hand loses the edit on the next sync.
 *
 * Nothing here runs during `next build`. The build reads the committed output,
 * so a clone with no NOTION_TOKEN still builds the real site, and the token is
 * never in the Next build's environment where it could reach a client bundle.
 *
 *   pnpm content:sync
 */

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import {
  Client,
  collectAllDataSourceRows,
  isFullDatabase,
  isFullPage,
} from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client";
import { MODULES, readConfig, type ModuleKey } from "./notion/config.mts";
import {
  checkbox,
  date,
  fail,
  lines,
  multiSelect,
  optionalNumber,
  optionalText,
  requiredText,
  rowLabel,
  select,
  singleFile,
  title,
  url,
  oneOf,
  type Row,
} from "./notion/props.mts";
import {
  escapeForMdx,
  fetchMarkdown,
  imageUrls,
  rewriteImageUrls,
  singleCodeBlock,
} from "./notion/markdown.mts";
import { downloadImage, downloadTo } from "./notion/assets.mts";

const ROOT = path.resolve(import.meta.dirname, "..");

/** Directories this script owns entirely: anything it does not write is pruned. */
const MANAGED = ["content/posts", "content/projects", "public/img/notion"];

/** Must stay in step with SocialLink["icon"] in content/site.ts. */
const SOCIAL_ICONS = [
  "email",
  "github",
  "linkedin",
  "scholar",
  "x",
  "rss",
] as const;

type Output = { path: string; data: string | Buffer };

const outputs: Output[] = [];
const emit = (filePath: string, data: string | Buffer) =>
  outputs.push({ path: filePath, data });

// ---------------------------------------------------------------------------
// Notion access
// ---------------------------------------------------------------------------

async function fetchRows(
  notion: Client,
  databaseId: string,
  kind: string,
): Promise<Row[]> {
  const database = await notion.databases.retrieve({ database_id: databaseId });
  if (!isFullDatabase(database)) {
    throw new Error(
      `The Notion database for ${kind} (${databaseId}) came back without its schema.\n` +
        `  Usually the integration has not been shared with that database.`,
    );
  }

  // Since API version 2025-09-03 a database holds one or more data sources, and
  // rows are queried from the data source rather than the database itself.
  const dataSource = database.data_sources[0];
  if (!dataSource) {
    throw new Error(
      `The Notion database for ${kind} (${databaseId}) has no data source.`,
    );
  }

  const rows = await collectAllDataSourceRows(notion, {
    data_source_id: dataSource.id,
  });

  return rows
    .filter((row): row is PageObjectResponse => isFullPage(row))
    .filter((page) => !page.in_trash && !page.archived)
    .map((page) => ({ page, kind }));
}

// ---------------------------------------------------------------------------
// Slugs
// ---------------------------------------------------------------------------

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function readSlug(row: Row, fallbackTitle: string): string {
  const explicit = optionalText(row, "Slug");
  const slug = explicit ?? slugify(fallbackTitle);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    fail(
      row,
      `"Slug" must be lowercase words joined by hyphens, received: "${slug}"`,
    );
  }
  return slug;
}

/** Maps Notion page id -> slug for what is currently committed. */
function committedSlugs(directory: string): Map<string, string> {
  const absolute = path.join(ROOT, directory);
  const map = new Map<string, string>();
  if (!fs.existsSync(absolute)) return map;

  for (const name of fs.readdirSync(absolute)) {
    if (!name.endsWith(".mdx")) continue;
    const parsed = matter(fs.readFileSync(path.join(absolute, name), "utf8"));
    const id = parsed.data.notionId;
    if (typeof id === "string") map.set(id, name.replace(/\.mdx$/, ""));
  }
  return map;
}

/**
 * A static export on GitHub Pages has no redirect layer, so a changed slug
 * breaks the old URL permanently and silently. Matching on the Notion page id
 * -- which survives title and slug edits -- catches it before it ships.
 */
function guardSlugChanges(
  previous: Map<string, string>,
  current: Map<string, string>,
  routePrefix: string,
): void {
  if (process.env.ALLOW_SLUG_CHANGE === "1") return;

  const changes: string[] = [];
  for (const [id, slug] of current) {
    const before = previous.get(id);
    if (before && before !== slug) {
      changes.push(`  ${routePrefix}/${before}/  ->  ${routePrefix}/${slug}/`);
    }
  }
  if (changes.length === 0) return;

  throw new Error(
    `A slug changed, which permanently breaks the old URL -- a static export on ` +
      `GitHub Pages cannot redirect:\n${changes.join("\n")}\n` +
      `  Re-run with ALLOW_SLUG_CHANGE=1 if you intend to retire those URLs.`,
  );
}

// ---------------------------------------------------------------------------
// Bodies
// ---------------------------------------------------------------------------

/** Fetches a body, localises its images, and makes it safe to compile as MDX. */
async function readBody(
  notion: Client,
  row: Row,
  directory: string,
  slug: string,
): Promise<string> {
  const label = rowLabel(row);
  // Notion exports each empty paragraph as a literal <empty-block/> tag.
  const raw = (await fetchMarkdown(notion, row.page.id, label)).replace(
    /^<empty-block\/>\s*$/gm,
    "",
  );

  const replacements = new Map<string, string>();
  for (const [index, href] of imageUrls(raw).entries()) {
    const image = await downloadImage(
      href,
      directory,
      `${slug}-${index + 1}`,
      label,
    );
    emit(path.join("public", image.path), image.data);
    replacements.set(href, image.href);
  }

  return escapeForMdx(rewriteImageUrls(raw, replacements));
}

// ---------------------------------------------------------------------------
// Modules
// ---------------------------------------------------------------------------

async function syncProfile(notion: Client, rows: Row[], socialRows: Row[]) {
  if (rows.length !== 1) {
    throw new Error(
      `Expected exactly one row in the Notion Profile database, found ${rows.length}.`,
    );
  }
  const row = rows[0];
  const label = rowLabel(row);
  const name = title(row, "Name");

  const photo = singleFile(row, "Photo");
  if (!photo) fail(row, `"Photo" is required`);
  const image = await downloadImage(photo.url, "profile", "profile", label);
  emit(path.join("public", image.path), image.data);

  const cvFile = singleFile(row, "CV");
  if (cvFile) {
    const cv = await downloadTo(cvFile.url, "public/cv.pdf", label);
    emit(cv.path, cv.data);
  }

  const ordered = socialRows
    .map((social) => {
      const href = url(social, "URL");
      if (!href) fail(social, `"URL" is required`);
      const icon = select(social, "Icon");
      if (!icon) fail(social, `"Icon" is required`);
      return {
        order: optionalNumber(social, "Order") ?? Number.MAX_SAFE_INTEGER,
        link: {
          label: title(social, "Label"),
          href,
          icon: oneOf(social, "Icon", icon, SOCIAL_ICONS),
        },
      };
    })
    .sort(
      (a, b) => a.order - b.order || a.link.label.localeCompare(b.link.label),
    );
  const socials = ordered.map((entry) => entry.link);

  emit(
    "content/profile.json",
    json({
      name,
      role: requiredText(row, "Role"),
      affiliation: optionalText(row, "Affiliation"),
      location: optionalText(row, "Location"),
      description: requiredText(row, "Tagline"),
      image: {
        src: image.href,
        alt: name,
        width: image.width,
        height: image.height,
      },
      cv: cvFile ? "/cv.pdf" : null,
      researchInterests: lines(row, "Research Interests"),
      bio: await readBody(notion, row, "profile", "bio"),
      socials,
    }),
  );
}

function syncNews(rows: Row[]) {
  const items = rows
    .map((row) => {
      const linkLabel = optionalText(row, "Link Label");
      const linkHref = url(row, "Link URL");
      if (Boolean(linkLabel) !== Boolean(linkHref)) {
        fail(
          row,
          `"Link Label" and "Link URL" must be filled in together or left both empty`,
        );
      }
      return {
        date: date(row, "Date"),
        text: title(row, "Text"),
        ...(linkLabel && linkHref
          ? { link: { label: linkLabel, href: linkHref } }
          : {}),
      };
    })
    .sort(
      (a, b) => b.date.localeCompare(a.date) || a.text.localeCompare(b.text),
    );

  emit("content/news.json", json(items));
}

async function syncPublications(notion: Client, rows: Row[]) {
  const entries: { key: string; bibtex: string }[] = [];

  for (const row of rows) {
    const label = rowLabel(row);
    const markdown = await fetchMarkdown(notion, row.page.id, label);
    const bibtex = singleCodeBlock(markdown, label);

    const key = /@\w+\s*\{\s*([^,\s]+)/.exec(bibtex)?.[1];
    if (!key) {
      throw new Error(
        `${label} does not look like a BibTeX entry -- no citation key found.`,
      );
    }
    if (entries.some((entry) => entry.key === key)) {
      throw new Error(
        `Two publications share the BibTeX citation key "${key}".`,
      );
    }
    entries.push({ key, bibtex });
  }

  entries.sort((a, b) => a.key.localeCompare(b.key));

  emit(
    "content/publications.bib",
    `${GENERATED_NOTE.replace(/^/gm, "% ")}\n\n` +
      `${entries.map((entry) => entry.bibtex).join("\n\n")}\n`,
  );
}

async function syncPosts(notion: Client, rows: Row[]) {
  const slugs = new Map<string, string>();

  for (const row of rows) {
    const heading = title(row, "Title");
    const slug = readSlug(row, heading);
    assertUniqueSlug(slugs, slug, row);
    slugs.set(row.page.id, slug);

    const body = await readBody(notion, row, "posts", slug);
    emit(
      `content/posts/${slug}.mdx`,
      mdx(
        {
          title: heading,
          date: date(row, "Date"),
          description: requiredText(row, "Description"),
          tags: multiSelect(row, "Tags"),
          draft: checkbox(row, "Draft"),
          notionId: row.page.id,
        },
        body,
      ),
    );
  }

  guardSlugChanges(committedSlugs("content/posts"), slugs, "/blog");
}

async function syncProjects(notion: Client, rows: Row[]) {
  const slugs = new Map<string, string>();

  for (const row of rows) {
    const heading = title(row, "Title");
    const slug = readSlug(row, heading);
    assertUniqueSlug(slugs, slug, row);
    slugs.set(row.page.id, slug);

    const cover = singleFile(row, "Cover");
    let image: string | null = null;
    if (cover) {
      const downloaded = await downloadImage(
        cover.url,
        "projects",
        slug,
        rowLabel(row),
      );
      emit(path.join("public", downloaded.path), downloaded.data);
      image = downloaded.href;
    }

    const body = await readBody(notion, row, "projects", slug);
    emit(
      `content/projects/${slug}.mdx`,
      mdx(
        {
          title: heading,
          description: requiredText(row, "Description"),
          image,
          repo: url(row, "Repo"),
          demo: url(row, "Demo"),
          tags: multiSelect(row, "Tags"),
          featured: checkbox(row, "Featured"),
          order: optionalNumber(row, "Order"),
          draft: checkbox(row, "Draft"),
          notionId: row.page.id,
        },
        body,
      ),
    );
  }

  guardSlugChanges(committedSlugs("content/projects"), slugs, "/projects");
}

function assertUniqueSlug(seen: Map<string, string>, slug: string, row: Row) {
  if ([...seen.values()].includes(slug)) {
    fail(row, `the slug "${slug}" is already used by another row`);
  }
}

// ---------------------------------------------------------------------------
// Serialisation
// ---------------------------------------------------------------------------

const GENERATED_NOTE =
  "Generated by `pnpm content:sync` from Notion. Do not edit by hand:\n" +
  "your changes are overwritten on the next sync. Edit the content in Notion.";

/** Deterministic: a stray timestamp here would rebuild the site every cron run. */
function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

/**
 * gray-matter writes the YAML, so quoting and escaping stay correct.
 *
 * No "generated file" banner in the body: MDX has no HTML comments, and a
 * `{/* ... *\/}` expression is what .prettierignore already warns about. The
 * `notionId` key is the marker instead -- it is also what the slug guard reads.
 */
function mdx(data: Record<string, unknown>, body: string): string {
  const defined = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== null),
  );
  return matter.stringify(body, defined);
}

// ---------------------------------------------------------------------------
// Writing
// ---------------------------------------------------------------------------

/**
 * Everything is fetched before anything is written, so a failure halfway
 * through leaves the committed content untouched rather than half-updated.
 */
function writeAll(): { written: number; removed: number } {
  const keep = new Set(outputs.map((output) => path.join(ROOT, output.path)));

  for (const output of outputs) {
    const absolute = path.join(ROOT, output.path);
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, output.data);
  }

  let removed = 0;
  for (const directory of MANAGED) {
    const absolute = path.join(ROOT, directory);
    if (!fs.existsSync(absolute)) continue;
    for (const entry of fs.readdirSync(absolute, {
      recursive: true,
      withFileTypes: true,
    })) {
      if (!entry.isFile()) continue;
      const file = path.join(entry.parentPath, entry.name);
      if (!keep.has(file)) {
        fs.rmSync(file);
        removed += 1;
      }
    }
  }

  return { written: outputs.length, removed };
}

/**
 * A mistyped database id returns an empty result rather than an error, which
 * would otherwise delete every post in the repo and commit that.
 */
function guardEmpty(rows: Record<ModuleKey, Row[]>): void {
  for (const [moduleKey, directory] of [
    ["posts", "content/posts"],
    ["projects", "content/projects"],
  ] as const) {
    const existing = fs.existsSync(path.join(ROOT, directory))
      ? fs
          .readdirSync(path.join(ROOT, directory))
          .filter((f) => f.endsWith(".mdx"))
      : [];
    if (rows[moduleKey].length === 0 && existing.length > 0) {
      throw new Error(
        `The Notion ${moduleKey} database returned no rows, but ${existing.length} ` +
          `file(s) exist in ${directory}.\n` +
          `  This is almost always a wrong database id or an integration that has ` +
          `not been shared with the database.\n` +
          `  Re-run with ALLOW_EMPTY=1 if you really have deleted all of them.`,
      );
    }
  }
}

// ---------------------------------------------------------------------------

async function main() {
  const config = readConfig();
  const notion = new Client({ auth: config.token });

  const rows = {} as Record<ModuleKey, Row[]>;
  for (const moduleKey of MODULES) {
    rows[moduleKey] = await fetchRows(
      notion,
      config.databases[moduleKey],
      moduleKey,
    );
    console.log(`  ${moduleKey}: ${rows[moduleKey].length} row(s)`);
  }

  if (process.env.ALLOW_EMPTY !== "1") guardEmpty(rows);

  await syncProfile(notion, rows.profile, rows.socials);
  syncNews(rows.news);
  await syncPublications(notion, rows.publications);
  await syncPosts(notion, rows.posts);
  await syncProjects(notion, rows.projects);

  const { written, removed } = writeAll();
  console.log(`\nWrote ${written} file(s), removed ${removed}.`);
}

main().catch((error: unknown) => {
  console.error(
    `\n${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(1);
});
