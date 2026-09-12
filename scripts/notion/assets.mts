/**
 * Downloads files uploaded to Notion into public/.
 *
 * Notion serves uploads from signed S3 URLs that expire after about an hour,
 * so a reference that survives into the built site is a broken image. Every
 * file is fetched at sync time and rewritten to a local path.
 */

import { createHash } from "node:crypto";
import { imageSize } from "image-size";

export type DownloadedFile = {
  /** Path under public/, e.g. "img/notion/posts/cover-9f3a1c02.png". */
  path: string;
  /** Site-absolute reference, e.g. "/img/notion/posts/cover-9f3a1c02.png". */
  href: string;
  data: Buffer;
};

export type DownloadedImage = DownloadedFile & {
  width: number;
  height: number;
};

const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

/**
 * The signature in a Notion file URL rotates hourly but the path does not, so
 * hashing the path gives a name that is stable across syncs and changes only
 * when the file itself is replaced -- which is exactly the cache-busting
 * behaviour a static export needs.
 */
function stableKey(url: string): string {
  const path = safePathname(url);
  return createHash("sha256").update(path).digest("hex").slice(0, 8);
}

function safePathname(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

function slugifyBase(name: string): string {
  const base = name.replace(/\.[^.]+$/, "");
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return slug || "file";
}

async function fetchBytes(
  url: string,
  label: string,
): Promise<{ data: Buffer; contentType: string }> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch (cause) {
    throw new Error(`Could not download a file for ${label}: ${String(cause)}`);
  }
  if (!response.ok) {
    throw new Error(
      `Could not download a file for ${label}: ${response.status} ${response.statusText}`,
    );
  }
  const data = Buffer.from(await response.arrayBuffer());
  const contentType = (response.headers.get("content-type") ?? "")
    .split(";")[0]
    .trim();
  return { data, contentType };
}

/**
 * Images are served with `images: { unoptimized: true }` (next.config.ts), so
 * whatever is uploaded is what visitors download, and next/image needs the
 * real dimensions rather than a guess.
 */
export async function downloadImage(
  url: string,
  directory: string,
  name: string,
  label: string,
): Promise<DownloadedImage> {
  const { data, contentType } = await fetchBytes(url, label);

  if (contentType === "image/svg+xml") {
    throw new Error(
      `${label} uses an SVG image. SVG from a CMS is arbitrary markup served to ` +
        `visitors unchanged, so it is rejected. Export it as PNG or WebP.`,
    );
  }
  const extension = IMAGE_EXTENSIONS[contentType];
  if (!extension) {
    throw new Error(
      `${label} has an image of an unsupported type "${contentType || "unknown"}". ` +
        `Supported: ${Object.keys(IMAGE_EXTENSIONS).join(", ")}`,
    );
  }

  const dimensions = imageSize(data);
  if (!dimensions.width || !dimensions.height) {
    throw new Error(`Could not read the dimensions of the image for ${label}.`);
  }

  const path = `img/notion/${directory}/${slugifyBase(name)}-${stableKey(url)}.${extension}`;
  return {
    path,
    href: `/${path}`,
    data,
    width: dimensions.width,
    height: dimensions.height,
  };
}

/** For the CV, which lands at a fixed path so lib/cv.ts keeps working. */
export async function downloadTo(
  url: string,
  path: string,
  label: string,
): Promise<DownloadedFile> {
  const { data } = await fetchBytes(url, label);
  return { path, href: `/${path}`, data };
}
