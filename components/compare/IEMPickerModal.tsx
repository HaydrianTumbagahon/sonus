"use client";

import Fuse from "fuse.js";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Search, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { IEMFilters } from "@/components/iem/IEMFilters";
import {
  defaultShowroomFilters,
  type DriverFilter,
  type ShowroomFilters,
} from "@/components/iem/filter-types";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { getIEMTier } from "@/lib/tiers";
import type { Brand, IEM } from "@/types/iem";

type LenisControls = { stop: () => void; start: () => void };
type LenisWindow = Window & { lenis?: LenisControls };

function matchesDriver(iem: IEM, selected: DriverFilter): boolean {
  if (selected === "all") return true;
  const text = [iem.driverType, iem.driverConfiguration].filter(Boolean).join(" ").toLowerCase();
  const aliases: Record<Exclude<DriverFilter, "all">, string[]> = {
    dd: ["dd", "dynamic driver", "dynamic"],
    ba: ["ba", "balanced armature", "balanced"],
    planar: ["planar"],
    est: ["est", "electrostatic"],
    "bone-conduction": ["bone conduction", "bone-conduction", "bone", "bc"],
    hybrid: ["hybrid"],
  };
  return aliases[selected].some((alias) => text.includes(alias));
}

export function IEMPickerModal({
  open,
  slotIndex,
  mode = "slot",
  allIems,
  brands,
  chosenSlugs,
  onClose,
  onSelect,
}: {
  open: boolean;
  slotIndex: number;
  mode?: "slot" | "add";
  allIems: IEM[];
  brands: Brand[];
  chosenSlugs: string[];
  onClose: () => void;
  onSelect: (slug: string) => void;
}) {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousActive = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [filters, setFilters] = useState<ShowroomFilters>(defaultShowroomFilters);
  const [randomIems, setRandomIems] = useState<IEM[]>([]);
  const [scrollFade, setScrollFade] = useState({ top: false, bottom: true });

  const updateScrollFade = (element: HTMLDivElement) => {
    const top = element.scrollTop > 4;
    const bottom = element.scrollHeight - element.scrollTop - element.clientHeight > 4;
    setScrollFade((current) =>
      current.top === top && current.bottom === bottom ? current : { top, bottom },
    );
  };

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const next = [...allIems];
    for (let index = next.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(Math.random() * (index + 1));
      [next[index], next[swap]] = [next[swap], next[index]];
    }
    setRandomIems(next);
    setFilters(defaultShowroomFilters);
    previousActive.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }, [open, allIems]);

  useEffect(() => {
    if (!open) return;
    setScrollFade({ top: false, bottom: true });
  }, [open]);

  useEffect(() => {
    if (!open || !mounted) return;
    const body = document.body;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const currentPadding = Number.parseFloat(window.getComputedStyle(body).paddingRight) || 0;
    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) body.style.paddingRight = `${currentPadding + scrollbarWidth}px`;
    const lenis = (window as LenisWindow).lenis;
    lenis?.stop();
    const frame = window.requestAnimationFrame(() => closeRef.current?.focus({ preventScroll: true }));

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>(
        "button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex='-1'])",
      )].filter((element) => element.getClientRects().length > 0);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown);
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
      lenis?.start();
      window.requestAnimationFrame(() => previousActive.current?.focus({ preventScroll: true }));
    };
  }, [open, mounted, onClose]);

  const searchIndex = useMemo(() => new Fuse(allIems, {
    keys: ["name", "brand", "description", "driverType", "driverConfiguration", "tags"],
    threshold: 0.35,
    ignoreLocation: true,
  }), [allIems]);

  const filteredByOther = useMemo(() => {
    const candidates = filters.query.trim()
      ? searchIndex.search(filters.query.trim()).map((result) => result.item)
      : randomIems;
    return candidates.filter((iem) => {
      if (!matchesDriver(iem, filters.driver)) return false;
      if (filters.tier !== "all" && getIEMTier(iem) !== filters.tier) return false;
      if (filters.brands.length && !filters.brands.includes(iem.brandSlug)) return false;
      return true;
    });
  }, [filters, randomIems, searchIndex]);

  const results = useMemo(() => {
    const next = [...filteredByOther];
    if (filters.price === "low-to-high") next.sort((a, b) => (a.priceUSD ?? Infinity) - (b.priceUSD ?? Infinity));
    if (filters.price === "high-to-low") next.sort((a, b) => (b.priceUSD ?? -Infinity) - (a.priceUSD ?? -Infinity));
    return next;
  }, [filteredByOther, filters.price]);

  const brandCounts = useMemo(() => Object.fromEntries(
    brands.map((brand) => [brand.slug, filteredByOther.filter((iem) => iem.brandSlug === brand.slug).length]),
  ), [brands, filteredByOther]);
  const active = filters.query.trim() || filters.brands.length > 0 || filters.price !== "default" || filters.driver !== "all" || filters.tier !== "all";

  if (!mounted || !open) return null;

  const title = mode === "add" ? t("compare.addIem") : t("compare.chooseIem");

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--background)]/55 p-2 backdrop-blur-md sm:p-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduceMotion ? 0.12 : 0.18 }}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
          transition={reduceMotion ? { duration: 0.12 } : { type: "spring", stiffness: 380, damping: 30 }}
          className="flex h-[90dvh] w-[calc(100%-16px)] flex-col overflow-hidden bg-[var(--background)] outline-none sm:h-[88vh] sm:max-h-[820px] sm:max-w-[1000px] sm:w-[94vw]"
        >
          <div className="flex shrink-0 items-center justify-between px-4 pb-2 pt-4 sm:px-6">
            <h2 id={titleId} className="text-lg font-semibold text-primary">{title}</h2>
            <button ref={closeRef} type="button" data-modal-close aria-label={t("common.close")} onClick={onClose} className="inline-flex size-11 items-center justify-center text-primary">
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>
          <div className="shrink-0 space-y-3 px-4 sm:px-6">
            <label className="relative block">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-tertiary" />
              <input
                type="search"
                aria-label={t("compare.searchPlaceholder")}
                value={filters.query}
                onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
                placeholder={t("compare.searchPlaceholder")}
                className="min-h-11 w-full rounded-md border border-border bg-background pl-10 pr-3 text-sm text-primary placeholder:text-tertiary focus-visible:border-accent"
              />
            </label>
            <IEMFilters brands={brands} filters={filters} onChange={setFilters} brandCounts={brandCounts} totalCount={filteredByOther.length} />
            {active && (
              <div className="flex min-h-11 items-center justify-between gap-3 text-sm">
                <span role="status" className="text-secondary">{t("compare.resultCount").replace("{count}", String(results.length))}</span>
                <button type="button" onClick={() => setFilters(defaultShowroomFilters)} className="min-h-11 text-brand-text hover:text-primary">{t("showroomUi.clearAll")}</button>
              </div>
            )}
          </div>
          <div
            data-lenis-prevent
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-5 sm:px-6"
            onScroll={(event) => updateScrollFade(event.currentTarget)}
            style={{
              maskImage: scrollFade.top && scrollFade.bottom
                ? "linear-gradient(to bottom, transparent, black 18px, black calc(100% - 18px), transparent)"
                : scrollFade.top
                  ? "linear-gradient(to bottom, transparent, black 18px, black)"
                  : scrollFade.bottom
                    ? "linear-gradient(to bottom, black calc(100% - 18px), transparent)"
                    : "none",
            }}
          >
            {results.length ? (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                {results.map((iem) => {
                  const chosen = chosenSlugs.includes(iem.slug);
                  return (
                    <button
                      key={iem.slug}
                      type="button"
                      disabled={chosen}
                      onClick={() => onSelect(iem.slug)}
                      className="group min-w-0 text-left disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <span className="relative flex aspect-[4/3] items-center justify-center overflow-hidden">
                        {iem.images.hero ? (
                          <Image src={iem.images.hero} alt="" width={280} height={210} draggable={false} className="size-full object-contain transition-transform duration-200 group-hover:scale-105" />
                        ) : (
                          <span className="text-sm font-semibold text-secondary">{iem.brand.slice(0, 2).toUpperCase()}</span>
                        )}
                      </span>
                      <span className="block truncate text-xs text-tertiary">{iem.brand}</span>
                      <span className="mt-0.5 block truncate text-sm font-medium text-primary">{iem.name}</span>
                      <span className="mt-1 block text-sm text-brand-text">{typeof iem.priceUSD === "number" ? formatPrice(iem.priceUSD) : t("common.priceUnavailable")}</span>
                      {chosen && <span className="mt-1 block text-xs text-tertiary">{t("compare.alreadyChosen")}</span>}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex min-h-56 flex-col items-center justify-center gap-4 text-center">
                <p className="text-sm text-secondary">{t("showroomUi.noMatch")}</p>
                <button type="button" onClick={() => setFilters(defaultShowroomFilters)} className="min-h-11 text-brand-text">{t("showroomUi.clearAll")}</button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}