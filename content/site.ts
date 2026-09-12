/**
 * Single source of truth for identity and site-wide metadata.
 *
 * The editorial half comes from profile.json, which `pnpm content:sync`
 * generates from the Notion "Profile" and "Socials" databases. Edit that
 * content in Notion, not here.
 *
 * A plain JSON import rather than a filesystem read on purpose: this module is
 * imported by components/layout/navbar.tsx, which is a client component, and
 * node:fs cannot be bundled for the browser.
 */

import profileData from "./profile.json";

// TODO(asim): set this to your custom domain once it is registered, or set
// NEXT_PUBLIC_SITE_URL in CI. Canonical URLs, Open Graph tags, the sitemap and
// the RSS feed all derive from it, so a wrong value here silently produces
// wrong absolute URLs everywhere.
const FALLBACK_SITE_URL = "https://asimzz.github.io";

function resolveSiteUrl(): string {
  // An unset GitHub Actions repository variable interpolates to an empty
  // string, not to nothing -- so this must test for falsiness. Using ?? here
  // lets "" through, and `new URL("")` throws during metadata collection.
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(
    /\/+$/,
    "",
  );
  if (!configured) return FALLBACK_SITE_URL;

  try {
    new URL(configured);
  } catch {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL must be an absolute URL such as https://example.com, received: "${configured}"`,
    );
  }
  return configured;
}

export const siteUrl = resolveSiteUrl();

export const site = {
  title: profileData.name,
  description: profileData.description,
  // Code-coupled: <html lang> in app/layout.tsx and <language> in the RSS feed
  // must agree with it, so it is not worth moving to Notion.
  locale: "en",
} as const;

export type SocialLink = {
  label: string;
  href: string;
  icon: "email" | "github" | "linkedin" | "scholar" | "x" | "rss";
};

export type Profile = {
  name: string;
  role: string;
  affiliation: string | null;
  location: string | null;
  image: { src: string; alt: string; width: number; height: number };
  /** Markdown, rendered through the same pipeline as posts and projects. */
  bio: string;
  researchInterests: string[];
  /**
   * Where the CV lives, relative to public/. The link renders only when the
   * file is actually present -- see lib/cv.ts -- so this can stay set even
   * before the PDF is added. Null hides the link outright.
   */
  cv: string | null;
};

const { socials: socialLinks, ...profileFields } = profileData;

export const profile: Profile = profileFields;

/**
 * `icon` is a closed union because each value maps to an imported component in
 * components/ui/social-icons.tsx. The sync validates every Notion row against
 * that same list, so this cast cannot smuggle in an unknown icon.
 */
export const socials: SocialLink[] = socialLinks as SocialLink[];

export const nav = [
  { label: "about", href: "/" },
  { label: "publications", href: "/publications" },
  { label: "projects", href: "/projects" },
  { label: "blog", href: "/blog" },
] as const;
