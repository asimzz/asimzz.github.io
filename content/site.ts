/**
 * Single source of truth for identity and site-wide metadata.
 *
 * TODO(asim): replace the placeholders marked below with your real details.
 */

// TODO(asim): set this to your custom domain once it is registered, or set
// NEXT_PUBLIC_SITE_URL in CI. Canonical URLs, Open Graph tags, the sitemap and
// the RSS feed all derive from it, so a wrong value here silently produces
// wrong absolute URLs everywhere.
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://asimzz.github.io";

export const site = {
  title: "Asim Abdalla",
  // TODO(asim): one line, used as the default meta description.
  description: "Machine learning researcher and software engineer.",
  locale: "en",
} as const;

export type SocialLink = {
  label: string;
  href: string;
  icon: "email" | "github" | "linkedin" | "scholar" | "x" | "rss";
};

export const profile = {
  name: "Asim Abdalla",
  // TODO(asim): your role and affiliation, shown under your name.
  role: "Machine Learning Researcher",
  affiliation: "African Institute for Mathematical Sciences",
  location: "",
  image: {
    // TODO(asim): replace with a real square photo, e.g. /img/profile.jpg.
    src: "/img/profile.svg",
    alt: "Asim Abdalla",
    width: 400,
    height: 400,
  },
  // TODO(asim): rewrite this bio. Markdown-free plain paragraphs; each string
  // becomes its own <p>.
  bio: [
    "Placeholder bio. Write two or three sentences about your research interests, what you are working on now, and what you are looking for.",
    "A second paragraph is optional — use it for background, education, or a note on how best to reach you.",
  ],
  // TODO(asim): drop a PDF at public/resume.pdf and set this to
  // "/resume.pdf". Left null so the deployed site has no broken link.
  resume: null as string | null,
} as const;

// TODO(asim): confirm these handles; remove any you do not want shown.
export const socials: SocialLink[] = [
  { label: "Email", href: "mailto:yassir@aims.ac.za", icon: "email" },
  { label: "GitHub", href: "https://github.com/asimzz", icon: "github" },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/asimzz",
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
