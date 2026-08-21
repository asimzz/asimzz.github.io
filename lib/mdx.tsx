import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeKatex from "rehype-katex";
import rehypePrettyCode, {
  type Options as PrettyCodeOptions,
} from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

const prettyCodeOptions: PrettyCodeOptions = {
  // Two themes emit --shiki-light/--shiki-dark custom properties on each token;
  // globals.css picks the right one per colour scheme.
  theme: { light: "github-light", dark: "github-dark-dimmed" },
  // The surrounding <pre> is styled with our own surface token instead.
  keepBackground: false,
  defaultLang: "text",
};

/** Anchors that leave the site get the usual safety attributes. */
function Anchor({ href = "", ...props }: React.ComponentProps<"a">) {
  const isInternal = href.startsWith("/") || href.startsWith("#");
  if (isInternal) return <Link href={href} {...props} />;
  return <a href={href} target="_blank" rel="noopener noreferrer" {...props} />;
}

const components = {
  a: Anchor,
};

export function Mdx({ source }: { source: string }) {
  return (
    <MDXRemote
      source={source}
      components={components}
      options={{
        mdxOptions: {
          remarkPlugins: [remarkGfm, remarkMath],
          rehypePlugins: [
            rehypeSlug,
            rehypeKatex,
            [rehypePrettyCode, prettyCodeOptions],
          ],
        },
      }}
    />
  );
}
