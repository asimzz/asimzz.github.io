# asimzz.github.io

Personal site: about, publications, projects, and a blog. One statically
exported [Next.js](https://nextjs.org) app, deployed to GitHub Pages.

## Stack

|           |                                                       |
| --------- | ----------------------------------------------------- |
| Framework | Next.js 16 (App Router, `output: "export"`)           |
| Styling   | Tailwind CSS v4, tokens in `app/globals.css`          |
| Content   | Authored in Notion, synced into `content/`            |
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

**Content is authored in Notion, not in this repo.** Six databases hold it:

| Notion database | Becomes                    | Notes                                       |
| --------------- | -------------------------- | ------------------------------------------- |
| Profile         | `content/profile.json`     | One row. Body = the bio. Photo and CV files |
| Socials         | `content/profile.json`     | `Icon` must be one of the six known icons   |
| News            | `content/news.json`        | `Text` is the title property                |
| Publications    | `content/publications.bib` | Body = one code block holding the BibTeX    |
| Projects        | `content/projects/*.mdx`   | Body = the write-up                         |
| Posts           | `content/posts/*.mdx`      | Body = the article                          |

```bash
pnpm content:sync   # pull Notion into content/ and public/
```

> **`content/` is generated.** Hand edits to `content/news.json`,
> `content/profile.json`, `content/publications.bib`, `content/posts/` and
> `content/projects/` are overwritten on the next sync. Edit in Notion.

Bodies are written in Notion's editor and exported as markdown, so equation
blocks become `$$…$$` and code blocks stay fenced — KaTeX math and Shiki
highlighting work exactly as before. The sync escapes `{`, `}` and `<` in prose
so a literal brace does not break the MDX compile, while leaving code and math
untouched.

**A publication** — paste the BibTeX entry from arXiv or Google Scholar into a
code block in the page body. Recognised extras beyond the standard fields:

| Field                                | Effect                          |
| ------------------------------------ | ------------------------------- |
| `keywords = {selected}`              | also listed on the landing page |
| `url`                                | "PDF" link                      |
| `doi`                                | "DOI" link                      |
| `eprint` + `archivePrefix = {arXiv}` | "arXiv" link                    |
| `code`, `slides`, `poster`           | extra links                     |

Titles are rendered exactly as written — the parser's sentence-casing is off.

**Slugs** are an explicit `Slug` property, never derived from the title, because
a static export has no redirects: changing one breaks the old URL permanently.
The sync refuses to change a slug unless you pass `ALLOW_SLUG_CHANGE=1`.

**Images** are uploaded into Notion and downloaded to `public/img/notion/` at
sync time — Notion's own URLs expire after about an hour. They are served
unoptimized, so upload them at the size they are displayed.

**Your CV** goes in the `CV` file property on the Profile row and lands at
`public/cv.pdf`. The landing-page link appears only when that file exists
(`lib/cv.ts` checks at build time), so there is no dead link before you add it.

Content is validated twice: once at sync time against the Notion row (a renamed
property names the row and lists the properties that do exist), and again at
build time by `lib/frontmatter.ts`.

### First-time Notion setup

1. Create an integration at <https://www.notion.so/my-integrations> and copy its
   secret.
2. Create a page in Notion to hold the databases, and connect the integration to
   it (**… → Connections**).
3. Seed the databases from what is currently in the repo:

   ```bash
   NOTION_TOKEN=ntn_xxx NOTION_PARENT_PAGE=<page url> pnpm content:seed
   ```

   It prints the six database ids — put them in `.env.local`.

4. In Notion, upload the profile photo and the CV to the Profile row. The seed
   script does not upload files.
5. `pnpm content:sync`, then check `git diff content/` is empty apart from the
   profile image path. That proves the round trip is lossless.

## Deploying

`.github/workflows/deploy.yml` syncs from Notion, then builds and publishes
`out/`. It runs on a push to `main`, on a manual trigger, and on a cron every 30
minutes — Notion cannot call a webhook on the free plan, so the site polls.

A scheduled run only deploys when the sync actually changed something: `git
diff` is the change detector, so an edit-and-undo in Notion costs nothing and
there is no timestamp state to keep anywhere. Changed content is committed back
to `main` by the Actions bot, which is what gives you content history.

One-time setup in the repo settings:

1. **Settings → Pages → Source: GitHub Actions.**
2. **Settings → Actions → Variables → new repository variable `SITE_URL`**, set
   to the site's origin with no trailing slash (e.g. `https://example.com`).
   Canonical URLs, Open Graph tags, `sitemap.xml` and `feed.xml` are built from
   it; without it the build falls back to the placeholder in `content/site.ts`.
3. **Settings → Actions → Secrets → `NOTION_TOKEN`** — the integration secret.
   A secret, not a variable: it must never be printed in a log.
4. **Settings → Actions → Variables** — the six `NOTION_DB_*` ids from
   `pnpm content:seed`. These are not credentials, so variables are fine.

The token is only ever passed to the sync step, never to `pnpm build`, so it
cannot be inlined into a client bundle. The workflow greps `out/` for token
prefixes afterwards as a backstop.

To publish immediately rather than waiting for the cron, run the workflow from
the Actions tab, or from anywhere that can make an HTTPS request:

```bash
curl -X POST https://api.github.com/repos/<owner>/<repo>/dispatches \
  -H "Authorization: Bearer $GITHUB_PAT" \
  -H "Accept: application/vnd.github+json" \
  -d '{"event_type":"publish"}'
```

That is one tap if you wrap it in a phone shortcut. The PAT needs only
**Contents: read and write** on this repo.

> GitHub disables scheduled workflows after 60 days with no repository activity.
> Publishing anything commits to `main` and resets that clock; if it does get
> disabled you are emailed, and re-enabling is one click in the Actions tab.

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
