"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState, type TouchEvent } from "react";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { IEM } from "@/types/iem";

const slideInterval = 5000;

function shuffle<T>(values: T[]): T[] {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function pickSlides(iems: IEM[]): IEM[] {
  const pngIems = shuffle(iems.filter((iem) => iem.images.hero?.toLowerCase().endsWith(".png")));
  const otherIems = shuffle(iems.filter((iem) => !iem.images.hero?.toLowerCase().endsWith(".png")));
  const orderedIems = [...pngIems, ...otherIems];
  const selected: IEM[] = [];
  const brands = new Set<string>();

  for (const iem of orderedIems) {
    if (selected.length >= 5) break;
    if (brands.has(iem.brandSlug)) continue;
    selected.push(iem);
    brands.add(iem.brandSlug);
  }

  for (const iem of orderedIems) {
    if (selected.length >= 5) break;
    if (!selected.some((selectedIem) => selectedIem.slug === iem.slug)) selected.push(iem);
  }

  return selected;
}

export function Hero({ iems }: { iems: IEM[] }) {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const reduceMotion = Boolean(useReducedMotion());
  const sliderRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const suppressImageClick = useRef(false);
  const firstSlideRef = useRef(true);
  const suppressClickTimerRef = useRef<number | null>(null);
  const [slides, setSlides] = useState(() => iems.slice(0, 5));
  const [activeIndex, setActiveIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [inView, setInView] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    const previousSnapType = root.style.scrollSnapType;
    root.style.scrollSnapType = "y proximity";
    return () => { root.style.scrollSnapType = previousSnapType; };
  }, []);

  useEffect(() => () => {
    if (suppressClickTimerRef.current !== null) window.clearTimeout(suppressClickTimerRef.current);
  }, []);

  useEffect(() => {
    setSlides(pickSlides(iems));
    setActiveIndex(0);
  }, [iems]);

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => setInView(Boolean(entry?.isIntersecting)), { threshold: 0.15 });
    observer.observe(slider);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const updateVisibility = () => setTabVisible(!document.hidden);
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(() => {
    if (reduceMotion || hovered || focused || !inView || !tabVisible || slides.length < 2) return;
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % slides.length);
    }, slideInterval);
    return () => window.clearInterval(timer);
  }, [focused, hovered, inView, reduceMotion, slides.length, tabVisible]);

  const activeIem = slides[activeIndex];
  const slideCount = slides.length;
  const slideLabel = (index: number) => t("home.heroSlideLabel")
    .replace("{n}", String(index + 1))
    .replace("{total}", String(slideCount));

  const changeSlide = (direction: -1 | 1) => {
    if (slideCount < 2) return;
    setActiveIndex((index) => (index + direction + slideCount) % slideCount);
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (event.target instanceof Element && event.target.closest("button")) {
      touchStartX.current = null;
      return;
    }
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const delta = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 48) return;
    suppressImageClick.current = true;
    if (suppressClickTimerRef.current !== null) window.clearTimeout(suppressClickTimerRef.current);
    changeSlide(delta < 0 ? 1 : -1);
    suppressClickTimerRef.current = window.setTimeout(() => {
      suppressImageClick.current = false;
      suppressClickTimerRef.current = null;
    }, 350);
  };

  const handleImageClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!suppressImageClick.current || !(event.target instanceof Element) || !event.target.closest("[data-hero-image-link]")) return;
    event.preventDefault();
    event.stopPropagation();
    suppressImageClick.current = false;
    if (suppressClickTimerRef.current !== null) window.clearTimeout(suppressClickTimerRef.current);
    suppressClickTimerRef.current = null;
  };

  return (
    <section className="snap-start relative isolate min-h-[min(100svh,780px)] w-full overflow-hidden bg-[var(--background)] pt-[calc(var(--header-offset)+16px)] text-primary">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_22%_42%,color-mix(in_srgb,var(--surface)_24%,transparent),transparent_64%)]" />

      <motion.div
        aria-hidden="true"
        initial={reduceMotion ? false : { opacity: 0.9, scale: 0.85, x: "12%" }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.9, ease: "easeOut" }}
        className="pointer-events-none absolute -right-[6%] -top-[8%] hidden h-[116%] w-[66%] md:block"
      >
        <motion.svg
          viewBox="0 0 1000 1000"
          preserveAspectRatio="none"
          animate={reduceMotion ? undefined : { x: [0, 9, -5, 0], y: [0, -7, 5, 0], scale: [1, 1.015, 0.99, 1] }}
          transition={reduceMotion ? undefined : { duration: 12, ease: "easeInOut", repeat: Infinity }}
          className="size-full"
        >
          <path d="M420 0 C560 65 360 135 495 245 C640 365 365 410 515 535 C660 655 405 720 530 835 C615 915 540 960 625 1000 H1000 V0 Z" fill="var(--brand)" />
        </motion.svg>
      </motion.div>

      <motion.svg
        aria-hidden="true"
        viewBox="0 0 1000 500"
        preserveAspectRatio="none"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.85, y: "8%" }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.9, ease: "easeOut" }}
        className="pointer-events-none absolute inset-x-[-8%] bottom-[-4%] h-[53%] w-[116%] md:hidden"
      >
        <path d="M0 178 C120 95 235 214 390 163 C540 113 656 182 774 142 C871 109 934 137 1000 92 V500 H0 Z" fill="var(--brand)" />
      </motion.svg>

      <div className="relative z-10 mx-auto grid min-h-[calc(min(100svh,780px)-var(--header-offset))] max-w-[1600px] grid-cols-1 items-center gap-2 px-5 pb-5 pt-8 sm:px-8 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-0 md:px-10 md:pb-10 md:pt-0 2xl:px-12">
        <div className="relative z-10 max-w-3xl text-center md:py-12 md:text-left">
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 18, rotate: -4 }}
            animate={{ opacity: 1, y: 0, rotate: -4 }}
            transition={{ duration: reduceMotion ? 0 : 0.5, delay: reduceMotion ? 0 : 0.08, ease: "easeOut" }}
            className="origin-left font-script text-3xl leading-tight text-primary sm:text-5xl"
          >
            {t("home.heroScriptTop")}
          </motion.p>
          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, x: -42, skewX: -12 }}
            animate={{ opacity: 1, x: 0, skewX: -12 }}
            transition={{ duration: reduceMotion ? 0 : 0.56, delay: reduceMotion ? 0 : 0.18, ease: "easeOut" }}
            className="origin-left text-[clamp(64px,12vw,180px)] font-display uppercase leading-[0.9] tracking-wide text-primary"
            style={{ textShadow: "4px 4px 0 color-mix(in srgb, var(--brand-text) 60%, transparent)" }}
          >
            {t("home.heroWord")}
          </motion.h1>
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.5, delay: reduceMotion ? 0 : 0.38, ease: "easeOut" }}
            className="mt-3 text-center font-script text-2xl leading-tight text-secondary sm:mt-4 sm:text-4xl md:text-left md:ml-0"
          >
            {t("home.heroScriptBottom")}
          </motion.p>
        </div>

        <div
          ref={sliderRef}
          role="region"
          aria-roledescription={t("home.heroCarouselRole")}
          aria-label={t("home.heroCarouselLabel")}
          tabIndex={0}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onFocusCapture={() => setFocused(true)}
          onBlurCapture={(event) => {
            if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) setFocused(false);
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              changeSlide(-1);
            } else if (event.key === "ArrowRight") {
              event.preventDefault();
              changeSlide(1);
            }
          }}
          onClickCapture={handleImageClickCapture}
          className="relative z-10 mx-auto mt-0 flex min-h-[312px] w-full max-w-[660px] touch-pan-y flex-col items-center justify-end focus-visible:outline-offset-4 md:min-h-[590px] md:justify-center"
        >
          <div className="relative flex h-[280px] w-full items-center justify-center sm:h-[390px] md:h-[500px]">
            <motion.div
              aria-hidden="true"
              animate={reduceMotion ? { scale: 1 } : { scale: [1, 1.03, 1] }}
              transition={reduceMotion ? { duration: 0 } : { duration: 12, ease: "easeInOut", repeat: Infinity }}
              className="pointer-events-none absolute left-1/2 top-1/2 z-[1] aspect-square size-[min(78vw,515px)] rounded-full md:size-[580px]"
              style={{ border: "1.5px solid var(--brand-outline)", background: "transparent", x: "-50%", y: "-50%" }}
            />
            <AnimatePresence mode="wait" initial={!reduceMotion}>
              {activeIem && (
                <motion.div
                  key={activeIem.slug}
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 78, rotate: 5, scale: 0.96 }}
                  animate={{ opacity: 1, x: 0, rotate: -8, scale: 1 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -78, rotate: -15, scale: 0.97 }}
                  transition={reduceMotion
                    ? { duration: 0.16, ease: "easeOut" }
                    : { type: "spring", stiffness: 190, damping: 22, mass: 0.9, delay: firstSlideRef.current ? 1.1 : 0 }}
                  onAnimationComplete={() => { firstSlideRef.current = false; }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Link
                    data-hero-image-link
                    href={`/iem/${encodeURIComponent(activeIem.slug)}`}
                    aria-label={t("home.heroImageLabel").replace("{brand}", activeIem.brand).replace("{model}", activeIem.name)}
                    className="relative block h-[260px] w-[min(100%,360px)] focus-visible:outline-offset-4 sm:h-[360px] sm:w-[min(100%,460px)] md:h-[490px] md:w-[520px]"
                  >
                    <motion.div
                      animate={reduceMotion || !inView || !tabVisible ? { y: 0 } : { y: [0, -8, 0] }}
                      transition={reduceMotion || !inView || !tabVisible ? { duration: 0 } : { duration: 5, ease: "easeInOut", repeat: Infinity }}
                      className="absolute inset-0"
                    >
                      <Image
                        src={activeIem.images.hero!}
                        alt=""
                        fill
                        priority={activeIndex === 0}
                        sizes="(min-width: 768px) 520px, (min-width: 640px) 460px, 360px"
                        draggable={false}
                        className="pointer-events-none select-none object-contain"
                        style={{ filter: "drop-shadow(0 24px 32px color-mix(in srgb, var(--background) 55%, transparent))" }}
                      />
                    </motion.div>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {activeIem && (
            <>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`price-${activeIem.slug}`}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: reduceMotion ? 0.12 : 0.2, ease: "easeOut" }}
                  className="pointer-events-none absolute left-0 hidden -translate-y-6 sm:block sm:top-[39%] md:left-[-2%] md:top-[45%] md:-translate-y-10"
                >
                  <p className="font-sans text-xs font-medium text-secondary">{activeIem.brand}</p>
                  {typeof activeIem.priceUSD === "number" && (
                    <p className="mt-1 font-display text-4xl leading-none text-primary md:text-5xl">{formatPrice(activeIem.priceUSD)}</p>
                  )}
                  <svg aria-hidden="true" viewBox="0 0 140 74" className="absolute -right-28 top-5 h-16 w-32 rotate-[8deg]">
                    <path d="M4 8 C42 3 63 17 77 39 C91 60 112 61 128 45 M112 43 L129 44 L125 60" fill="none" stroke="var(--text-primary)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                  </svg>
                </motion.div>
              </AnimatePresence>

              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={`counter-${activeIem.slug}`}
                  aria-hidden="true"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduceMotion ? 0.12 : 0.2 }}
                  className="pointer-events-none absolute right-0 top-[38%] hidden font-display text-7xl leading-none text-transparent sm:block md:right-0 md:top-[40%] md:text-8xl"
                  style={{ WebkitTextStroke: "2px var(--brand-outline)" }}
                >
                  {String(activeIndex + 1).padStart(2, "0")}
                </motion.p>
              </AnimatePresence>
            </>
          )}

          <div className="relative z-10 mt-2 flex min-h-11 items-center justify-center gap-2 md:mt-0 md:absolute md:bottom-4">
            <button type="button" aria-label={t("home.heroPreviousSlide")} onClick={() => changeSlide(-1)} disabled={slideCount < 2} className="inline-flex size-11 items-center justify-center text-primary transition-colors hover:text-brand-text disabled:opacity-40">
              <ChevronLeft aria-hidden="true" className="size-6" />
            </button>
            <div className="flex min-h-11 items-center gap-2 px-1" role="group" aria-label={t("home.heroPagination")}>
              {slides.map((slide, index) => (
                <button
                  key={slide.slug}
                  type="button"
                  aria-current={index === activeIndex ? "true" : undefined}
                  aria-label={slideLabel(index)}
                  onClick={() => setActiveIndex(index)}
                  className={`h-2 rounded-full transition-[width,background-color] duration-200 ${index === activeIndex ? "w-6 bg-brand" : "w-2 bg-text-tertiary/50 hover:bg-text-secondary"}`}
                />
              ))}
            </div>
            <button type="button" aria-label={t("home.heroNextSlide")} onClick={() => changeSlide(1)} disabled={slideCount < 2} className="inline-flex size-11 items-center justify-center text-primary transition-colors hover:text-brand-text disabled:opacity-40">
              <ChevronRight aria-hidden="true" className="size-6" />
            </button>
          </div>
          <p aria-live="polite" className="sr-only">
            {activeIem && t("home.heroImageLabel").replace("{brand}", activeIem.brand).replace("{model}", activeIem.name)}
          </p>
        </div>
      </div>
    </section>
  );
}