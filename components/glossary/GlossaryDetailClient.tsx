"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { IEMCard } from "@/components/iem/IEMCard";
import { TermVisual } from "@/components/glossary/TermVisual";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { GlossaryCategory, GlossaryTerm } from "@/data/glossary";
import type { IEM } from "@/types/iem";

const categoryKeys: Record<GlossaryCategory, string> = {
  "Hardware & Design": "glossary.categoryHardware",
  "Sound Frequencies & Tuning": "glossary.categorySound",
  "Audio Quality & Performance": "glossary.categoryQuality",
};

export function GlossaryDetailClient({
  term,
  relatedTerms,
  exampleIems,
  previous,
  next,
}: {
  term: GlossaryTerm;
  relatedTerms: GlossaryTerm[];
  exampleIems: IEM[];
  previous?: GlossaryTerm;
  next?: GlossaryTerm;
}) {
  const { t } = useLanguage();

  return (
    <article className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:py-12">
      <nav aria-label={t("glossary.title")} className="flex min-h-11 items-center gap-2 text-sm text-secondary">
        <Link href="/learn" className="hover:text-primary">{t("nav.learn")}</Link>
        <ChevronRight aria-hidden="true" className="size-4" />
        <span aria-current="page" className="text-primary">{term.term}</span>
      </nav>

      <header className="space-y-3 border-b border-border pb-7">
        <p className="text-sm font-medium text-accent">{t(categoryKeys[term.category])}</p>
        <h1 className="text-3xl font-semibold text-primary sm:text-4xl">{term.term}</h1>
        <p className="max-w-3xl text-base leading-relaxed text-secondary">{term.shortDefinition}</p>
      </header>

      <section aria-labelledby="term-explanation" className="space-y-3">
        <h2 id="term-explanation" className="text-lg font-semibold text-primary">{t("glossary.explanation")}</h2>
        <div className="max-w-3xl space-y-4 text-sm leading-7 text-secondary">
          {term.explanation
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line && !/^#/.test(line) && line !== "No related terms listed.")
            .join("\n")
            .split(/\n\s*\n/)
            .filter(Boolean).map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </section>

      {term.visual !== "none" && (
        <section aria-labelledby="term-visual" className="space-y-3">
          <h2 id="term-visual" className="text-lg font-semibold text-primary">{t("glossary.visual")}</h2>
          <TermVisual term={term} />
        </section>
      )}

      {relatedTerms.length > 0 && <section aria-labelledby="related-terms" className="space-y-3">
        <h2 id="related-terms" className="text-lg font-semibold text-primary">{t("glossary.related")}</h2>
        <ul className="flex flex-wrap gap-2">
          {relatedTerms.map((related) => (
            <li key={related.slug}>
              <Link href={`/learn/${related.slug}`} className="inline-flex min-h-11 items-center rounded-full border border-border bg-surface px-4 text-sm text-secondary hover:bg-surface-subtle hover:text-primary">
                {related.term}
              </Link>
            </li>
          ))}
        </ul>
      </section>}

      {exampleIems.length > 0 && (
      <section aria-labelledby="example-iems" className="space-y-4">
        <h2 id="example-iems" className="text-lg font-semibold text-primary">{t("glossary.examples")}</h2>
        {
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {exampleIems.map((iem) => <IEMCard key={iem.slug} iem={iem} />)}
          </div>
        }
      </section>
      )}

      <nav aria-label={t("glossary.title")} className="grid grid-cols-2 gap-3 border-t border-border pt-6">
        {previous ? (
          <Link href={`/learn/${previous.slug}`} className="flex min-h-14 items-center gap-2 rounded-md border border-border px-3 text-sm text-secondary hover:bg-surface-subtle hover:text-primary">
            <ChevronLeft aria-hidden="true" className="size-4 shrink-0" />
            <span className="min-w-0"><span className="block text-xs text-tertiary">{t("glossary.previous")}</span><span className="block truncate">{previous.term}</span></span>
          </Link>
        ) : <span />}
        {next ? (
          <Link href={`/learn/${next.slug}`} className="flex min-h-14 items-center justify-end gap-2 rounded-md border border-border px-3 text-right text-sm text-secondary hover:bg-surface-subtle hover:text-primary">
            <span className="min-w-0"><span className="block text-xs text-tertiary">{t("glossary.next")}</span><span className="block truncate">{next.term}</span></span>
            <ChevronRight aria-hidden="true" className="size-4 shrink-0" />
          </Link>
        ) : <span />}
      </nav>
    </article>
  );
}