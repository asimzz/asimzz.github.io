/**
 * Typed readers for Notion page properties.
 *
 * Same contract as lib/frontmatter.ts: throw at sync time, naming the offending
 * row, rather than letting `undefined` reach the site. The one addition is that
 * a missing property lists the properties that *do* exist -- renaming a column
 * in Notion is the likeliest mistake and the hardest to spot.
 */

import type {
  PageObjectResponse,
  RichTextItemResponse,
} from "@notionhq/client";

export type Row = {
  page: PageObjectResponse;
  /** "post", "project", ... -- used in error messages. */
  kind: string;
};

type Props = PageObjectResponse["properties"];
type Prop = Props[string];

/** `post "Hello World" (https://notion.so/...)` */
export function rowLabel(row: Row): string {
  const titleProp = Object.values(row.page.properties).find(
    (p) => p.type === "title",
  );
  const title =
    titleProp?.type === "title" ? plain(titleProp.title).trim() : "";
  const shown = title.length > 60 ? `${title.slice(0, 57)}...` : title;
  return `${row.kind} ${shown ? `"${shown}"` : "(untitled)"} (${row.page.url})`;
}

export function fail(row: Row, message: string): never {
  throw new Error(`Invalid Notion ${rowLabel(row)}: ${message}`);
}

function plain(rich: RichTextItemResponse[]): string {
  return rich.map((item) => item.plain_text).join("");
}

function get(row: Row, key: string, expected: Prop["type"]): Prop {
  const prop = row.page.properties[key];
  if (!prop) {
    const available = Object.keys(row.page.properties).join(", ");
    fail(
      row,
      `property "${key}" does not exist. This database has: ${available}`,
    );
  }
  if (prop.type !== expected) {
    fail(
      row,
      `property "${key}" must be a ${expected}, but it is a ${prop.type}`,
    );
  }
  return prop;
}

export function title(row: Row, key: string): string {
  const prop = get(row, key, "title");
  const value = prop.type === "title" ? plain(prop.title).trim() : "";
  if (!value) fail(row, `"${key}" is required and must not be empty`);
  return value;
}

export function optionalText(row: Row, key: string): string | null {
  const prop = get(row, key, "rich_text");
  const value = prop.type === "rich_text" ? plain(prop.rich_text).trim() : "";
  return value || null;
}

export function requiredText(row: Row, key: string): string {
  const value = optionalText(row, key);
  if (!value) fail(row, `"${key}" is required and must not be empty`);
  return value;
}

/** A rich text property holding one item per line (shift+enter in Notion). */
export function lines(row: Row, key: string): string[] {
  const prop = get(row, key, "rich_text");
  const raw = prop.type === "rich_text" ? plain(prop.rich_text) : "";
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * Notion dates carry an optional time and an optional range end. The site
 * renders dates with `new Date(\`${iso}T00:00:00Z\`)` (lib/content.ts:45), which
 * yields Invalid Date for a full timestamp -- so normalise to YYYY-MM-DD here.
 */
export function date(row: Row, key: string): string {
  const prop = get(row, key, "date");
  const value = prop.type === "date" ? prop.date : null;
  if (!value?.start) fail(row, `"${key}" is required`);
  if (value.end) {
    fail(row, `"${key}" must be a single date, not a range`);
  }
  const day = value.start.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    fail(row, `"${key}" could not be read as a date: "${value.start}"`);
  }
  return day;
}

export function url(row: Row, key: string): string | null {
  const prop = get(row, key, "url");
  const value = prop.type === "url" ? prop.url?.trim() : null;
  if (!value) return null;
  try {
    new URL(value);
  } catch {
    fail(row, `"${key}" must be an absolute URL, received: "${value}"`);
  }
  return value;
}

export function checkbox(row: Row, key: string): boolean {
  const prop = get(row, key, "checkbox");
  return prop.type === "checkbox" ? prop.checkbox : false;
}

export function multiSelect(row: Row, key: string): string[] {
  const prop = get(row, key, "multi_select");
  if (prop.type !== "multi_select") return [];
  return prop.multi_select.map((option) => option.name.trim()).filter(Boolean);
}

export function select(row: Row, key: string): string | null {
  const prop = get(row, key, "select");
  if (prop.type !== "select") return null;
  return prop.select?.name.trim() || null;
}

export function optionalNumber(row: Row, key: string): number | null {
  const prop = get(row, key, "number");
  if (prop.type !== "number") return null;
  return prop.number ?? null;
}

export type NotionFile = { name: string; url: string };

/**
 * A Files property accepts several uploads; every use here wants at most one,
 * so more than one is an authoring mistake worth catching.
 */
export function singleFile(row: Row, key: string): NotionFile | null {
  const prop = get(row, key, "files");
  if (prop.type !== "files") return null;
  if (prop.files.length === 0) return null;
  if (prop.files.length > 1) {
    fail(
      row,
      `"${key}" must hold at most one file, found ${prop.files.length}`,
    );
  }

  const file = prop.files[0];
  const href = file.type === "external" ? file.external.url : file.file.url;
  return { name: file.name, url: href };
}

/** Validates a value against a closed set, naming the allowed values. */
export function oneOf<T extends string>(
  row: Row,
  key: string,
  value: string,
  allowed: readonly T[],
): T {
  if (!(allowed as readonly string[]).includes(value)) {
    fail(
      row,
      `"${key}" is "${value}", which is not one of: ${allowed.join(", ")}`,
    );
  }
  return value as T;
}
