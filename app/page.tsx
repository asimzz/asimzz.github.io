import Image from "next/image";
import Link from "next/link";
import { FaFilePdf } from "react-icons/fa6";
import { PublicationEntry } from "@/components/publications/publication-entry";
import { PostList } from "@/components/ui/post-list";
import { Section } from "@/components/ui/section";
import { SocialIcons } from "@/components/ui/social-icons";
import { news } from "@/content/news";
import { profile } from "@/content/site";
import { formatDate } from "@/lib/content";
import { getLatestPosts } from "@/lib/posts";
import { getCvHref } from "@/lib/cv";
import { getFeaturedProjects } from "@/lib/projects";
import { getSelectedPublications } from "@/lib/publications";

export default function AboutPage() {
  const latestPosts = getLatestPosts(3);
  const selectedPublications = getSelectedPublications();
  const featuredProjects = getFeaturedProjects();
  const cvHref = getCvHref();

  return (
    <>
      <section className="flex flex-col gap-8 sm:flex-row-reverse sm:items-start">
        <Image
          src={profile.image.src}
          alt={profile.image.alt}
          width={profile.image.width}
          height={profile.image.height}
          priority
          className="border-line size-36 shrink-0 rounded-full border object-cover sm:size-40"
        />

        <div className="min-w-0">
          <h1 className="font-serif text-4xl font-semibold tracking-tight">
            {profile.name}
          </h1>
          <p className="text-ink-muted mt-2 text-base">
            {profile.role}
            {profile.affiliation && (
              <>
                {" · "}
                <span>{profile.affiliation}</span>
              </>
            )}
          </p>
          {profile.location && (
            <p className="text-ink-faint mt-1 text-sm">{profile.location}</p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-6">
            <SocialIcons />
            {cvHref && (
              <a
                href={cvHref}
                target="_blank"
                rel="noopener noreferrer"
                className="border-line text-ink-muted hover:border-accent hover:text-accent inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition-colors"
              >
                <FaFilePdf className="size-3.5" aria-hidden />
                CV
              </a>
            )}
          </div>
        </div>
      </section>

      <div className="prose mt-10">
        {profile.bio.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      {news.length > 0 && (
        <Section title="news">
          <ul className="space-y-3">
            {news.map((item) => (
              <li
                key={`${item.date}-${item.text}`}
                className="flex flex-col gap-1 text-sm sm:flex-row sm:gap-4"
              >
                <time
                  dateTime={item.date}
                  className="text-ink-faint shrink-0 font-mono text-xs sm:w-24 sm:pt-0.5"
                >
                  {formatDate(item.date)}
                </time>
                <span className="text-ink-muted leading-relaxed">
                  {item.text}
                  {item.link && (
                    <>
                      {" "}
                      <a
                        href={item.link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent underline decoration-1 underline-offset-2"
                      >
                        {item.link.label}
                      </a>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {selectedPublications.length > 0 && (
        <Section title="selected publications" href="/publications">
          <div className="space-y-6">
            {selectedPublications.map((publication) => (
              <PublicationEntry
                key={publication.key}
                publication={publication}
              />
            ))}
          </div>
        </Section>
      )}

      {featuredProjects.length > 0 && (
        <Section title="projects" href="/projects">
          <ul className="space-y-4">
            {featuredProjects.map((project) => (
              <li key={project.slug}>
                <Link
                  href={`/projects/${project.slug}`}
                  className="group block"
                >
                  <h3 className="group-hover:text-accent font-serif text-lg font-semibold tracking-tight transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-ink-muted mt-1 text-sm leading-relaxed">
                    {project.description}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {latestPosts.length > 0 && (
        <Section title="latest posts" href="/blog">
          <PostList posts={latestPosts} showTags={false} />
        </Section>
      )}
    </>
  );
}
