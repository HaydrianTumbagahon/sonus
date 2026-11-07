"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { SectionHeading } from "@/components/home/SectionHeading";
import { WaveEdge } from "@/components/home/WaveEdge";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { formatRating } from "@/lib/format";
import { getDailyTopFive, type DailyPick } from "@/lib/daily";
import { revealEase, revealStagger } from "@/lib/motion";
import { usePageReady } from "@/lib/transition";
import type { IEM } from "@/types/iem";

function plainTopRated(iems: IEM[]): DailyPick[] {
  const slots: DailyPick["slot"][] = ["top-overall", "best-sound", "best-build", "best-value", "wildcard"];
  return iems
    .filter((iem) => Boolean(iem.images.hero) && typeof iem.ratings?.overall === "number")
    .sort((left, right) => (right.ratings?.overall ?? 0) - (left.ratings?.overall ?? 0))
    .slice(0, 5)
    .map((iem, index) => ({
      slot: slots[index],
      iem,
      rating: iem.ratings?.overall ?? 0,
    }));
}

function slotLabel(slot: DailyPick["slot"], t: (key: string) => string): string {
  return t(`home.topFiveSlots.${slot}`);
}

function ratingLabel(slot: DailyPick["slot"], t: (key: string) => string): string {
  if (slot === "best-sound") return t("rating.sound");
  if (slot === "best-build") return t("rating.build");
  if (slot === "best-value") return t("rating.value");
  return t("rating.overall");
}

export function TopFive({ iems }: { iems: IEM[] }) {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const reduceMotion = useReducedMotion();
  const pageReady = usePageReady();
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number; startX: number; startScroll: number; moved: boolean; captureTarget: HTMLElement } | null>(null);
  const suppressClickRef = useRef(false);
  const suppressTimerRef = useRef<number | null>(null);
  const initialPicks = useMemo(() => plainTopRated(iems), [iems]);
  const [dailyPicks, setDailyPicks] = useState<DailyPick[] | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const picks = dailyPicks ?? initialPicks;

  useEffect(() => {
    const daily = getDailyTopFive(iems);
    const changed = daily.some((pick, index) => pick.iem.slug !== initialPicks[index]?.iem.slug)
      || daily.length !== initialPicks.length;
    if (changed) setDailyPicks(daily);
  }, [iems, initialPicks]);

  useEffect(() => () => {
    if (suppressTimerRef.current !== null) window.clearTimeout(suppressTimerRef.current);
  }, []);

  const scrollToSlide = (index: number, behavior: ScrollBehavior = reduceMotion ? "auto" : "smooth") => {
    const track = trackRef.current;
    if (!track) return;
    if (window.matchMedia("(min-width: 768px)").matches) {
      setActiveIndex(Math.max(0, Math.min(picks.length - 1, index)));
      return;
    }
    const nextIndex = Math.max(0, Math.min(picks.length - 1, index));
    track.scrollTo({ left: nextIndex * track.clientWidth, behavior });
    setActiveIndex(nextIndex);
  };

  const updateActiveIndex = () => {
    const track = trackRef.current;
    if (!track || track.clientWidth <= 0) return;
    if (window.matchMedia("(min-width: 768px)").matches) return;
    setActiveIndex(Math.max(0, Math.min(picks.length - 1, Math.round(track.scrollLeft / track.clientWidth))));
  };

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (window.matchMedia("(min-width: 768px)").matches) return;
    if (event.pointerType !== "mouse" || event.button !== 0 || dragRef.current) return;
    if (event.target instanceof Element && event.target.closest("[data-top-five-link]")) return;
    const track = event.currentTarget;
    track.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScroll: track.scrollLeft,
      moved: false,
      captureTarget: track,
    };
    setDragging(true);
  };

  const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const delta = event.clientX - drag.startX;
    if (Math.abs(delta) > 6) drag.moved = true;
    event.currentTarget.scrollLeft = drag.startScroll - delta;
  };

  const finishDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setDragging(false);
    if (drag.moved) {
      suppressClickRef.current = true;
      trackRef.current?.querySelectorAll<HTMLAnchorElement>("[data-top-five-link]").forEach((link) => link.setAttribute("data-no-transition", ""));
      if (suppressTimerRef.current !== null) window.clearTimeout(suppressTimerRef.current);
      suppressTimerRef.current = window.setTimeout(() => {
        suppressClickRef.current = false;
        trackRef.current?.querySelectorAll<HTMLAnchorElement>("[data-top-five-link]").forEach((link) => link.removeAttribute("data-no-transition"));
        suppressTimerRef.current = null;
      }, 500);
    }
    if (drag.captureTarget.hasPointerCapture(event.pointerId)) {
      drag.captureTarget.releasePointerCapture(event.pointerId);
    }
    const track = event.currentTarget;
    const nearest = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
    scrollToSlide(nearest);
  };

  const suppressDraggedClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!suppressClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClickRef.current = false;
    event.currentTarget.querySelectorAll<HTMLAnchorElement>("[data-top-five-link]").forEach((link) => link.removeAttribute("data-no-transition"));
    if (suppressTimerRef.current !== null) window.clearTimeout(suppressTimerRef.current);
    suppressTimerRef.current = null;
  };

  return (
    <section data-intro aria-labelledby="top-five-title" className="relative isolate w-full text-on-brand py-14 md:py-[72px]" style={{ background: "var(--brand)", margin: 0, border: 0, boxShadow: "none" }}>
      <WaveEdge position="top" variant={1} />
      <WaveEdge position="bottom" variant={2} />

      <div className="mx-auto max-w-[1600px] px-0 sm:px-8 2xl:px-12">
        <div className="px-4 text-on-brand sm:px-0">
          <SectionHeading
            title={t("home.topFiveTitle")}
            eyebrowClassName="text-on-brand"
            titleClassName="text-on-brand"
            titleStyle={{
              color: "var(--on-brand)",
              textShadow: "4px 4px 0 color-mix(in srgb, var(--on-brand) 25%, transparent)",
            }}
          />
        </div>

        <motion.div
          key={dailyPicks ? "daily" : "plain"}
          initial={dailyPicks && !reduceMotion ? { opacity: 0 } : false}
          animate={{ opacity: pageReady || reduceMotion ? 1 : 0 }}
          transition={{ duration: reduceMotion || !pageReady ? 0 : 0.35 }}
          className="mt-8"
        >
          <div
            ref={trackRef}
            role="region"
            aria-label={t("home.topFiveTitle")}
            tabIndex={0}
            data-lenis-prevent
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
            onClickCapture={suppressDraggedClick}
            onScroll={updateActiveIndex}
            onKeyDown={(event) => {
              if (window.matchMedia("(min-width: 768px)").matches) return;
              if (event.key === "ArrowLeft") {
                event.preventDefault();
                scrollToSlide(activeIndex - 1);
              } else if (event.key === "ArrowRight") {
                event.preventDefault();
                scrollToSlide(activeIndex + 1);
              }
            }}
            className={`flex w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain touch-pan-x touch-pan-y scrollbar-none md:grid md:grid-cols-5 md:overflow-hidden md:overscroll-x-auto md:snap-none md:touch-auto md:cursor-default ${dragging ? "cursor-grabbing md:cursor-default" : "cursor-grab md:cursor-default"}`}
          >
            <AnimatePresence initial={false}>
              {picks.map((pick, index) => {
                const imageSrc = pick.iem.images.hero ?? pick.iem.images.gallery[0];

                return (
                  <motion.article
                  key={pick.iem.slug}
                  aria-label={t("home.topFiveSlideLabel").replace("{n}", String(index + 1)).replace("{total}", String(picks.length))}
                  initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                  whileInView={reduceMotion || pageReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ duration: reduceMotion ? 0 : 0.7, delay: reduceMotion ? 0 : index * revealStagger, ease: revealEase }}
                  className="w-full min-w-full shrink-0 snap-center snap-always px-4 text-center sm:px-8 md:w-auto md:min-w-0 md:px-2 lg:px-3 xl:px-4"
                >
                  <p className="-rotate-3 text-lg text-on-brand [font-family:var(--font-caveat),var(--font-family-sans)] sm:text-2xl">
                    {slotLabel(pick.slot, t)}
                  </p>

                  <Link
                    data-top-five-link
                    href={`/iem/${encodeURIComponent(pick.iem.slug)}`}
                    aria-label={`${pick.iem.brand} ${pick.iem.name}`}
                    className="mx-auto mt-4 flex h-[320px] w-full max-w-[620px] items-center justify-center rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 sm:h-[480px] md:h-[360px] lg:h-[420px] xl:h-[480px]"
                    style={{ outlineColor: "var(--on-brand)" }}
                  >
                    <motion.div
                      className="relative h-[280px] w-full sm:h-[430px] md:h-[330px] lg:h-[390px] xl:h-[430px]"
                      initial={reduceMotion ? false : { rotate: -6 }}
                      animate={{ rotate: reduceMotion ? 0 : -6 }}
                      whileHover={reduceMotion ? undefined : { y: -10, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 260, damping: 18 }}
                    >
                      {imageSrc ? (
                        <Image
                          src={imageSrc}
                          alt={`${pick.iem.brand} ${pick.iem.name}`}
                          fill
                          sizes="(min-width: 1280px) 240px, (min-width: 768px) 180px, 320px"
                          draggable={false}
                          className="pointer-events-none object-contain"
                          style={{ filter: "drop-shadow(0 18px 16px color-mix(in srgb, var(--background) 24%, transparent))" }}
                        />
                      ) : null}
                    </motion.div>
                  </Link>

                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-on-brand">{pick.iem.brand}</p>
                  <h3 className="mt-1 text-2xl uppercase leading-none text-on-brand [transform:skewX(-12deg)] [font-family:var(--font-anton),var(--font-family-sans)] sm:text-4xl md:text-[clamp(1.125rem,1.6vw,2rem)]">
                    {pick.iem.name}
                  </h3>
                  <p className="mt-3 text-sm text-on-brand">
                    {ratingLabel(pick.slot, t)} {formatRating(pick.rating)} /10
                  </p>
                  <p className="mt-1 text-sm text-on-brand">
                    {typeof pick.iem.priceUSD === "number" ? formatPrice(pick.iem.priceUSD) : t("common.priceUnavailable")}
                  </p>
                  <Link
                    data-top-five-link
                    href={`/iem/${encodeURIComponent(pick.iem.slug)}`}
                    className="group mx-auto mt-2 inline-flex min-h-11 items-center gap-2 text-sm text-on-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
                    style={{ outlineColor: "var(--on-brand)" }}
                  >
                    {t("home.topFiveView")}
                    <ArrowRight aria-hidden="true" className="size-[18px] transition-transform duration-200 group-hover:translate-x-[3px]" strokeWidth={2} />
                  </Link>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>

        <div className="mt-4 flex min-h-11 items-center justify-center gap-2 md:hidden" aria-label={t("home.topFivePagination")}>
          {picks.map((pick, index) => (
            <button
              key={pick.iem.slug}
              type="button"
              aria-label={t("home.topFiveSlideLabel").replace("{n}", String(index + 1)).replace("{total}", String(picks.length))}
              aria-current={index === activeIndex ? "true" : undefined}
              onClick={() => scrollToSlide(index)}
              className="flex h-11 items-center justify-center"
            >
              <span
                aria-hidden="true"
                className={`block h-2 rounded-full transition-[width,opacity] duration-200 ${index === activeIndex ? "w-6 opacity-100" : "w-2 opacity-40"}`}
                style={{ background: "var(--on-brand)" }}
              />
            </button>
          ))}
        </div>
      </div>

    </section>
  );
}
