import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Tag } from "@/components/ui/tag";
import { formatDate } from "@/lib/content";
import { Mdx } from "@/lib/mdx";
import { getPost, getPosts } from "@/lib/posts";
import "katex/dist/katex.min.css";

export function generateStaticParams() {
  return getPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      url: `/blog/${slug}`,
    },
  };
}

export default async function PostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <article>
      <header className="border-line mb-8 border-b pb-6">
        <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          {post.title}
        </h1>
        <p className="text-ink-faint mt-3 font-mono text-xs">
          <time dateTime={post.date}>{formatDate(post.date)}</time>
        </p>
        {post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        )}
      </header>

      <div className="prose">
        <Mdx source={post.body} />
      </div>
    </article>
  );
}
