import { includeDrafts, readMdxDir } from "@/lib/content";
import {
  boolean,
  requireDate,
  requireString,
  stringArray,
} from "@/lib/frontmatter";

export type Post = {
  slug: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
  draft: boolean;
  body: string;
};

function load(): Post[] {
  return readMdxDir("posts")
    .map(({ slug, file, data, body }) => ({
      slug,
      title: requireString(data, "title", file),
      date: requireDate(data, "date", file),
      description: requireString(data, "description", file),
      tags: stringArray(data, "tags", file),
      draft: boolean(data, "draft", file),
      body,
    }))
    .filter((post) => includeDrafts || !post.draft)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getPosts(): Post[] {
  return load();
}

export function getPost(slug: string): Post | undefined {
  return load().find((post) => post.slug === slug);
}

export function getLatestPosts(count: number): Post[] {
  return load().slice(0, count);
}

export function getAllTags(): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const post of load()) {
    for (const tag of post.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}
