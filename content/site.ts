/**
 * Single source of truth for identity and site-wide metadata.
 *
 * TODO(asim): replace the placeholders marked below with your real details.
 */

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
  title: "Asim Mohamed",
  description:
    "AI engineer and machine learning researcher working on multilingual NLP and the safety of large language models.",
  locale: "en",
} as const;

export type SocialLink = {
  label: string;
  href: string;
  icon: "email" | "github" | "linkedin" | "scholar" | "x" | "rss";
};

export const profile = {
  name: "Asim Mohamed",
  role: "AI Engineer",
  affiliation: "Enigma AI",
  location: "Rwanda",
  image: {
    src: "/img/profile.jpg",
    alt: "Asim Mohamed",
    width: 400,
    height: 400,
  },
  /**
   * Drawn from the CV, so every claim here is checkable. TODO(asim): rewrite in
   * your own voice -- this reads accurately but not like you.
   */
  bio: [
    "I am an AI engineer at Enigma AI and a graduate of the African Master's in Machine Intelligence (AMMI) at AIMS, where my thesis was supervised by Dr. Martin Gubri of Parameter Lab.",
    "My research sits at the intersection of multilingual NLP and the safety of large language models: whether text watermarks survive translation, readability prediction for Arabic, and machine translation for low-resource languages such as Coptic.",
    "Before AMMI I read electrical and electronic engineering at the University of Khartoum, and I have since worked across full-stack and AI engineering. The fastest way to reach me is by email.",
  ],
  /**
   * Where the CV lives, relative to public/. The link renders only when the
   * file is actually present -- see lib/cv.ts -- so this can stay set even
   * before the PDF is added. Set to null to hide the link outright.
   */
  cv: "/cv.pdf" as string | null,
} as const;

// TODO(asim): add Google Scholar / X if you use them.
export const socials: SocialLink[] = [
  { label: "Email", href: "mailto:amohamed@aimsammi.org", icon: "email" },
  { label: "GitHub", href: "https://github.com/asimzz", icon: "github" },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/asim-mohamed-9a2047135/",
    icon: "linkedin",
  },
  { label: "RSS", href: "/feed.xml", icon: "rss" },
];

export const nav = [
  { label: "about", href: "/" },
  { label: "publications", href: "/publications" },
  { label: "projects", href: "/projects" },
  { label: "blog", href: "/blog" },
] as const;
