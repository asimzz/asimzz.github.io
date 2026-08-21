import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Tag } from "@/components/ui/tag";
import { getProjects } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Projects",
  description: "Research code, tools, and things built for the fun of it.",
  alternates: { canonical: "/projects" },
  // Without this the page inherits the root openGraph block, so shares would
  // show the site title instead of the page title.
  openGraph: {
    title: "Projects",
    description: "Research code, tools, and things built for the fun of it.",
    url: "/projects",
  },
};

export default function ProjectsPage() {
  const projects = getProjects();

  return (
    <>
      <PageHeader
        title="projects"
        description="Research code, tools, and things built for the fun of it."
      />

      {projects.length === 0 ? (
        <p className="text-ink-faint text-sm">No projects yet.</p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2">
          {projects.map((project) => (
            <li key={project.slug}>
              <Link
                href={`/projects/${project.slug}`}
                className="border-line hover:border-accent/50 bg-surface group flex h-full flex-col overflow-hidden rounded-lg border transition-colors"
              >
                {project.image && (
                  <Image
                    src={project.image}
                    alt={project.title}
                    width={800}
                    height={450}
                    className="aspect-video w-full object-cover"
                  />
                )}
                <div className="flex flex-1 flex-col p-4">
                  <h2 className="group-hover:text-accent font-serif text-base font-semibold tracking-tight transition-colors">
                    {project.title}
                  </h2>
                  <p className="text-ink-muted mt-2 flex-1 text-sm leading-relaxed">
                    {project.description}
                  </p>
                  {project.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {project.tags.map((tag) => (
                        <Tag key={tag}>{tag}</Tag>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
