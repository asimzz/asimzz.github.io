import fs from "node:fs";
import path from "node:path";
import { profile } from "@/content/site";

/**
 * Resolves the CV link, but only if the PDF is really in public/.
 *
 * A static export cannot check for the file at request time, and a hardcoded
 * link would 404 for every visitor until the PDF is added. Checking at build
 * time means dropping the file in is the only step -- no code change -- and a
 * missing file hides the link instead of shipping a dead one.
 */
export function getCvHref(): string | null {
  const href = profile.cv;
  if (!href) return null;

  const file = path.join(process.cwd(), "public", href.replace(/^\/+/, ""));
  return fs.existsSync(file) ? href : null;
}
