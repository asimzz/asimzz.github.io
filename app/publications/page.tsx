import type { Metadata } from "next";
import { PublicationEntry } from "@/components/publications/publication-entry";
import { PageHeader } from "@/components/ui/page-header";
import { getPublicationsByYear } from "@/lib/publications";

export const metadata: Metadata = {
  title: "Publications",
  description: "Peer-reviewed papers, preprints, and theses.",
  alternates: { canonical: "/publications" },
  // Without this the page inherits the root openGraph block, so shares would
  // show the site title instead of the page title.
  openGraph: {
    title: "Publications",
    description: "Peer-reviewed papers, preprints, and theses.",
    url: "/publications",
  },
};

export default function PublicationsPage() {
  const groups = getPublicationsByYear();

  return (
    <>
      <PageHeader
        title="publications"
        description="Peer-reviewed papers, preprints, and theses."
      />

      {groups.length === 0 ? (
        <p className="text-ink-faint text-sm">No publications listed yet.</p>
      ) : (
        <div className="space-y-12">
          {groups.map((group) => (
            <section key={group.year}>
              <h2 className="border-line text-ink-faint mb-5 border-b pb-2 font-mono text-sm">
                {group.year}
              </h2>
              <div className="space-y-6">
                {group.items.map((publication) => (
                  <PublicationEntry
                    key={publication.key}
                    publication={publication}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
