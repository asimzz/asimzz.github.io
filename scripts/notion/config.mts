/**
 * Environment for the Notion sync. Read by scripts/ only -- never by the app,
 * so the token cannot reach a client bundle.
 */

import { extractDatabaseId } from "@notionhq/client";

export const MODULES = [
  "profile",
  "socials",
  "news",
  "publications",
  "projects",
  "posts",
] as const;

export type ModuleKey = (typeof MODULES)[number];

const ENV_KEY: Record<ModuleKey, string> = {
  profile: "NOTION_DB_PROFILE",
  socials: "NOTION_DB_SOCIALS",
  news: "NOTION_DB_NEWS",
  publications: "NOTION_DB_PUBLICATIONS",
  projects: "NOTION_DB_PROJECTS",
  posts: "NOTION_DB_POSTS",
};

export type Config = {
  token: string;
  databases: Record<ModuleKey, string>;
};

/** A bare Notion id: 32 hex characters, dashed or not. */
const BARE_ID = /^[0-9a-f]{32}$|^[0-9a-f-]{36}$/i;

/**
 * Accepts either a raw database id or the URL copied from Notion's address
 * bar, because nobody wants to dig the id out of a URL by hand.
 */
function toDatabaseId(raw: string, envKey: string): string {
  const value = raw.trim();
  if (BARE_ID.test(value)) return value.replace(/-/g, "");

  const extracted = extractDatabaseId(value);
  if (!extracted) {
    throw new Error(
      `${envKey} is not a Notion database id or URL: "${value}"\n` +
        `  Expected a 32-character id, or the URL of the database page.`,
    );
  }
  return extracted;
}

export function readConfig(): Config {
  const token = process.env.NOTION_TOKEN?.trim();
  const missing: string[] = [];
  if (!token) missing.push("NOTION_TOKEN");

  const databases = {} as Record<ModuleKey, string>;
  for (const key of MODULES) {
    const envKey = ENV_KEY[key];
    const raw = process.env[envKey]?.trim();
    if (!raw) {
      missing.push(envKey);
      continue;
    }
    databases[key] = toDatabaseId(raw, envKey);
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing environment variable(s): ${missing.join(", ")}\n` +
        `  Locally, put them in .env.local (see .env.example).\n` +
        `  In CI, NOTION_TOKEN is an Actions secret and the NOTION_DB_* ids are Actions variables.`,
    );
  }

  return { token: token as string, databases };
}
