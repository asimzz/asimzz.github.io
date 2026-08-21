import type { MetadataRoute } from "next";
import { siteUrl } from "@/content/site";

// Metadata files compile to route handlers, which `output: "export"` refuses to
// emit unless they are explicitly static.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
