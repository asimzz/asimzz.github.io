/**
 * @retorquere/bibtex-parser@10.0.1 advertises typings at ./dist/types/index.d.ts
 * but does not ship that directory, so TypeScript cannot resolve the module.
 * This declares only the surface lib/publications.ts uses; shapes were
 * confirmed empirically against 10.0.1 output.
 */
declare module "@retorquere/bibtex-parser" {
  /**
   * A parsed creator. Personal names split into parts; corporate or
   * brace-protected names arrive whole in `name`.
   */
  export interface Creator {
    name?: string;
    firstName?: string;
    lastName?: string;
    prefix?: string;
    suffix?: string;
  }

  export interface Entry {
    /** Lowercased entry type, e.g. "inproceedings". */
    type: string;
    /** Citation key. */
    key: string;
    /**
     * Field values. Creator lists parse to Creator[], list fields such as
     * keywords to string[], everything else to string.
     */
    fields: Record<string, string | string[] | Creator[] | undefined>;
    input: string;
  }

  export interface Bibliography {
    entries: Entry[];
    errors: unknown[];
    comments: string[];
    strings: Record<string, string>;
    preamble: string[];
  }

  export interface ParseOptions {
    /**
     * Pass false to keep titles exactly as written in the .bib. The default
     * lowercases unprotected words in title-mode fields.
     */
    sentenceCase?:
      | boolean
      | { guess?: boolean; preserveQuoted?: boolean; subSentence?: boolean };
    raw?: boolean;
    verbatimFields?: (string | RegExp)[];
    strings?: string;
  }

  export function parse(input: string, options?: ParseOptions): Bibliography;
}
