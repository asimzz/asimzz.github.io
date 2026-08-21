/**
 * Writes public/feed.xml before `next build` runs, so the static export picks
 * it up as a plain asset.
 *
 * This is a build script rather than an app/feed.xml/route.ts because route
 * handlers are not emitted by `output: "export"` unless forced static, and a
 * file on disk is easier to reason about.
 */
import fs from "node:fs";
import path from "node:path";
import { site, siteUrl } from "@/content/site";
import { getPosts } from "@/lib/posts";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toRfc822(date: string): string {
  return new Date(`${date}T00:00:00Z`).toUTCString();
}

function buildFeed(): string {
  const posts = getPosts();
  const updated = posts[0]?.date;

  const items = posts
    .map((post) => {
      const url = `${siteUrl}/blog/${post.slug}/`;
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${toRfc822(post.date)}</pubDate>
      <description>${escapeXml(post.description)}</description>
${post.tags.map((tag) => `      <category>${escapeXml(tag)}</category>`).join("\n")}
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(site.title)}</title>
    <link>${siteUrl}/</link>
    <description>${escapeXml(site.description)}</description>
    <language>${site.locale}</language>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
${updated ? `    <lastBuildDate>${toRfc822(updated)}</lastBuildDate>` : ""}
${items}
  </channel>
</rss>
`;
}

const target = path.join(process.cwd(), "public/feed.xml");
fs.writeFileSync(target, buildFeed(), "utf8");
console.log(`  ✓ wrote public/feed.xml (${getPosts().length} posts)`);
