import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { FaArrowUpRightFromSquare, FaGithub } from "react-icons/fa6";
import { Tag } from "@/components/ui/tag";
import { Mdx } from "@/lib/mdx";
import { getProject, getProjects } from "@/lib/projects";
import "katex/dist/katex.min.css";

export function generateStaticParams() {
  return getProjects().map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};

  return {
    title: project.title,
    description: project.description,
    alternates: { canonical: `/projects/${slug}` },
    openGraph: {
      type: "article",
      title: project.title,
      description: project.description,
      url: `/projects/${slug}`,
    },
  };
}

export default async function ProjectPage({
  params,
}: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  return (
    <article>
      <header className="border-line mb-8 border-b pb-6">
        <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          {project.title}
        </h1>
        <p className="text-ink-muted mt-3 text-base">{project.description}</p>

        {project.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        )}

        {(project.repo || project.demo) && (
          <div className="mt-5 flex flex-wrap gap-3">
            {project.repo && (
              <a
                href={project.repo}
                target="_blank"
                rel="noopener noreferrer"
                className="border-line text-ink-muted hover:border-accent hover:text-accent inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition-colors"
              >
                <FaGithub className="size-3.5" aria-hidden />
                Source
              </a>
            )}
            {project.demo && (
              <a
                href={project.demo}
                target="_blank"
                rel="noopener noreferrer"
                className="border-line text-ink-muted hover:border-accent hover:text-accent inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition-colors"
              >
                <FaArrowUpRightFromSquare className="size-3" aria-hidden />
                Demo
              </a>
            )}
          </div>
        )}
      </header>

      {project.image && (
        <Image
          src={project.image}
          alt={project.title}
          width={1200}
          height={675}
          priority
          className="border-line mb-8 w-full rounded-lg border object-cover"
        />
      )}

      <div className="prose">
        <Mdx source={project.body} />
      </div>
    </article>
  );
}
