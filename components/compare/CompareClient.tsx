"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { FrequencyGraph } from "@/components/iem/FrequencyGraph";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { CompareSelector } from "@/components/compare/CompareSelector";
import { CompareTable } from "@/components/compare/CompareTable";
import { compareColor } from "@/components/compare/colors";
import { useAppStore } from "@/lib/store";
import type { IEM } from "@/types/iem";

function sanitizeSlugs(slugs: string[], allIems: IEM[]): string[] {
  const allowed = new Set(allIems.map((item) => item.slug));
  return [...new Set(slugs)].filter((slug) => allowed.has(slug)).slice(0, 6);
}

export function CompareClient({
  allIems,
  initialIems,
}: {
  allIems: IEM[];
  initialIems: string | null;
}) {
  const { t } = useLanguage();
  const compareList = useAppStore((state) => state.compareList);
  const addToCompare = useAppStore((state) => state.addToCompare);
  const removeFromCompare = useAppStore((state) => state.removeFromCompare);
  const clearCompare = useAppStore((state) => state.clearCompare);
  const setCompareList = useAppStore((state) => state.setCompareList);
  const [ready, setReady] = useState(false);
  const [showZones, setShowZones] = useState(true);

  const initialSlugs = useMemo(
    () => initialIems === null ? [] : sanitizeSlugs(initialIems.split(",").filter(Boolean), allIems),
    [allIems, initialIems],
  );
  const selectedSlugs = ready ? compareList : initialSlugs;
  const selectedIems = useMemo(() => {
    const itemsBySlug = new Map(allIems.map((item) => [item.slug, item]));
    return selectedSlugs.flatMap((slug) => {
      const item = itemsBySlug.get(slug);
      return item ? [item] : [];
    });
  }, [allIems, selectedSlugs]);

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      await useAppStore.persist.rehydrate();
      if (!active) return;
      const urlSelection = initialIems === null ? null : initialIems.split(",").filter(Boolean);
      const savedSelection = useAppStore.getState().compareList;
      setCompareList(sanitizeSlugs(urlSelection ?? savedSelection, allIems));
      setReady(true);
    };
    void initialize();
    return () => { active = false; };
  }, [allIems, initialIems, setCompareList]);

  useEffect(() => {
    if (!ready) return;
    const url = new URL(window.location.href);
    const currentSelection = url.searchParams.get("iems");
    const nextSelection = compareList.join(",");
    if ((nextSelection === "" && !url.searchParams.has("iems")) || currentSelection === nextSelection) return;
    if (nextSelection) url.searchParams.set("iems", nextSelection);
    else url.searchParams.delete("iems");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, [compareList, ready]);

  useEffect(() => {
    const restoreFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.has("iems")) {
        setCompareList(sanitizeSlugs((params.get("iems") ?? "").split(",").filter(Boolean), allIems));
      } else {
        clearCompare();
      }
    };
    window.addEventListener("popstate", restoreFromUrl);
    return () => window.removeEventListener("popstate", restoreFromUrl);
  }, [allIems, clearCompare, setCompareList]);

  const frequencySeries = selectedIems.flatMap((item, index) => item.frData?.length ? [{
    id: item.slug,
    label: `${item.brand} ${item.name}`,
    color: compareColor(index),
    data: item.frData,
  }] : []);
  const suggestions = allIems.filter((item) => !selectedSlugs.includes(item.slug)).slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold text-primary">{t("compare.title")}</h1>
        <button
          type="button"
          disabled={selectedIems.length === 0}
          onClick={clearCompare}
          className="inline-flex min-h-11 items-center rounded-md border border-border px-3 text-sm text-secondary hover:bg-surface-subtle hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t("compare.clearAll")}
        </button>
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-20">
          <CompareSelector
            allIems={allIems}
            selectedIems={selectedIems}
            onAdd={addToCompare}
            onRemove={removeFromCompare}
          />
        </aside>

        <section aria-label={t("compare.title")} className="min-w-0 space-y-8">
          {selectedIems.length === 0 ? (
            <div className="space-y-6 rounded-lg border border-dashed border-border bg-surface px-6 py-10 text-center">
              <div className="mx-auto max-w-xl space-y-2">
                <h2 className="text-xl font-semibold text-primary">{t("compare.emptyTitle")}</h2>
                <p className="text-sm text-secondary">{t("compare.emptyDescription")}</p>
              </div>
              {suggestions.length > 0 ? (
                <div className="mx-auto max-w-xl space-y-3 text-left">
                  <h3 className="text-sm font-semibold text-primary">{t("compare.suggested")}</h3>
                  <ul className="divide-y divide-border">
                    {suggestions.map((item) => (
                      <li key={item.slug} className="flex min-h-14 items-center justify-between gap-3 py-2">
                        <Link href={`/iem/${encodeURIComponent(item.slug)}`} className="min-w-0 truncate text-sm text-primary hover:text-accent">
                          <span className="text-secondary">{item.brand}</span> {item.name}
                        </Link>
                        <button type="button" onClick={() => addToCompare(item.slug)} className="min-h-11 shrink-0 rounded-md border border-border px-3 text-sm text-primary hover:bg-surface-subtle">
                          {t("compare.add")}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-secondary">{t("compare.noAvailableIems")}</p>
              )}
            </div>
          ) : (
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div layout key="comparison-results" className="space-y-8">
                {selectedIems.length === 1 && <p className="text-sm text-secondary">{t("compare.singleSelection")}</p>}
                <CompareTable items={selectedIems} onRemove={removeFromCompare} />

                <section aria-labelledby="compare-graph-title" className="space-y-4 lg:sticky lg:top-20 lg:z-10 lg:bg-background/95 lg:py-3 lg:backdrop-blur">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 id="compare-graph-title" className="text-lg font-semibold text-primary">{t("compare.frequencyGraph")}</h2>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" role="switch" aria-checked={showZones} aria-label={t("graphModes.zones")} onClick={() => setShowZones((value) => !value)} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-3 text-sm text-primary hover:bg-surface-subtle">
                        <span className={`size-3 rounded-full ${showZones ? "bg-accent" : "bg-border"}`} />
                        {t("graphModes.zones")}
                      </button>
                    </div>
                  </div>
                  {frequencySeries.length > 0 ? (
                    <FrequencyGraph series={frequencySeries} showZones={showZones} onRemove={removeFromCompare} />
                  ) : (
                    <p className="rounded-md border border-dashed border-border bg-surface px-4 py-8 text-center text-sm text-secondary">
                      {t("product.noFrequencyData")}
                    </p>
                  )}
                </section>
              </motion.div>
            </AnimatePresence>
          )}
        </section>
      </div>
    </div>
  );
}