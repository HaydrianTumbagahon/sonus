"use client";

import Fuse from "fuse.js";
import { motion, useReducedMotion } from "framer-motion";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { IEMFilters } from "@/components/iem/IEMFilters";
import { IEMGrid } from "@/components/iem/IEMGrid";
import { defaultShowroomFilters, parseShowroomFilters, serializeShowroomFilters, type DriverFilter, type ShowroomFilters } from "@/components/iem/filter-types";
import { getIEMTier } from "@/lib/tiers";
import type { Brand, IEM } from "@/types/iem";
import { PageBand } from "@/components/layout/PageBand";
import { usePageReady } from "@/lib/transition";

const driverAliases: Record<Exclude<DriverFilter, "all">, string[]> = {
  dd: ["dd", "dynamic driver", "dynamic"],
  ba: ["ba", "balanced armature", "balanced"],
  planar: ["planar"],
  est: ["est", "electrostatic"],
  "bone-conduction": ["bone conduction", "bone-conduction", "bone", "bc"],
  hybrid: ["hybrid"],
};

function matchesDriver(iem: IEM, selected: DriverFilter): boolean {
  if (selected === "all") return true;
  const driverText = [iem.driverType, iem.driverConfiguration]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();
  return driverAliases[selected].some((alias) =>
    alias.length <= 3
      ? new RegExp(`(?:^|\\W)${alias}(?:$|\\W)`, "i").test(driverText)
      : driverText.includes(alias),
  );
}

function shuffleIems(items: IEM[]): IEM[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function hasActiveFilters(filters: ShowroomFilters): boolean {
  return filters.brands.length > 0 || filters.price !== "default" || filters.driver !== "all" || filters.tier !== "all" || Boolean(filters.query.trim());
}

export function ShowroomClient({
  iems,
  brands,
  initialSearch,
}: {
  iems: IEM[];
  brands: Brand[];
  initialSearch: string;
}) {
  const { t } = useLanguage();
  const reduceMotion = useReducedMotion();
  const pageReady = usePageReady();
  const brandSlugs = useMemo(() => brands.map((brand) => brand.slug), [brands]);
  const [filters, setFilters] = useState<ShowroomFilters>(() =>
    parseShowroomFilters(new URLSearchParams(initialSearch), brandSlugs),
  );
  const [randomizedIems, setRandomizedIems] = useState(iems);
  const [shuffleReady, setShuffleReady] = useState(false);
  const searchIndex = useMemo(() => new Fuse(iems, {
    keys: ["name", "brand", "description", "driverType", "driverConfiguration", "tags"],
    threshold: 0.35,
    ignoreLocation: true,
  }), [iems]);
  const active = hasActiveFilters(filters);

  useEffect(() => {
    setRandomizedIems(shuffleIems(iems));
    setShuffleReady(true);
  }, [iems]);

  useEffect(() => {
    const nextUrl = new URL(window.location.href);
    const serialized = serializeShowroomFilters(filters);
    if (nextUrl.searchParams.toString() === serialized) return;
    nextUrl.search = serialized;
    window.history.replaceState(null, "", `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
  }, [filters]);

  useEffect(() => {
    const restoreFromUrl = () => {
      setFilters(parseShowroomFilters(new URLSearchParams(window.location.search), brandSlugs));
    };
    window.addEventListener("popstate", restoreFromUrl);
    return () => window.removeEventListener("popstate", restoreFromUrl);
  }, [brandSlugs]);

  const filteredByOtherOptions = useMemo(() => {
    const query = filters.query.trim();
    const candidates = query ? searchIndex.search(query).map((result) => result.item) : randomizedIems;
    return candidates.filter((iem) => {
      if (!matchesDriver(iem, filters.driver)) return false;
      if (filters.tier !== "all" && getIEMTier(iem) !== filters.tier) return false;
      return true;
    });
  }, [filters.driver, filters.query, filters.tier, randomizedIems, searchIndex]);

  const brandCounts = useMemo(() => Object.fromEntries(
    brands.map((brand) => [brand.slug, filteredByOtherOptions.filter((iem) => iem.brandSlug === brand.slug).length]),
  ), [brands, filteredByOtherOptions]);

  const visibleIems = useMemo(() => {
    const filtered = filteredByOtherOptions.filter((iem) =>
      filters.brands.length === 0 || filters.brands.includes(iem.brandSlug),
    );

    if (!filters.query.trim() && filters.price === "low-to-high") {
      filtered.sort((left, right) => (left.priceUSD ?? Number.POSITIVE_INFINITY) - (right.priceUSD ?? Number.POSITIVE_INFINITY));
    } else if (!filters.query.trim() && filters.price === "high-to-low") {
      filtered.sort((left, right) => (right.priceUSD ?? Number.NEGATIVE_INFINITY) - (left.priceUSD ?? Number.NEGATIVE_INFINITY));
    }
    return filtered;
  }, [filteredByOtherOptions, filters.brands, filters.price, filters.query]);

  const clearFilters = () => setFilters(defaultShowroomFilters);

  return (
    <>
      <PageBand outlineWord="SHOWROOM" tone="brand">
        <h1 className="origin-left text-[clamp(2.5rem,6vw,5rem)] font-normal uppercase leading-[0.9] [font-family:var(--font-anton),var(--font-family-sans)] [transform:skewX(-12deg)] [color:var(--on-brand)] [text-shadow:4px_4px_0_color-mix(in_srgb,var(--on-brand)_25%,transparent)]">
          {t("showroom.title")}
        </h1>
      </PageBand>
      <div className="relative isolate overflow-hidden pt-[calc(2rem+var(--wave-h))]">
        <div className="relative z-10 mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:py-10">

      <section aria-label={t("showroomUi.filters")} className="space-y-3">
        <label data-intro className="relative block w-full sm:max-w-sm">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-tertiary" />
          <input
            type="search"
            aria-label={t("showroom.filters.search")}
            placeholder={t("showroom.filters.search")}
            value={filters.query}
            onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
            className="min-h-11 w-full rounded-sm border border-border bg-background pl-10 pr-3 text-sm text-primary placeholder:text-tertiary focus-visible:border-accent"
          />
        </label>
        <IEMFilters brands={brands} filters={filters} onChange={setFilters} brandCounts={brandCounts} totalCount={filteredByOtherOptions.length} />
        {active && (
          <div className="flex min-h-11 flex-wrap items-center justify-between gap-3">
            <p aria-live="polite" className="text-sm text-secondary">
              {t("showroomUi.resultCount").replace("{count}", String(visibleIems.length))}
            </p>
            <button type="button" onClick={clearFilters} className="inline-flex min-h-11 items-center rounded-sm px-3 text-sm font-medium text-accent hover:bg-surface-subtle">
              {t("showroomUi.clearAll")}
            </button>
          </div>
        )}
      </section>

      {visibleIems.length > 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: shuffleReady && pageReady ? 1 : 0 }} transition={{ duration: reduceMotion || !pageReady ? 0 : 0.2 }} aria-busy={!shuffleReady}>
          <IEMGrid items={visibleIems} />
        </motion.div>
      ) : (
        <div role="status" className="flex min-h-56 flex-col items-center justify-center gap-4 rounded-sm border border-dashed border-border bg-surface px-6 py-10 text-center">
          <p className="text-lg font-semibold text-primary">{t("showroomUi.noMatch")}</p>
          <button type="button" onClick={clearFilters} className="inline-flex min-h-11 items-center rounded-sm bg-accent px-4 text-sm font-medium text-background hover:bg-accent-hover">
            {t("showroomUi.clearFilters")}
          </button>
        </div>
      )}
        </div>
      </div>
    </>
  );
}