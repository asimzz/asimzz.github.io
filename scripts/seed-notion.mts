/**
 * One-time migration: creates the six Notion databases and fills them with the
 * content currently in this repo, then prints the ids to paste into .env.local.
 *
 * Run once, check the result in Notion, then `pnpm content:sync` and confirm
 * `git diff content/` is empty -- that proves the round trip is lossless.
 *
 *   NOTION_TOKEN=ntn_xxx NOTION_PARENT_PAGE=<page id or url> pnpm content:seed
 *
 * The parent page must already be shared with the integration
 * (Notion -> the page -> ... -> Connections -> your integration).
 *
 * Two things this deliberately does not do: upload the profile photo and the
 * CV. Notion's file-upload API is a multi-step dance not worth automating for
 * two files you will drag in once by hand.
 */

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { Client, extractPageId, isFullDatabase } from "@notionhq/client";
import type { CreateDatabaseParameters } from "@notionhq/client";

const ROOT = path.resolve(import.meta.dirname, "..");
const read = (relative: string) =>
  fs.readFileSync(path.join(ROOT, relative), "utf8");

type Properties = NonNullable<
  CreateDatabaseParameters["initial_data_source"]
>["properties"];

const SOCIAL_ICONS = ["email", "github", "linkedin", "scholar", "x", "rss"];

const SCHEMAS: Record<string, Properties> = {
  Profile: {
    Name: { title: {} },
    Role: { rich_text: {} },
    Affiliation: { rich_text: {} },
    Location: { rich_text: {} },
    Tagline: { rich_text: {} },
    "Research Interests": { rich_text: {} },
    Photo: { files: {} },
    CV: { files: {} },
  },
  Socials: {
    Label: { title: {} },
    URL: { url: {} },
    Icon: { select: { options: SOCIAL_ICONS.map((name) => ({ name })) } },
    Order: { number: {} },
  },
  News: {
    Text: { title: {} },
    Date: { date: {} },
    "Link Label": { rich_text: {} },
    "Link URL": { url: {} },
  },
  Publications: {
    Title: { title: {} },
  },
  Projects: {
    Title: { title: {} },
    Slug: { rich_text: {} },
    Description: { rich_text: {} },
    Cover: { files: {} },
    Repo: { url: {} },
    Demo: { url: {} },
    Tags: { multi_select: { options: [] } },
    Featured: { checkbox: {} },
    Order: { number: {} },
    Draft: { checkbox: {} },
  },
  Posts: {
    Title: { title: {} },
    Slug: { rich_text: {} },
    Date: { date: {} },
    Description: { rich_text: {} },
    Tags: { multi_select: { options: [] } },
    Draft: { checkbox: {} },
  },
};

/**
 * Markdown hard wraps are presentational, but Notion turns every wrapped line
 * into its own paragraph block -- and its markdown export then cannot tell a
 * wrap from a paragraph break. Join wrapped lines before sending so one
 * paragraph becomes one block.
 */
function unwrapParagraphs(markdown: string): string {
  const out: string[] = [];
  let paragraph: string[] = [];
  let inFence = false;

  const flush = () => {
    if (paragraph.length > 0) {
      out.push(paragraph.join(" "));
      paragraph = [];
    }
  };

  for (const line of markdown.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) {
      flush();
      inFence = !inFence;
      out.push(line);
      continue;
    }
    if (inFence) {
      out.push(line);
      continue;
    }
    if (line.trim() === "") {
      flush();
      out.push("");
      continue;
    }
    // Anything with its own block syntax stays on its own line.
    if (/^\s*(#{1,6}\s|[-*+]\s|\d+[.)]\s|>|\||\$\$)/.test(line)) {
      flush();
      out.push(line);
      continue;
    }
    paragraph.push(line.trim());
  }
  flush();

  return out.join("\n");
}

const text = (value: string) => [{ text: { content: value } }];
const richText = (value: string | null) =>
  value ? { rich_text: text(value) } : { rich_text: [] };

async function main() {
  const token = process.env.NOTION_TOKEN?.trim();
  const parentRaw = process.env.NOTION_PARENT_PAGE?.trim();
  if (!token || !parentRaw) {
    throw new Error(
      "Set NOTION_TOKEN and NOTION_PARENT_PAGE.\n" +
        "  NOTION_PARENT_PAGE is the page the databases are created under -- " +
        "its id, or just its URL.",
    );
  }
  const parentId = /^[0-9a-f-]{32,36}$/i.test(parentRaw)
    ? parentRaw.replace(/-/g, "")
    : extractPageId(parentRaw);
  if (!parentId) {
    throw new Error(
      `NOTION_PARENT_PAGE is not a page id or URL: "${parentRaw}"`,
    );
  }

  const notion = new Client({ auth: token });

  // --- create the databases ------------------------------------------------
  const dataSources = new Map<string, string>();
  const databaseIds = new Map<string, string>();

  for (const [name, properties] of Object.entries(SCHEMAS)) {
    const database = await notion.databases.create({
      parent: { type: "page_id", page_id: parentId },
      title: text(name),
      initial_data_source: { properties },
    });
    if (!isFullDatabase(database)) {
      throw new Error(`Notion did not return a full database for "${name}".`);
    }
    databaseIds.set(name, database.id);
    dataSources.set(name, database.data_sources[0].id);
    console.log(`created database ${name}`);
  }

  const into = (name: string) => ({ data_source_id: dataSources.get(name)! });

  /** Pushes a markdown body into a freshly created page. */
  const setBody = async (pageId: string, markdown: string) => {
    if (!markdown.trim()) return;
    await notion.pages.updateMarkdown({
      page_id: pageId,
      type: "insert_content",
      insert_content: {
        content: unwrapParagraphs(markdown),
        position: { type: "end" },
      },
    });
  };

  // --- profile -------------------------------------------------------------
  const profile = JSON.parse(read("content/profile.json")) as {
    name: string;
    role: string;
    affiliation: string | null;
    location: string | null;
    description: string;
    researchInterests: string[];
    bio: string;
    socials: { label: string; href: string; icon: string }[];
  };

  const profilePage = await notion.pages.create({
    parent: into("Profile"),
    properties: {
      Name: { title: text(profile.name) },
      Role: richText(profile.role),
      Affiliation: richText(profile.affiliation),
      Location: richText(profile.location),
      Tagline: richText(profile.description),
      "Research Interests": richText(profile.researchInterests.join("\n")),
    },
  });
  await setBody(profilePage.id, profile.bio);
  console.log("seeded profile");

  for (const [index, social] of profile.socials.entries()) {
    await notion.pages.create({
      parent: into("Socials"),
      properties: {
        Label: { title: text(social.label) },
        URL: { url: social.href },
        Icon: { select: { name: social.icon } },
        Order: { number: index + 1 },
      },
    });
  }
  console.log(`seeded ${profile.socials.length} socials`);

  // --- news ----------------------------------------------------------------
  const news = JSON.parse(read("content/news.json")) as {
    date: string;
    text: string;
    link?: { label: string; href: string };
  }[];

  for (const item of news) {
    await notion.pages.create({
      parent: into("News"),
      properties: {
        Text: { title: text(item.text) },
        Date: { date: { start: item.date } },
        "Link Label": richText(item.link?.label ?? null),
        "Link URL": { url: item.link?.href ?? null },
      },
    });
  }
  console.log(`seeded ${news.length} news items`);

  // --- publications --------------------------------------------------------
  // Split the .bib on entry boundaries; each entry becomes one page whose body
  // is a single code block, which is what the sync reads back.
  const bib = read("content/publications.bib");
  const entries = bib
    .split(/^(?=@)/m)
    .map((entry) => entry.trim())
    .filter((entry) => entry.startsWith("@"));

  for (const entry of entries) {
    const key = /@\w+\s*\{\s*([^,\s]+)/.exec(entry)?.[1] ?? "entry";
    const titleMatch = /title\s*=\s*[{"]+([^}"]+)/i.exec(entry);
    const page = await notion.pages.create({
      parent: into("Publications"),
      properties: { Title: { title: text(titleMatch?.[1]?.trim() ?? key) } },
    });
    await setBody(page.id, ["```", entry, "```"].join("\n"));
  }
  console.log(`seeded ${entries.length} publications`);

  // --- posts and projects --------------------------------------------------
  const mdxFiles = (directory: string) => {
    const absolute = path.join(ROOT, "content", directory);
    if (!fs.existsSync(absolute)) return [];
    return fs
      .readdirSync(absolute)
      .filter((name) => name.endsWith(".mdx"))
      .map((name) => {
        const parsed = matter(read(path.join("content", directory, name)));
        return {
          slug: name.replace(/\.mdx$/, ""),
          data: parsed.data as Record<string, unknown>,
          body: parsed.content.trim(),
        };
      });
  };

  const asString = (value: unknown) =>
    typeof value === "string" ? value : null;
  const asDate = (value: unknown) =>
    value instanceof Date
      ? value.toISOString().slice(0, 10)
      : (asString(value) ?? "");
  const asTags = (value: unknown) =>
    Array.isArray(value)
      ? value
          .filter((tag): tag is string => typeof tag === "string")
          .map((name) => ({ name }))
      : [];

  for (const post of mdxFiles("posts")) {
    const page = await notion.pages.create({
      parent: into("Posts"),
      properties: {
        Title: { title: text(asString(post.data.title) ?? post.slug) },
        Slug: { rich_text: text(post.slug) },
        Date: { date: { start: asDate(post.data.date) } },
        Description: richText(asString(post.data.description)),
        Tags: { multi_select: asTags(post.data.tags) },
        Draft: { checkbox: post.data.draft === true },
      },
    });
    await setBody(page.id, post.body);
  }
  console.log(`seeded ${mdxFiles("posts").length} posts`);

  for (const project of mdxFiles("projects")) {
    const order = project.data.order;
    const page = await notion.pages.create({
      parent: into("Projects"),
      properties: {
        Title: { title: text(asString(project.data.title) ?? project.slug) },
        Slug: { rich_text: text(project.slug) },
        Description: richText(asString(project.data.description)),
        Repo: { url: asString(project.data.repo) },
        Demo: { url: asString(project.data.demo) },
        Tags: { multi_select: asTags(project.data.tags) },
        Featured: { checkbox: project.data.featured === true },
        Order: { number: typeof order === "number" ? order : null },
        Draft: { checkbox: project.data.draft === true },
      },
    });
    await setBody(page.id, project.body);
  }
  console.log(`seeded ${mdxFiles("projects").length} projects`);

  // --- what to do next -----------------------------------------------------
  const envLines = [
    ["NOTION_DB_PROFILE", "Profile"],
    ["NOTION_DB_SOCIALS", "Socials"],
    ["NOTION_DB_NEWS", "News"],
    ["NOTION_DB_PUBLICATIONS", "Publications"],
    ["NOTION_DB_PROJECTS", "Projects"],
    ["NOTION_DB_POSTS", "Posts"],
  ].map(([key, name]) => `${key}=${databaseIds.get(name)}`);

  console.log(
    [
      "",
      "Add these to .env.local, and as Actions variables in GitHub:",
      "",
      ...envLines,
      "",
      "Then, in Notion:",
      "  1. Open the Profile row and upload the Photo and the CV.",
      "  2. Run `pnpm content:sync`.",
      "  3. `git diff content/` should be empty apart from the profile image path.",
      "",
    ].join("\n"),
  );
}

main().catch((error: unknown) => {
  console.error(
    `\n${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(1);
});
