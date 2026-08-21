import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { PostList } from "@/components/ui/post-list";
import { getPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Blog",
  description: "Notes on research, machine learning, and engineering.",
  alternates: { canonical: "/blog" },
  // Without this the page inherits the root openGraph block, so shares would
  // show the site title instead of the page title.
  openGraph: {
    title: "Blog",
    description: "Notes on research, machine learning, and engineering.",
    url: "/blog",
  },
};

export default function BlogPage() {
  const posts = getPosts();

  return (
    <>
      <PageHeader
        title="blog"
        description="Notes on research, machine learning, and engineering."
      />
      <PostList posts={posts} />
    </>
  );
}
