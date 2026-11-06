"use client";

import { useEffect, useMemo, useState } from "react";
import { TermCard } from "@/components/glossary/TermCard";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { glossaryCategories, type GlossaryCategory, type GlossaryTerm } from "@/data/glossary";
import { scrollToTarget } from "@/lib/scroll";
import { PageBand } from "@/components/layout/PageBand";
import { WaveLines } from "@/components/layout/WaveLines";
import type { IEM } from "@/types/iem";

const categoryKeys: Record<GlossaryCategory, string> = {
  "Hardware & Design": "glossary.categoryHardware",
  "Sound Frequencies & Tuning": "glossary.categorySound",
  "Audio Quality & Performance": "glossary.categoryQuality",
};

function categoryId(category: GlossaryCategory) {
  return category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function GlossaryClient({ terms, iems }: {
  terms: GlossaryTerm[];
  iems: Array<Pick<IEM, "slug" | "brand" | "name">>;
}) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(categoryId(glossaryCategories[0]));
  const [openSlugs, setOpenSlugs] = useState<Set<string>>(new Set());

  useEffect(() => {
    const closeOpenCards = () => setOpenSlugs(new Set());
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") closeOpenCards();
    };

    window.addEventListener("blur", closeOpenCards);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("blur", closeOpenCards);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const filteredTerms = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    if (!search) return terms;
    return terms.filter((term) =>
      [term.term, term.slug, term.category, term.shortDefinition, term.explanation]
        .some((value) => value.toLocaleLowerCase().includes(search)),
    );
  }, [query, terms]);

  const visibleCategories = glossaryCategories.filter((category) =>
    filteredTerms.some((term) => term.category === category),
  );

  const selectCategory = (category: GlossaryCategory) => {
    const id = categoryId(category);
    setActiveCategory(id);
    const section = document.getElementById(id);
    if (section) scrollToTarget(section);
  };

  return (
    <>
      <PageBand outlineWord="LEARN" tone="brand">
        <h1 className="origin-left text-[clamp(2.5rem,6vw,5rem)] font-normal uppercase leading-[0.9] [font-family:var(--font-anton),var(--font-family-sans)] [transform:skewX(-12deg)] [color:var(--on-brand)] [text-shadow:4px_4px_0_color-mix(in_srgb,var(--on-brand)_25%,transparent)]">
          {t("glossary.title")}
        </h1>
      </PageBand>
      <div className="relative isolate overflow-hidden pt-[calc(2rem+var(--wave-h))]">
        <div className="relative z-10 mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <label className="w-full max-w-sm">
          <span className="sr-only">{t("glossary.searchPlaceholder")}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("glossary.searchPlaceholder")}
            className="min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-primary placeholder:text-tertiary focus-visible:border-accent"
          />
        </label>
      </header>

      <nav aria-label={t("glossary.title")} className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
        <ul className="flex min-w-max gap-2 py-2">
          {glossaryCategories.map((category) => {
            const id = categoryId(category);
            return (
              <li key={category}>
                <button
                  type="button"
                  aria-pressed={activeCategory === id}
                  onClick={() => selectCategory(category)}
                  className={`inline-flex min-h-11 items-center rounded-md px-3 text-sm transition-colors ${activeCategory === id ? "bg-surface-subtle font-medium text-primary" : "text-secondary hover:bg-surface-subtle hover:text-primary"}`}
                >
                  {t(categoryKeys[category])}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {visibleCategories.length > 0 ? visibleCategories.map((category) => {
        const sectionVariant = category === "Hardware & Design"
          ? "sectionA"
          : category === "Sound Frequencies & Tuning"
            ? "sectionB"
            : "sectionC";
        return (
          <section key={category} id={categoryId(category)} aria-labelledby={`${categoryId(category)}-heading`} className="anchor-target relative overflow-clip space-y-4">
            <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
              <WaveLines variant={sectionVariant} />
            </div>
            <div className="relative z-10 space-y-4">
              <h2 id={`${categoryId(category)}-heading`} className="border-b border-border pb-3 text-xl font-semibold text-primary">
                {t(categoryKeys[category])}
              </h2>
              <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredTerms.filter((term) => term.category === category).map((term) => (
                  <TermCard
                    key={term.slug}
                    term={term}
                    terms={terms}
                    iems={iems}
                    expanded={openSlugs.has(term.slug)}
                    onToggle={() => setOpenSlugs((current) => {
                      const next = new Set(current);
                      if (next.has(term.slug)) next.delete(term.slug);
                      else next.add(term.slug);
                      return next;
                    })}
                  />
                ))}
              </div>
            </div>
          </section>
        );
      }) : (
        <p role="status" className="rounded-md border border-dashed border-border bg-surface px-6 py-10 text-center text-sm text-secondary">
          {t("glossary.noResults")}
        </p>
      )}
      </div>
      </div>
    </>
  );
}