import type { MetadataRoute } from "next";
import { siteUrl } from "@/content/site";
import { getPosts } from "@/lib/posts";
import { getProjects } from "@/lib/projects";

// Metadata files compile to route handlers, which `output: "export"` refuses to
// emit unless they are explicitly static.
export const dynamic = "force-static";

/** Emitted as out/sitemap.xml during the static export. */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/blog", "/projects", "/publications"].map(
    (route) => ({
      url: `${siteUrl}${route}/`,
      changeFrequency: "monthly" as const,
      priority: route === "" ? 1 : 0.8,
    }),
  );

  const posts = getPosts().map((post) => ({
    url: `${siteUrl}/blog/${post.slug}/`,
    lastModified: post.date,
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));

  const projects = getProjects().map((project) => ({
    url: `${siteUrl}/projects/${project.slug}/`,
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...posts, ...projects];
}
