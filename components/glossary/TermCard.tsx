"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useReducedMotion } from "framer-motion";
import { TermVisual } from "@/components/glossary/TermVisual";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { GlossaryTerm } from "@/data/glossary";
import type { IEM } from "@/types/iem";

export function TermCard({ term, terms, iems }: { term: GlossaryTerm; terms: GlossaryTerm[]; iems: IEM[] }) {
  const { t } = useLanguage();
  const reduceMotion = useReducedMotion();
  const [expanded, setExpanded] = useState(false);
  const relatedTerms = term.related.flatMap((slug) => {
    const related = terms.find((item) => item.slug === slug);
    return related ? [related] : [];
  });
  const exampleIems = term.exampleIEMs.flatMap((slug) => {
    const iem = iems.find((item) => item.slug === slug);
    return iem ? [iem] : [];
  });

  return (
    <motion.article layout className="rounded-md border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={`term-details-${term.slug}`}
          onClick={() => setExpanded((value) => !value)}
          className="min-h-11 min-w-0 flex-1 text-left"
        >
          <span className="block text-base font-semibold text-primary">{term.term}</span>
          <span className="mt-1 block text-sm leading-relaxed text-secondary">{term.shortDefinition}</span>
        </button>
        <button
          type="button"
          aria-label={t(expanded ? "glossary.explanation" : "common.learnMore")}
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-md text-secondary hover:bg-surface-subtle hover:text-primary"
        >
          {expanded ? <ChevronUp aria-hidden="true" className="size-5" /> : <ChevronDown aria-hidden="true" className="size-5" />}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={`term-details-${term.slug}`}
            layout
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-5 border-t border-border pt-4">
              <p className="text-sm leading-relaxed text-secondary">{term.explanation}</p>
              {term.visual !== "none" && <TermVisual term={term} />}

              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-primary">{t("glossary.related")}</h3>
                {relatedTerms.length > 0 ? (
                  <ul className="flex flex-wrap gap-2">
                    {relatedTerms.map((related) => (
                      <li key={related.slug}>
                        <Link href={`/learn/${related.slug}`} className="inline-flex min-h-9 items-center rounded-full border border-border px-3 text-xs text-secondary hover:bg-surface-subtle hover:text-primary">{related.term}</Link>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-xs text-tertiary">{t("glossary.noRelated")}</p>}
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-primary">{t("glossary.examples")}</h3>
                {exampleIems.length > 0 ? (
                  <ul className="flex flex-wrap gap-2">
                    {exampleIems.map((iem) => <li key={iem.slug}><Link href={`/iem/${iem.slug}`} className="inline-flex min-h-9 items-center rounded-full border border-border px-3 text-xs text-secondary hover:bg-surface-subtle hover:text-primary">{iem.brand} {iem.name}</Link></li>)}
                  </ul>
                ) : <p className="text-xs text-tertiary">{t("glossary.noExamples")}</p>}
              </div>

              <Link href={`/learn/${term.slug}`} className="inline-flex min-h-11 items-center text-sm font-medium text-accent hover:underline">
                {t("glossary.openFullPage")}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}