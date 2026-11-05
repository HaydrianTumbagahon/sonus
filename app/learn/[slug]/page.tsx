import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GlossaryDetailClient } from "@/components/glossary/GlossaryDetailClient";
import { getGlossaryTerm, glossaryTerms } from "@/data/glossary";
import { getAllIEMs } from "@/lib/data";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return glossaryTerms.map((term) => ({ slug: term.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const term = getGlossaryTerm(slug);
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
  const term = getGlossaryTerm(slug);
  if (!term) notFound();

  const allIems = getAllIEMs();
  const exampleIems = term.exampleIEMs.flatMap((exampleSlug) => {
    const item = allIems.find((iem) => iem.slug === exampleSlug);
    return item ? [item] : [];
  });
  const relatedTerms = term.related.flatMap((relatedSlug) => {
    const related = getGlossaryTerm(relatedSlug);
    return related ? [related] : [];
  });
  const termIndex = glossaryTerms.findIndex((item) => item.slug === term.slug);
  const previous = termIndex > 0 ? glossaryTerms[termIndex - 1] : undefined;
  const next = termIndex < glossaryTerms.length - 1 ? glossaryTerms[termIndex + 1] : undefined;

  return (
    <GlossaryDetailClient
      term={term}
      relatedTerms={relatedTerms}
      exampleIems={exampleIems}
      previous={previous}
      next={next}
    />
  );
}