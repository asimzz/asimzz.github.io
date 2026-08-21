import Link from "next/link";
import { formatDate } from "@/lib/content";
import type { Post } from "@/lib/posts";
import { Tag } from "@/components/ui/tag";

export function PostList({
  posts,
  showTags = true,
}: {
  posts: Post[];
  showTags?: boolean;
}) {
  if (posts.length === 0) {
    return <p className="text-ink-faint text-sm">No posts yet.</p>;
  }

  return (
    <ul className="space-y-7">
      {posts.map((post) => (
        <li key={post.slug}>
          <article>
            <Link href={`/blog/${post.slug}`} className="group block">
              <h3 className="group-hover:text-accent font-serif text-lg font-semibold tracking-tight transition-colors">
                {post.title}
                {post.draft && (
                  <span className="text-ink-faint ml-2 align-middle text-xs font-normal">
                    (draft)
                  </span>
                )}
              </h3>
            </Link>
            <p className="text-ink-faint mt-1 font-mono text-xs">
              <time dateTime={post.date}>{formatDate(post.date)}</time>
            </p>
            <p className="text-ink-muted mt-2 text-sm leading-relaxed">
              {post.description}
            </p>
            {showTags && post.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </div>
            )}
          </article>
        </li>
      ))}
    </ul>
  );
}
