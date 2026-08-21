import { includeDrafts, readMdxDir } from "@/lib/content";
import {
  boolean,
  optionalNumber,
  optionalString,
  requireString,
  stringArray,
} from "@/lib/frontmatter";

export type Project = {
  slug: string;
  title: string;
  description: string;
  image: string | null;
  repo: string | null;
  demo: string | null;
  tags: string[];
  featured: boolean;
  order: number;
  draft: boolean;
  body: string;
};

function load(): Project[] {
  return readMdxDir("projects")
    .map(({ slug, file, data, body }) => ({
      slug,
      title: requireString(data, "title", file),
      description: requireString(data, "description", file),
      image: optionalString(data, "image", file),
      repo: optionalString(data, "repo", file),
      demo: optionalString(data, "demo", file),
      tags: stringArray(data, "tags", file),
      featured: boolean(data, "featured", file),
      // Unordered projects sort last, then alphabetically.
      order: optionalNumber(data, "order", file) ?? Number.MAX_SAFE_INTEGER,
      draft: boolean(data, "draft", file),
      body,
    }))
    .filter((project) => includeDrafts || !project.draft)
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

export function getProjects(): Project[] {
  return load();
}

export function getProject(slug: string): Project | undefined {
  return load().find((project) => project.slug === slug);
}

export function getFeaturedProjects(): Project[] {
  return load().filter((project) => project.featured);
}
