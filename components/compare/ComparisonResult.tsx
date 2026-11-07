"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { compareColor } from "@/components/compare/colors";
import { IEMPickerModal } from "@/components/compare/IEMPickerModal";
import { FrequencyGraph, type FrequencyGraphSeries } from "@/components/iem/FrequencyGraph";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { formatRating } from "@/lib/format";
import { revealEase } from "@/lib/motion";
import type { Brand, FrequencyPoint, IEM } from "@/types/iem";

type Props = {
  items: IEM[];
  allIems: IEM[];
  brands: Brand[];
  onChange: () => void;
  onClear: () => void;
  onRemove: (slug: string) => void;
  onAdd: (slug: string) => void;
};

function textValue(value: unknown, fallback = "-"): string {
  if (value === undefined || value === null || value === "") return fallback;
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : fallback;
  return String(value);
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function normalizedText(value: unknown, fallback = "-"): string {
  if (value === undefined || value === null || value === "") return fallback;
  if (Array.isArray(value)) return value.map((item) => normalizedText(item, "")).filter(Boolean).join(", ") || fallback;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const entries = Object.values(record).filter((item) => item !== undefined && item !== null && item !== "");
    return entries.length > 0 ? entries.map((item) => normalizedText(item, "")).filter(Boolean).join(", ") : fallback;
  }
  return String(value);
}

function humanizeKey(key: string): string {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase()).trim();
}

function buildValue(iem: IEM, key: string): unknown {
  const build = asRecord(iem.build) ?? asRecord(iem.buildDetails);
  const buildDetails = asRecord(iem.buildDetails);
  const materials = asRecord(iem.materials);
  return build?.[key] ?? buildDetails?.[key] ?? materials?.[key] ?? iem[`${key}Material`] ?? iem[key];
}

function averageChannels(iem: IEM): FrequencyPoint[] {
  if (iem.frData?.length) return iem.frData;
  const map = new Map<number, number[]>();
  for (const point of [...(iem.frDataL ?? []), ...(iem.frDataR ?? [])]) {
    map.set(point.frequency, [...(map.get(point.frequency) ?? []), point.db]);
  }
  return [...map.entries()]
    .map(([frequency, values]) => ({ frequency, db: values.reduce((sum, value) => sum + value, 0) / values.length }))
    .sort((left, right) => left.frequency - right.frequency);
}

function Winner({ active }: { active: boolean }) {
  const reduceMotion = useReducedMotion();
  if (!active) return null;
  return (
    <motion.span
      initial={reduceMotion ? false : { opacity: 0, scale: 0.4 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.22, ease: revealEase }}
      className="inline-flex items-center align-middle"
    >
      <Check aria-hidden="true" className="ml-1 size-3.5 text-brand-text" strokeWidth={2.5} />
    </motion.span>
  );
}

export function ComparisonResult({ items, allIems, brands, onChange, onClear, onRemove, onAdd }: Props) {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const reduceMotion = useReducedMotion();
  const pair = items.slice(0, 6);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [overflow, setOverflow] = useState({ left: false, right: false });
  const scrollerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const scrollFrameRef = useRef<number | null>(null);
  const dragRef = useRef({ active: false, moved: false, startX: 0, startScroll: 0, pointerId: -1 });
  const previousSlugs = useRef(pair.map((iem) => iem.slug).join(","));
  const previousSlugsSet = useRef(new Set<string>());

  const updateOverflow = () => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const max = scroller.scrollWidth - scroller.clientWidth;
    const nextOverflow = { left: scroller.scrollLeft > 2, right: max > 2 && scroller.scrollLeft < max - 2 };
    setOverflow((current) => current.left === nextOverflow.left && current.right === nextOverflow.right ? current : nextOverflow);
    const progress = max <= 0 ? 0 : Math.max(0, Math.min(1, scroller.scrollLeft / max));
    if (progressBarRef.current) progressBarRef.current.style.transform = `scaleX(${Math.max(0.08, progress)})`;
  };

  const scheduleOverflowUpdate = () => {
    if (scrollFrameRef.current !== null) return;
    scrollFrameRef.current = window.requestAnimationFrame(() => {
      scrollFrameRef.current = null;
      updateOverflow();
    });
  };

  useEffect(() => {
    updateOverflow();
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.addEventListener("scroll", scheduleOverflowUpdate, { passive: true });
    const observer = new ResizeObserver(scheduleOverflowUpdate);
    observer.observe(scroller);
    return () => {
      scroller.removeEventListener("scroll", scheduleOverflowUpdate);
      observer.disconnect();
      if (scrollFrameRef.current !== null) window.cancelAnimationFrame(scrollFrameRef.current);
      scrollFrameRef.current = null;
    };
  }, [pair.length]);

  useEffect(() => {
    const nextKey = pair.map((iem) => iem.slug).join(",");
    if (nextKey !== previousSlugs.current) {
      const previous = new Set(previousSlugs.current ? previousSlugs.current.split(",") : []);
      const added = pair.some((iem) => !previous.has(iem.slug));
      previousSlugs.current = nextKey;
      if (added) {
        window.requestAnimationFrame(() => scrollerRef.current?.scrollTo({
          left: scrollerRef.current.scrollWidth,
          behavior: reduceMotion ? "auto" : "smooth",
        }));
      }
    }
  }, [pair, reduceMotion]);

  useEffect(() => {
    previousSlugsSet.current = new Set(pair.map((iem) => iem.slug));
  }, [pair]);

  if (pair.length < 2) return null;

  const ratingKeys = ["build", "value", "sound", "overall"];
  const ratingValue = (iem: IEM, key: string): number | undefined => {
    if (key !== "overall") {
      const value = iem.ratings?.[key];
      return typeof value === "number" && Number.isFinite(value) ? value : undefined;
    }
    const values = [iem.ratings?.build, iem.ratings?.value, iem.ratings?.sound];
    if (!values.every((value): value is number => typeof value === "number" && Number.isFinite(value))) return undefined;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  };

  const numericWinner = (key: string) => {
    let winner = -1;
    let highest = -Infinity;
    for (let index = 0; index < pair.length; index += 1) {
      const value = key === "price" ? pair[index].priceUSD : ratingValue(pair[index], key);
      if (typeof value !== "number") continue;
      if (value > highest || (key === "price" && value === highest)) {
        highest = value;
        winner = index;
      }
    }
    if (key === "price") {
      const prices = pair.map((iem) => iem.priceUSD).filter((value): value is number => typeof value === "number");
      if (prices.length === 0 || new Set(prices).size === 1) return -1;
      const lowest = Math.min(...prices);
      return pair.findIndex((iem) => iem.priceUSD === lowest);
    }
    const values = pair.map((iem) => ratingValue(iem, key)).filter((value): value is number => typeof value === "number");
    if (values.length === 0 || new Set(values).size === 1) return -1;
    const highestValue = Math.max(...values);
    return pair.findIndex((iem) => ratingValue(iem, key) === highestValue);
  };

  const standardRows = [
    { key: "driverConfiguration", label: t("spec.driverConfiguration"), values: pair.map((iem) => normalizedText(iem.driverConfiguration ?? iem.specs?.driverConfiguration)) },
    { key: "driverType", label: t("spec.driverType"), values: pair.map((iem) => normalizedText(iem.driverType ?? iem.specs?.driverType)) },
    { key: "tier", label: t("spec.tier"), values: pair.map((iem) => normalizedText(iem.tier ?? iem.specs?.tier)) },
    { key: "impedance", label: t("spec.impedance"), values: pair.map((iem) => normalizedText(iem.impedance ?? iem.specs?.impedance)) },
    { key: "sensitivity", label: t("spec.sensitivity"), values: pair.map((iem) => normalizedText(iem.sensitivity ?? iem.specs?.sensitivity)) },
    { key: "frequencyResponse", label: t("spec.frequencyResponse"), values: pair.map((iem) => normalizedText(iem.frequencyResponse ?? iem.specs?.frequencyResponse)) },
    { key: "weight", label: t("spec.weight"), values: pair.map((iem) => normalizedText(iem.weight ?? iem.specs?.weight)) },
    { key: "shell", label: t("spec.shell"), values: pair.map((iem) => normalizedText(buildValue(iem, "shell"))) },
    { key: "faceplate", label: t("spec.faceplate"), values: pair.map((iem) => normalizedText(buildValue(iem, "faceplate"))) },
    { key: "nozzle", label: t("spec.nozzle"), values: pair.map((iem) => normalizedText(buildValue(iem, "nozzle"))) },
    { key: "cable", label: t("spec.cable"), values: pair.map((iem) => normalizedText(buildValue(iem, "cable"))) },
    { key: "connector", label: t("spec.connector"), values: pair.map((iem) => normalizedText(iem.connector ?? buildValue(iem, "connector") ?? iem.specs?.connector)) },
    { key: "releaseDate", label: t("spec.releaseDate"), values: pair.map((iem) => normalizedText(iem.releaseDate ?? iem.specs?.releaseDate)) },
    { key: "description", label: t("spec.description"), values: pair.map((iem) => normalizedText(iem.description ?? iem.specs?.description)) },
    { key: "personalInsight", label: t("compare.personalInsight"), values: pair.map((iem) => normalizedText(iem.personalInsight ?? iem.insight ?? iem.specs?.personalInsight)) },
    { key: "inTheBox", label: t("compare.accessories"), values: pair.map((iem) => normalizedText(iem.inTheBox ?? iem.boxContents ?? iem.accessories ?? iem.specs?.inTheBox)) },
    { key: "pros", label: t("compare.pros"), values: pair.map((iem) => normalizedText(iem.pros)) },
    { key: "cons", label: t("compare.cons"), values: pair.map((iem) => normalizedText(iem.cons)) },
    { key: "measuredBy", label: t("compare.measuredBy"), values: pair.map((iem) => normalizedText(iem.measuredBy)) },
    { key: "measuredOn", label: t("compare.measuredOn"), values: pair.map((iem) => normalizedText(iem.measuredOn)) },
  ].filter((row) => row.values.some((value) => value !== "-"));

  const customKeys = [...new Set(pair.flatMap((iem) => Object.keys(iem.specs ?? {})))];
  const knownKeys = new Set([
    "driverConfiguration", "driverType", "tier", "impedance", "sensitivity", "frequencyResponse",
    "weight", "shell", "faceplate", "nozzle", "cable", "connector", "releaseDate", "description",
    "personalInsight", "inTheBox", "pros", "cons", "measuredBy", "measuredOn", "build", "buildDetails",
    "materials", "boxContents", "accessories", "insight", "brand", "brandSlug", "name", "priceUSD",
    "ratings", "images", "frData", "frDataL", "frDataR", "tags", "id", "slug",
  ]);
  const customRows = customKeys.filter((key) => !knownKeys.has(key)).map((key) => {
    const translationKey = `spec.${key}`;
    const translated = t(translationKey);
    return {
      key: `custom-${key}`,
      label: translated === translationKey ? humanizeKey(key) : translated,
      values: pair.map((iem) => normalizedText(iem.specs?.[key])),
    };
  }).filter((row) => row.values.some((value) => value !== "-"));

  const unknownKeys = [...new Set(pair.flatMap((iem) =>
    Object.keys(iem).filter((key) => !knownKeys.has(key) && !key.startsWith("frData")),
  ))];
  const unknownRows = unknownKeys.map((key) => ({
    key: `unknown-${key}`,
    label: humanizeKey(key),
    values: pair.map((iem) => normalizedText(iem[key])),
  })).filter((row) => row.values.some((value) => value !== "-"));

  const rows = [...standardRows, ...customRows, ...unknownRows];

  const series: FrequencyGraphSeries[] = pair.map((iem, index) => ({
    id: iem.slug,
    label: `${iem.brand} ${iem.name}`,
    data: averageChannels(iem),
    color: compareColor(index),
    strokeWidth: 3,
  }));

  const newSeriesIds = pair.map((iem) => iem.slug).filter((slug) => !previousSlugsSet.current.has(slug));

  const differentRigs = pair.some((iem) => iem.measuredOn) &&
    new Set(pair.map((iem) => iem.measuredOn).filter(Boolean)).size > 1;
  const credits = pair.map((iem) => iem.measuredBy ? `${iem.brand} ${iem.name}: ${iem.measuredBy}` : null).filter(Boolean);

  const scrollOneColumn = (direction: -1 | 1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const column = scroller.querySelector<HTMLElement>("[data-compare-column]");
    const amount = column?.getBoundingClientRect().width ?? scroller.clientWidth * 0.44;
    scroller.scrollBy({ left: amount * direction, behavior: reduceMotion ? "auto" : "smooth" });
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("a,button,input,textarea,select,[role='button']")) return;
    const scroller = event.currentTarget;
    dragRef.current = { active: true, moved: false, startX: event.clientX, startScroll: scroller.scrollLeft, pointerId: event.pointerId };
    scroller.setPointerCapture(event.pointerId);
    scroller.classList.add("cursor-grabbing");
  };
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active || dragRef.current.pointerId !== event.pointerId) return;
    const distance = event.clientX - dragRef.current.startX;
    if (Math.abs(distance) > 6) dragRef.current.moved = true;
    event.currentTarget.scrollLeft = dragRef.current.startScroll - distance;
  };
  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    event.currentTarget.classList.remove("cursor-grabbing");
    dragRef.current.active = false;
  };
  const blockClickAfterDrag = (event: React.MouseEvent<HTMLDivElement>) => {
    if (dragRef.current.moved) {
      event.preventDefault();
      event.stopPropagation();
      dragRef.current.moved = false;
    }
  };

  const ColumnHeader = ({ iem, index, mobile }: { iem: IEM; index: number; mobile: boolean }) => (
    <motion.div
      layout
      initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28, delay: reduceMotion ? 0 : index * 0.06, ease: revealEase }}
      data-compare-column
      role="columnheader"
      className={mobile ? "relative min-w-0 px-2 py-4 text-center" : "relative min-h-[330px] min-w-0 rounded-xl border border-border bg-surface px-4 pb-5 pt-0"}
    >
      {!mobile && <div className="mb-5 h-1 rounded-b-full" style={{ background: compareColor(index) }} />}
      {pair.length >= 3 && (
        <button type="button" aria-label={`${t("compare.remove")}: ${iem.name}`} onClick={() => onRemove(iem.slug)} className="absolute right-0 top-0 z-20 inline-flex size-11 items-center justify-center text-primary hover:text-brand-text">
          <X aria-hidden="true" className="size-5" />
        </button>
      )}
      {iem.images.hero && (
        <div className={mobile ? "mx-auto mb-3 h-[120px] max-w-[120px]" : "relative mx-auto mb-4 h-[220px] max-w-[280px]"}>
          <span aria-hidden="true" className="absolute left-1/2 top-1/2 size-[78%] -translate-x-1/2 -translate-y-1/2 rounded-[44%_56%_52%_48%/55%_45%_55%_45%]" style={{ background: "var(--brand)", opacity: 0.12 }} />
          <Image src={iem.images.hero} alt="" width={mobile ? 240 : 420} height={mobile ? 240 : 420} draggable={false} className="relative size-full object-contain drop-shadow-[0_16px_18px_color-mix(in_srgb,var(--brand-outline)_45%,transparent)]" />
        </div>
      )}
      <p className="text-xs text-tertiary">{iem.brand}</p>
      <h2 className="mt-1 line-clamp-2 text-base uppercase text-primary sm:text-xl" style={{ fontFamily: "var(--font-anton), var(--font-geist-sans), sans-serif", fontWeight: 400 }}>{iem.name}</h2>
      <p className="mt-2 font-mono text-sm text-brand-text">
        {typeof iem.priceUSD === "number" ? formatPrice(iem.priceUSD) : "-"}
        {typeof iem.priceUSD === "number" && <Winner active={numericWinner("price") === index} />}
      </p>
      <p className="mt-2 text-xs text-secondary">{textValue(iem.driverType)}</p>
      {!mobile && (
        <a href={`/iem/${iem.slug}`} className="group mt-3 inline-flex min-h-11 items-center gap-2 text-sm text-brand-text hover:text-primary focus-visible:outline-offset-4">
          {t("compare.fullPage")} <ArrowRight aria-hidden="true" className="size-[18px] transition-transform duration-200 group-hover:translate-x-[3px]" strokeWidth={2} />
        </a>
      )}
    </motion.div>
  );

  return (
    <section id="compare-results" aria-label={t("compare.title")} className="relative isolate mx-auto max-w-[1200px] px-3 pb-14 pt-[calc(2rem+var(--wave-h))] sm:px-6 sm:pt-[calc(2rem+var(--wave-h))] md:px-8">
      <div className="relative z-[1]">
        {pair.length <= 3 ? (
          <>
            <div role="table" aria-label={t("compare.title")} className="md:hidden overflow-hidden rounded-xl border border-border bg-surface">
              <div role="row" className="grid divide-x divide-border border-b border-border" style={{ gridTemplateColumns: `repeat(${pair.length}, minmax(0, 1fr))` }}>
                {pair.map((iem, index) => <ColumnHeader key={iem.slug} iem={iem} index={index} mobile />)}
              </div>
              {rows.map((row, rowIndex) => (
                <motion.div key={row.label} role="row" initial={reduceMotion ? false : { opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.25, delay: reduceMotion ? 0 : rowIndex * 0.04 }} className="border-t border-border px-2 py-3">
                  <div role="rowheader" className="mb-2 text-center text-[10px] uppercase text-tertiary">{row.label}</div>
                  <div className="grid divide-x divide-border text-center text-xs leading-snug sm:text-sm" style={{ gridTemplateColumns: `repeat(${pair.length}, minmax(0, 1fr))` }}>
                    {row.values.map((value, index) => <div key={index} role="cell" className="min-w-0 break-words px-1.5">{value}</div>)}
                  </div>
                </motion.div>
              ))}
              <div role="row" className="border-t border-border px-2 py-3">
                <div role="rowheader" className="mb-2 text-center text-[10px] uppercase text-tertiary">{t("product.sections.ratings")}</div>
                {ratingKeys.map((key) => (
                  <div key={key} className="grid divide-x divide-border py-1 text-center" style={{ gridTemplateColumns: `repeat(${pair.length}, minmax(0, 1fr))` }}>
                    {pair.map((iem, index) => (
                      <span key={iem.slug} role="cell" className="min-w-0 px-1.5 font-mono text-lg text-primary">
                        <span className="mr-1 text-[10px] uppercase text-tertiary">{t(`rating.${key}`)}</span>
                        {ratingValue(iem, key) !== undefined ? `${formatRating(ratingValue(iem, key)!)} /10` : "-"}<Winner active={numericWinner(key) === index} />
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <motion.div role="table" aria-label={t("compare.title")} initial={reduceMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: revealEase }} className="hidden md:block">
              <div role="row" className="grid gap-4" style={{ gridTemplateColumns: `repeat(${pair.length}, minmax(0, 1fr))` }}>
                {pair.map((iem, index) => <ColumnHeader key={iem.slug} iem={iem} index={index} mobile={false} />)}
              </div>
              <div role="rowgroup" className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
                {rows.map((row, rowIndex) => (
                  <motion.div key={row.label} role="row" initial={reduceMotion ? false : { opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.25, delay: reduceMotion ? 0 : rowIndex * 0.04 }} className="border-t border-border first:border-t-0 px-4 py-4">
                    <div role="rowheader" className="mb-2 text-xs uppercase text-tertiary">{row.label}</div>
                    <div className="grid divide-x divide-border text-sm leading-snug text-primary" style={{ gridTemplateColumns: `repeat(${pair.length}, minmax(0, 1fr))` }}>
                      {row.values.map((value, index) => <div key={index} role="cell" className="min-w-0 break-words px-4 first:pl-0">{value}</div>)}
                    </div>
                  </motion.div>
                ))}
                <motion.div role="row" className="border-t border-border px-4 py-4">
                  <div role="rowheader" className="mb-3 text-xs uppercase text-tertiary">{t("product.sections.ratings")}</div>
                  <div className="grid divide-x divide-border" style={{ gridTemplateColumns: `repeat(${pair.length}, minmax(0, 1fr))` }}>
                    {pair.map((iem, index) => (
                      <div key={iem.slug} role="cell" className="grid grid-cols-4 px-4 first:pl-0 text-center font-mono text-sm text-primary">
                        {ratingKeys.map((key) => (
                          <div key={key} className="min-w-0">
                            <span className="block text-[10px] uppercase text-tertiary">{t(`rating.${key}`)}</span>
                            <span>{ratingValue(iem, key) !== undefined ? `${formatRating(ratingValue(iem, key)!)} /10` : "-"}<Winner active={numericWinner(key) === index} /></span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </>
        ) : (
          <div className="relative rounded-xl border border-border bg-surface">
            <AnimatePresence>
              {overflow.left && (
                <button type="button" aria-label={t("compare.previous")} onClick={() => scrollOneColumn(-1)} className="absolute left-1 top-1/2 z-30 inline-flex size-11 -translate-y-1/2 items-center justify-center text-primary">
                  <ChevronLeft aria-hidden="true" className="size-6" />
                </button>
              )}
              {overflow.right && (
                <button type="button" aria-label={t("compare.next")} onClick={() => scrollOneColumn(1)} className="absolute right-1 top-1/2 z-30 inline-flex size-11 -translate-y-1/2 items-center justify-center text-primary">
                  <ChevronRight aria-hidden="true" className="size-6" />
                </button>
              )}
            </AnimatePresence>
            <div
              ref={scrollerRef}
              role="table"
              aria-label={t("compare.title")}
              data-lenis-prevent
              className="[container-type:inline-size] [--compare-column-width:44vw] md:[--compare-column-width:calc((100cqw_-_32px)/3)] overflow-x-auto overscroll-x-contain scroll-snap-type-x-proximity touch-action-pan-x-pan-y cursor-grab rounded-xl"
              style={{
                touchAction: "pan-x pan-y",
                WebkitMaskImage: "linear-gradient(to right, transparent, black 12px, black calc(100% - 12px), transparent)",
                maskImage: "linear-gradient(to right, transparent, black 12px, black calc(100% - 12px), transparent)",
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onClickCapture={blockClickAfterDrag}
            >
              <div role="rowgroup" className="min-w-max">
                <div role="row" className="grid" style={{ gridTemplateColumns: `repeat(${pair.length}, var(--compare-column-width))` }}>
                  <AnimatePresence initial={false}>
                    {pair.map((iem, index) => (
                      <motion.div
                        key={iem.slug}
                        layout
                        initial={reduceMotion ? false : { opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.28, ease: revealEase }}
                        data-compare-column
                        role="columnheader"
                        className="relative min-h-[330px] border-l border-border bg-surface px-4 pb-5 pt-0 text-center first:border-l-0 scroll-snap-align-start"
                      >
                        <div className="mb-5 h-1 rounded-b-full" style={{ background: compareColor(index) }} />
                        <button type="button" aria-label={`${t("compare.remove")}: ${iem.name}`} onClick={() => onRemove(iem.slug)} className="absolute right-0 top-0 z-20 inline-flex size-11 items-center justify-center text-primary hover:text-brand-text">
                          <X aria-hidden="true" className="size-5" />
                        </button>
                        {iem.images.hero && (
                          <div className="relative mx-auto mb-4 h-[220px] max-w-[280px]">
                            <span aria-hidden="true" className="absolute left-1/2 top-1/2 size-[78%] -translate-x-1/2 -translate-y-1/2 rounded-[44%_56%_52%_48%/55%_45%_55%_45%]" style={{ background: "var(--brand)", opacity: 0.12 }} />
                            <Image src={iem.images.hero} alt="" width={420} height={420} draggable={false} className="relative size-full object-contain drop-shadow-[0_16px_18px_color-mix(in_srgb,var(--brand-outline)_45%,transparent)]" />
                          </div>
                        )}
                        <p className="text-xs text-tertiary">{iem.brand}</p>
                        <h2 className="mt-1 line-clamp-2 text-xl uppercase text-primary" style={{ fontFamily: "var(--font-anton), var(--font-geist-sans), sans-serif", fontWeight: 400 }}>{iem.name}</h2>
                        <p className="mt-2 font-mono text-sm text-brand-text">{typeof iem.priceUSD === "number" ? formatPrice(iem.priceUSD) : "-"}<Winner active={numericWinner("price") === index} /></p>
                        <p className="mt-2 text-xs text-secondary">{textValue(iem.driverType)}</p>
                        <a href={`/iem/${iem.slug}`} className="group mt-3 inline-flex min-h-11 items-center gap-2 text-sm text-brand-text hover:text-primary focus-visible:outline-offset-4">{t("compare.fullPage")} <ArrowRight aria-hidden="true" className="size-[18px] transition-transform duration-200 group-hover:translate-x-[3px]" strokeWidth={2} /></a>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                {rows.map((row, rowIndex) => (
                  <motion.div key={row.label} role="row" initial={reduceMotion ? false : { opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.25, delay: reduceMotion ? 0 : rowIndex * 0.04 }} className="border-t border-border">
                    <div role="rowheader" className="sticky left-0 z-10 h-auto w-[100cqw] bg-surface px-3 py-2 text-center text-[10px] uppercase text-tertiary">{row.label}</div>
                    <div className="grid" style={{ gridTemplateColumns: `repeat(${pair.length}, var(--compare-column-width))` }}>
                      {row.values.map((value, index) => (
                        <motion.div key={`${row.label}-${index}`} role="cell" layout className="min-w-0 border-l border-border px-3 py-4 text-center text-xs leading-snug text-primary first:border-l-0 sm:text-sm">{value}</motion.div>
                      ))}
                    </div>
                  </motion.div>
                ))}
                <div role="row" className="border-t border-border">
                  <div role="rowheader" className="sticky left-0 z-10 w-[100cqw] bg-surface px-3 py-2 text-center text-[10px] uppercase text-tertiary">{t("product.sections.ratings")}</div>
                  <div className="grid" style={{ gridTemplateColumns: `repeat(${pair.length}, var(--compare-column-width))` }}>
                    {pair.map((iem, index) => (
                      <div key={iem.slug} role="cell" className="border-l border-border first:border-l-0 px-2 py-3 text-center">
                        {ratingKeys.map((key) => (
                          <div key={key} className="py-1 font-mono text-sm text-primary">
                            <span className="mr-2 text-[10px] uppercase text-tertiary">{t(`rating.${key}`)}</span>
                            {ratingValue(iem, key) !== undefined ? `${formatRating(ratingValue(iem, key)!)} /10` : "-"}<Winner active={numericWinner(key) === index} />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {overflow.left || overflow.right ? (
              <div className="h-[2px] w-full bg-surface-subtle">
                <div ref={progressBarRef} className="h-full origin-left bg-brand will-change-transform" />
              </div>
            ) : null}
          </div>
        )}
      </div>

      <motion.div initial={reduceMotion ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }} className="relative z-[1] mt-8">
        <FrequencyGraph
          series={series}
          variant="bare"
          height={260}
          compact
          showLegend={false}
          showZones
          animationTrigger
          newSeriesIds={newSeriesIds}
        />
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1" aria-label={t("graphUi.legend")}>
          {pair.map((iem, index) => (
            <div key={iem.slug} className="flex min-h-11 items-center gap-2">
              <span aria-hidden="true" className="w-5 border-t-[3px]" style={{ borderColor: compareColor(index) }} />
              {pair.length >= 3 ? (
                <button type="button" onClick={() => onRemove(iem.slug)} className="inline-flex min-h-11 items-center gap-1 text-xs text-primary hover:text-brand-text">
                  <span>{iem.brand} {iem.name}</span><X aria-hidden="true" className="size-3.5" />
                </button>
              ) : (
                <span className="text-xs" style={{ color: compareColor(index) }}>{iem.brand} {iem.name}</span>
              )}
            </div>
          ))}
          {pair.length < 6 && (
            <button type="button" onClick={() => setPickerOpen(true)} className="inline-flex min-h-11 items-center gap-1 text-sm text-brand-text hover:text-primary">
              <Plus aria-hidden="true" className="size-4" />{t("compare.addIem")}
            </button>
          )}
        </div>
        {differentRigs && <p className="mt-2 text-center text-xs text-secondary">{t("compare.differentRigs")}</p>}
        {credits.length > 0 && <p className="mt-2 text-center text-xs text-tertiary">{credits.join(" · ")}</p>}
      </motion.div>

      <div className="relative z-[1] mt-6 flex items-center justify-center gap-6">
        <button type="button" onClick={onChange} className="min-h-11 text-sm text-brand-text hover:text-primary">{t("compare.changeIems")}</button>
        <button type="button" onClick={onClear} className="min-h-11 text-sm text-secondary hover:text-primary">{t("compare.clear")}</button>
      </div>

      <IEMPickerModal
        open={pickerOpen}
        mode="add"
        slotIndex={-1}
        allIems={allIems}
        brands={brands}
        chosenSlugs={pair.map((iem) => iem.slug)}
        onClose={() => setPickerOpen(false)}
        onSelect={(slug) => {
          onAdd(slug);
          setPickerOpen(false);
        }}
      />
    </section>
  );
}
