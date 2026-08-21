/**
 * Frontmatter validation. Content is authored by hand, so a typo in a key is
 * the likeliest failure. These helpers throw at build time with the offending
 * file named, instead of letting `undefined` reach the page.
 */

type Raw = Record<string, unknown>;

function fail(file: string, message: string): never {
  throw new Error(`Invalid frontmatter in ${file}: ${message}`);
}

export function requireString(raw: Raw, key: string, file: string): string {
  const value = raw[key];
  if (typeof value !== "string" || value.trim() === "") {
    fail(file, `"${key}" is required and must be a non-empty string`);
  }
  return value.trim();
}

export function optionalString(
  raw: Raw,
  key: string,
  file: string,
): string | null {
  const value = raw[key];
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") fail(file, `"${key}" must be a string`);
  return value.trim() || null;
}

export function requireDate(raw: Raw, key: string, file: string): string {
  const value = raw[key];
  // gray-matter's YAML parser turns unquoted YYYY-MM-DD into a Date object.
  const asString =
    value instanceof Date ? value.toISOString().slice(0, 10) : value;
  if (typeof asString !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(asString)) {
    fail(file, `"${key}" is required and must be YYYY-MM-DD`);
  }
  return asString;
}

export function stringArray(raw: Raw, key: string, file: string): string[] {
  const value = raw[key];
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.some((v) => typeof v !== "string")) {
    fail(file, `"${key}" must be a list of strings`);
  }
  return value as string[];
}

export function boolean(raw: Raw, key: string, file: string): boolean {
  const value = raw[key];
  if (value === undefined || value === null) return false;
  if (typeof value !== "boolean") fail(file, `"${key}" must be true or false`);
  return value;
}

export function optionalNumber(
  raw: Raw,
  key: string,
  file: string,
): number | null {
  const value = raw[key];
  if (value === undefined || value === null) return null;
  if (typeof value !== "number" || Number.isNaN(value)) {
    fail(file, `"${key}" must be a number`);
  }
  return value;
}
