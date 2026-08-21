import fs from "node:fs";
import path from "node:path";
import { parse, type Creator, type Entry } from "@retorquere/bibtex-parser";

const BIB_PATH = path.join(process.cwd(), "content/publications.bib");

export type PublicationLink = {
  label: string;
  href: string;
};

export type Publication = {
  key: string;
  type: string;
  title: string;
  authors: string[];
  venue: string | null;
  /** Volume/pages/publisher detail, rendered after the venue. */
  detail: string | null;
  year: number;
  /** Marked with `keywords = {selected}` in the .bib. */
  selected: boolean;
  links: PublicationLink[];
  abstract: string | null;
};

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function asList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string");
  }
  const single = asString(value);
  return single ? [single] : [];
}

/** "Mohamed, Asim" -> "Asim Mohamed"; corporate names pass through whole. */
function formatCreator(creator: Creator): string {
  if (creator.name) return creator.name;
  const parts = [
    creator.firstName,
    creator.prefix,
    creator.lastName,
    creator.suffix ? `, ${creator.suffix}` : null,
  ].filter(Boolean);
  return parts.join(" ").replace(" ,", ",");
}

function authorsOf(entry: Entry): string[] {
  const field = entry.fields.author ?? entry.fields.editor;
  if (!Array.isArray(field)) return [];
  return field.map((creator) =>
    typeof creator === "string" ? creator : formatCreator(creator),
  );
}

/** Where it appeared, by entry type. */
function venueOf(entry: Entry): string | null {
  const f = entry.fields;
  return (
    asString(f.journal) ??
    asString(f.booktitle) ??
    asString(f.school) ??
    asString(f.institution) ??
    asString(f.publisher) ??
    asString(f.howpublished) ??
    (entry.type === "misc" && asString(f.eprint) ? "Preprint" : null)
  );
}

function detailOf(entry: Entry): string | null {
  const f = entry.fields;
  const volume = asString(f.volume);
  const number = asString(f.number);
  const pages = asString(f.pages);

  const bits: string[] = [];
  if (volume) bits.push(number ? `${volume}(${number})` : volume);
  if (pages) bits.push(`pp. ${pages}`);
  return bits.length > 0 ? bits.join(", ") : null;
}

function linksOf(entry: Entry): PublicationLink[] {
  const f = entry.fields;
  const links: PublicationLink[] = [];

  const url = asString(f.url);
  const doi = asString(f.doi);
  const eprint = asString(f.eprint);
  const archive = asString(f.archiveprefix) ?? asString(f.archivePrefix);
  const code = asString(f.code);
  const slides = asString(f.slides);
  const poster = asString(f.poster);

  if (url) links.push({ label: "PDF", href: url });
  if (doi) links.push({ label: "DOI", href: `https://doi.org/${doi}` });
  if (eprint) {
    // Scholar and Zotero exports mark arXiv either with archivePrefix or by an
    // eprint that already looks like an arXiv identifier.
    const isArxiv =
      archive?.toLowerCase() === "arxiv" ||
      /^\d{4}\.\d{4,5}(v\d+)?$/.test(eprint);
    if (isArxiv) {
      links.push({ label: "arXiv", href: `https://arxiv.org/abs/${eprint}` });
    }
  }
  if (code) links.push({ label: "Code", href: code });
  if (slides) links.push({ label: "Slides", href: slides });
  if (poster) links.push({ label: "Poster", href: poster });

  return links;
}

function load(): Publication[] {
  if (!fs.existsSync(BIB_PATH)) return [];

  const source = fs.readFileSync(BIB_PATH, "utf8");
  // sentenceCase: false keeps titles exactly as written; the default lowercases
  // unprotected words, which mangles venue and acronym casing.
  const bib = parse(source, { sentenceCase: false });

  if (bib.errors.length > 0) {
    throw new Error(
      `content/publications.bib has ${bib.errors.length} parse error(s): ${JSON.stringify(bib.errors)}`,
    );
  }

  return bib.entries
    .map((entry) => {
      const title = asString(entry.fields.title);
      const year = Number(asString(entry.fields.year));
      if (!title) {
        throw new Error(`Publication "${entry.key}" is missing a title`);
      }
      if (!Number.isInteger(year)) {
        throw new Error(`Publication "${entry.key}" is missing a numeric year`);
      }

      return {
        key: entry.key,
        type: entry.type,
        title,
        authors: authorsOf(entry),
        venue: venueOf(entry),
        detail: detailOf(entry),
        year,
        selected: asList(entry.fields.keywords).some(
          (k) => k.toLowerCase() === "selected",
        ),
        links: linksOf(entry),
        abstract: asString(entry.fields.abstract),
      };
    })
    .sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
}

export function getPublications(): Publication[] {
  return load();
}

export function getSelectedPublications(): Publication[] {
  return load().filter((publication) => publication.selected);
}

/** Newest year first, for the year-grouped publications page. */
export function getPublicationsByYear(): {
  year: number;
  items: Publication[];
}[] {
  const groups = new Map<number, Publication[]>();
  for (const publication of load()) {
    const bucket = groups.get(publication.year) ?? [];
    bucket.push(publication);
    groups.set(publication.year, bucket);
  }
  return [...groups.entries()]
    .map(([year, items]) => ({ year, items }))
    .sort((a, b) => b.year - a.year);
}
