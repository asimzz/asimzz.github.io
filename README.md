# portfolio

Personal site: about, publications, projects, and a blog. One statically
exported [Next.js](https://nextjs.org) app, deployed to GitHub Pages.

The information architecture follows [al-folio](https://github.com/alshedivat/al-folio),
re-implemented in React and Tailwind — al-folio itself is Jekyll, so nothing is
shared beyond the layout ideas.

## Stack

|           |                                                       |
| --------- | ----------------------------------------------------- |
| Framework | Next.js 16 (App Router, `output: "export"`)           |
| Styling   | Tailwind CSS v4, tokens in `app/globals.css`          |
| Content   | MDX + YAML frontmatter, BibTeX for publications       |
| Posts     | `next-mdx-remote/rsc`, KaTeX math, Shiki highlighting |
| Theme     | `next-themes`, class-based dark mode                  |
| Hosting   | GitHub Pages via GitHub Actions                       |

## Develop

```bash
pnpm install
pnpm dev          # http://localhost:3000 — drafts are visible here
pnpm build        # writes out/
pnpm serve        # serve out/ locally to check the real export
pnpm typecheck
pnpm lint
pnpm format
```

## Adding content

**A blog post** — create `content/posts/my-slug.mdx`:

```yaml
---
title: Post title
date: 2026-08-21 # YYYY-MM-DD
description: One line, used in lists, meta tags and the RSS feed.
tags: [research, nlp]
draft: false # true = visible in `pnpm dev`, excluded from builds
---
```

The body is MDX: `$inline$` and `$$display$$` math, fenced code blocks with a
language, tables, and footnotes all work.

**A project** — create `content/projects/my-slug.mdx` with the same idea plus
`image`, `repo`, `demo`, `featured` (surfaces it on the landing page) and
`order`.

**A publication** — append a BibTeX entry to `content/publications.bib`.
Recognised extras beyond the standard fields:

| Field                                | Effect                          |
| ------------------------------------ | ------------------------------- |
| `keywords = {selected}`              | also listed on the landing page |
| `url`                                | "PDF" link                      |
| `doi`                                | "DOI" link                      |
| `eprint` + `archivePrefix = {arXiv}` | "arXiv" link                    |
| `code`, `slides`, `poster`           | extra links                     |

Titles are rendered exactly as written — the parser's sentence-casing is off.

**Identity and news** live in `content/site.ts` and `content/news.ts`.

Frontmatter is validated at build time (`lib/frontmatter.ts`), so a mistyped key
fails the build with the file named rather than rendering `undefined`.

## Deploying

Pushing to `master` runs `.github/workflows/deploy.yml`, which builds and
publishes `out/`. Two one-time setup steps in the repo settings:

1. **Settings → Pages → Source: GitHub Actions.**
2. **Settings → Actions → Variables → new repository variable `SITE_URL`**, set
   to the site's origin with no trailing slash (e.g. `https://example.com`).
   Canonical URLs, Open Graph tags, `sitemap.xml` and `feed.xml` are built from
   it; without it the build falls back to the placeholder in `content/site.ts`.

### Custom domain

Add `public/CNAME` containing the bare domain on one line, set the same domain
under Settings → Pages → Custom domain, then point DNS at GitHub:

- **Apex** (`example.com`) — four `A` records to `185.199.108.153`,
  `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
- **Subdomain** (`www.example.com`) — one `CNAME` to `asimzz.github.io`.

Leave "Enforce HTTPS" on once the certificate is issued.

### Two things that break a Next.js site on Pages

- `public/.nojekyll` must exist. Pages runs Jekyll by default, and Jekyll drops
  paths beginning with `_`, which would 404 every asset under `_next/`.
- No server exists at runtime. Route handlers, middleware, server actions, ISR
  and image optimization are all unavailable; `next/image` runs with
  `unoptimized: true`, so put correctly sized files in `public/img/`.
