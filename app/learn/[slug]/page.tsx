import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GlossaryDetailClient } from "@/components/glossary/GlossaryDetailClient";
import { getAllGlossaryTerms, getAllIEMs, getAllTargets, getGlossaryTermBySlug } from "@/lib/data";
import { getExampleIEMs } from "@/lib/glossaryExamples";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllGlossaryTerms().map((term) => ({ slug: term.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const term = getGlossaryTermBySlug(slug);
  if (!term) return { title: "Glossary | Sonus" };

  return {
    title: `${term.term} | ${term.category} | Sonus`,
    description: term.shortDefinition,
    openGraph: {
      title: `${term.term} | Sonus`,
      description: term.shortDefinition,
      type: "article",
    },
  };
}

export default async function LearnDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const term = getGlossaryTermBySlug(slug);
  if (!term) notFound();

  const allIems = getAllIEMs();
  const targets = getAllTargets();
  const examples = getExampleIEMs(term, allIems, targets);
  const relatedTerms = term.related.flatMap((relatedSlug) => {
    const related = getGlossaryTermBySlug(relatedSlug);
    return related ? [related] : [];
  });
  const glossaryTerms = getAllGlossaryTerms();
  const termIndex = glossaryTerms.findIndex((item) => item.slug === term.slug);
  const previous = termIndex > 0 ? glossaryTerms[termIndex - 1] : undefined;
  const next = termIndex < glossaryTerms.length - 1 ? glossaryTerms[termIndex + 1] : undefined;

  return (
    <GlossaryDetailClient
      term={term}
      relatedTerms={relatedTerms}
      exampleIems={examples}
      previous={previous}
      next={next}
    />
  );
}