"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { IEMPickerModal } from "@/components/compare/IEMPickerModal";
import { ComparisonResult } from "@/components/compare/ComparisonResult";
import { compareColor } from "@/components/compare/colors";
import { PageBand } from "@/components/layout/PageBand";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { scrollToTarget } from "@/lib/scroll";
import { useAppStore } from "@/lib/store";
import type { Brand, IEM } from "@/types/iem";
import { usePageReady } from "@/lib/transition";

function sanitizeSlugs(slugs: string[], allIems: IEM[]): string[] {
  const allowed = new Set(allIems.map((iem) => iem.slug));
  return [...new Set(slugs)].filter((slug) => allowed.has(slug)).slice(0, 6);
}

export function CompareClient({
  allIems,
  brands,
  initialIems,
}: {
  allIems: IEM[];
  brands: Brand[];
  initialIems: string | null;
}) {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const reduceMotion = useReducedMotion();
  const pageReady = usePageReady();
  const compareList = useAppStore((state) => state.compareList);
  const setCompareList = useAppStore((state) => state.setCompareList);
  const setCompareSlot = useAppStore((state) => state.setCompareSlot);
  const clearCompareSlot = useAppStore((state) => state.clearCompareSlot);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<"select" | "result">("select");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState(0);

  const initialSlugs = useMemo(
    () => initialIems === null ? [] : sanitizeSlugs(initialIems.split(",").filter(Boolean), allIems),
    [allIems, initialIems],
  );

  useEffect(() => {
    let active = true;
    void (async () => {
      await useAppStore.persist.rehydrate();
      if (!active) return;
      const urlSelection = initialIems === null ? null : sanitizeSlugs(initialIems.split(",").filter(Boolean), allIems);
      const savedSelection = useAppStore.getState().compareList;
      const next = urlSelection ?? savedSelection;
      setCompareList(next);
      if (urlSelection && urlSelection.length >= 2) setView("result");
      setReady(true);
    })();
    return () => { active = false; };
  }, [allIems, initialIems, setCompareList]);

  useEffect(() => {
    if (!ready) return;
    const url = new URL(window.location.href);
    const nextSelection = compareList.join(",");
    if (nextSelection === "") url.searchParams.delete("iems");
    else url.searchParams.set("iems", nextSelection);
    if (url.searchParams.toString() === window.location.search.slice(1)) return;
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, [compareList, ready]);

  useEffect(() => {
    const restoreFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.has("iems")) {
        const slugs = sanitizeSlugs((params.get("iems") ?? "").split(",").filter(Boolean), allIems);
        setCompareList(slugs);
        setView(slugs.length >= 2 ? "result" : "select");
      } else {
        setCompareList([]);
        setView("select");
      }
    };
    window.addEventListener("popstate", restoreFromUrl);
    return () => window.removeEventListener("popstate", restoreFromUrl);
  }, [allIems, setCompareList]);

  const selectedSlugs = ready ? compareList : initialSlugs;
  const slotItems = [selectedSlugs[0], selectedSlugs[1]].map((slug) =>
    slug ? allIems.find((iem) => iem.slug === slug) : undefined,
  );

  const openPicker = (index: number) => {
    setActiveSlot(index);
    setPickerOpen(true);
  };
  const selectIem = (slug: string) => {
    setCompareSlot(activeSlot, slug);
    setPickerOpen(false);
  };

  if (view === "result") {
    const items = selectedSlugs
      .map((slug) => allIems.find((iem) => iem.slug === slug))
      .filter((iem): iem is IEM => Boolean(iem));
    const removeItem = (slug: string) => {
      useAppStore.getState().removeFromCompare(slug);
      if (selectedSlugs.length <= 3) {
        const remaining = selectedSlugs.filter((item) => item !== slug);
        if (remaining.length < 2) setView("select");
      }
    };
    const addItem = (slug: string) => useAppStore.getState().addToCompare(slug);
    const clearItems = () => {
      useAppStore.getState().clearCompare();
      setView("select");
    };
    return (
      <>
        <PageBand outlineWord="COMPARE" tone="brand">
          <h1 className="origin-left text-[clamp(2.5rem,6vw,5rem)] font-normal uppercase leading-[0.9] [font-family:var(--font-anton),var(--font-family-sans)] [transform:skewX(-12deg)] [color:var(--on-brand)] [text-shadow:4px_4px_0_color-mix(in_srgb,var(--on-brand)_25%,transparent)]">{t("compare.title")}</h1>
        </PageBand>
        <ComparisonResult
          items={items}
          allIems={allIems}
          brands={brands}
          onChange={() => setView("select")}
          onClear={clearItems}
          onRemove={removeItem}
          onAdd={addItem}
        />
      </>
    );
  }

  return (
    <>
      <PageBand outlineWord="COMPARE" tone="brand">
        <h1 className="origin-left text-[clamp(2.5rem,6vw,5rem)] font-normal uppercase leading-[0.9] [font-family:var(--font-anton),var(--font-family-sans)] [transform:skewX(-12deg)] [color:var(--on-brand)] [text-shadow:4px_4px_0_color-mix(in_srgb,var(--on-brand)_25%,transparent)]">{t("compare.title")}</h1>
      </PageBand>
      <div className="relative isolate overflow-hidden pt-[calc(2.5rem+var(--wave-h))] sm:pt-[calc(3.5rem+var(--wave-h))]">
        <div className="relative z-10 mx-auto max-w-[860px] px-4 py-10 sm:px-6 sm:py-14">
          <div data-intro className="grid grid-cols-2 gap-3 sm:gap-8">
            {[0, 1].map((index) => {
              const iem = slotItems[index];
              const outlineColor = compareColor(index);
              return (
                <motion.div
                  key={index}
                  initial={iem && !reduceMotion ? { opacity: 0, scale: 0.8, rotate: -6 } : false}
                  animate={pageReady || reduceMotion ? { opacity: 1, scale: 1, rotate: 0 } : { opacity: 0, scale: 0.8, rotate: -6 }}
                  transition={reduceMotion || !pageReady ? { duration: 0 } : { type: "spring", stiffness: 330, damping: 22 }}
                  className="relative flex min-h-[250px] min-w-0 items-center justify-center sm:min-h-[340px]"
                >
                  {iem ? (
                    <div className="relative flex min-h-[250px] w-full flex-col items-center justify-end pb-2 text-center sm:min-h-[340px] sm:pb-4">
                      <button
                        type="button"
                        aria-label={`${t("compare.changeIem")}: ${iem.name}`}
                        onClick={() => openPicker(index)}
                        className="group absolute inset-x-0 top-0 bottom-10 focus-visible:outline-offset-4"
                      >
                        <span aria-hidden="true" className="absolute left-1/2 top-[42%] size-[72%] max-h-64 -translate-x-1/2 -translate-y-1/2 rounded-[44%_56%_52%_48%/55%_45%_55%_45%]" style={{ background: "var(--brand)", opacity: 0.12 }} />
                        {iem.images.hero && (
                          <Image src={iem.images.hero} alt="" width={360} height={360} draggable={false} className="absolute left-1/2 top-[42%] max-h-[210px] w-[82%] -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_16px_18px_color-mix(in_srgb,var(--brand-outline)_45%,transparent)] sm:max-h-[280px]" />
                        )}
                      </button>
                      <button
                        type="button"
                        aria-label={`${t("compare.remove")}: ${iem.name}`}
                        onClick={() => clearCompareSlot(index)}
                        className="absolute right-0 top-0 z-10 inline-flex size-11 items-center justify-center text-primary hover:text-brand-text"
                      >
                        <X aria-hidden="true" className="size-5" />
                      </button>
                      <div className="relative z-10 w-full border-t-2 px-1 pt-3" style={{ borderColor: outlineColor }}>
                        <p className="truncate text-xs text-tertiary">{iem.brand}</p>
                        <h2 className="mt-1 line-clamp-2 text-base uppercase text-primary sm:text-2xl" style={{ fontFamily: "var(--font-anton), var(--font-geist-sans), sans-serif", fontWeight: 400 }}>{iem.name}</h2>
                        <p className="mt-1 text-sm text-brand-text">{typeof iem.priceUSD === "number" ? formatPrice(iem.priceUSD) : t("common.priceUnavailable")}</p>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openPicker(index)}
                      className="group flex min-h-[250px] w-full items-center justify-center sm:min-h-[340px] focus-visible:outline-offset-4"
                    >
                      <span aria-hidden="true" className="flex size-[72px] items-center justify-center rounded-full border-2 sm:size-24" style={{ borderColor: "var(--brand-outline)" }}>
                        <Plus aria-hidden="true" className="size-8 transition-transform duration-200 sm:size-10 group-hover:rotate-90 group-hover:scale-110 group-active:scale-[0.97]" />
                      </span>
                      <span className="sr-only">{t("compare.addIem")}</span>
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
          <AnimatePresence>
            {slotItems[0] && slotItems[1] && (
              <motion.button
                type="button"
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.8 }}
                transition={reduceMotion ? { duration: 0.12 } : { type: "spring", stiffness: 360, damping: 24 }}
                onClick={() => {
                  setView("result");
                  window.requestAnimationFrame(() => {
                    const result = document.getElementById("compare-results");
                    if (result) scrollToTarget(result);
                    else scrollToTarget(0);
                  });
                }}
                className="mx-auto mt-6 flex h-[52px] items-center justify-center rounded-full px-8 text-sm font-medium text-on-brand"
                style={{ background: "var(--brand)" }}
              >
                {t("compare.compare")}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
      <IEMPickerModal
        open={pickerOpen}
        slotIndex={activeSlot}
        allIems={allIems}
        brands={brands}
        chosenSlugs={selectedSlugs}
        onClose={() => setPickerOpen(false)}
        onSelect={selectIem}
      />
    </>
  );
}
