"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  GitCompareArrows,
  Headphones,
  ImageOff,
  Star,
} from "lucide-react";
import { useRef, useState } from "react";
import { BrandCarousel } from "@/components/home/BrandCarousel";
import { FrequencyGraph } from "@/components/iem/FrequencyGraph";
import { formatRating } from "@/lib/format";
import { IEMCard } from "@/components/iem/IEMCard";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { Brand, FrequencyPoint, IEM } from "@/types/iem";

function ratingFor(iem: IEM): number | undefined {
  const ratings = iem.ratings;
  if (!ratings) return undefined;
  if (typeof ratings.overall === "number" && Number.isFinite(ratings.overall)) {
    return ratings.overall;
  }

  const values = Object.values(ratings).filter((value) => Number.isFinite(value));
  if (values.length === 0) return undefined;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function makeIllustrativeCurve(): FrequencyPoint[] {
  return Array.from({ length: 180 }, (_, index) => {
    const frequency = 20 * (1000 ** (index / 179));
    const position = Math.log10(frequency / 1000);
    const bass = Math.exp(-(((position + 0.65) / 0.55) ** 2));
    const mids = Math.exp(-(((position - 0.1) / 0.42) ** 2));
    const treble = Math.exp(-(((position - 0.9) / 0.55) ** 2));
    return { frequency, db: -3 + 5.2 * bass - 2.4 * mids + 2.8 * treble };
  });
}

const quickLinks = [
  { href: "/learn", icon: BookOpen, title: "home.basicsTitle", description: "home.basicsDescription" },
  { href: "/showroom", icon: Headphones, title: "home.showroomTitle", description: "home.showroomDescription" },
  { href: "/compare", icon: GitCompareArrows, title: "home.compareTitle", description: "home.compareDescription" },
] as const;

export function HomeClient({ brands, iems }: { brands: Brand[]; iems: IEM[] }) {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const reduceMotion = useReducedMotion();
  const picksRef = useRef<HTMLUListElement>(null);
  const [showGraphZones, setShowGraphZones] = useState(true);
  const rankedIems = iems
    .map((iem) => ({ iem, rating: ratingFor(iem) }))
    .filter((entry): entry is { iem: IEM; rating: number } => entry.rating !== undefined)
    .sort((left, right) => right.rating - left.rating || left.iem.name.localeCompare(right.iem.name));
  const featured = rankedIems[0];
  const picks = rankedIems.slice(0, 8).map((entry) => entry.iem);
  const graphIem = iems.find((iem) => iem.frData && iem.frData.length > 0);
  const graphSeries = graphIem?.frData
    ? [{ id: graphIem.slug, label: `${graphIem.brand} ${graphIem.name}`, color: "var(--graph-1)", data: graphIem.frData }]
    : [{ id: "illustrative", label: t("home.graphSample"), color: "var(--graph-1)", data: makeIllustrativeCurve() }];

  const scrollPicks = (direction: -1 | 1) => {
    const list = picksRef.current;
    if (!list) return;
    list.scrollBy({
      left: list.clientWidth * 0.8 * direction,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  const title = t("home.heroTitle");
  const titleVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.028 } },
  };
  const characterVariants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 22 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduceMotion ? 0 : 0.42, ease: "easeOut" as const },
    },
  };

  return (
    <div>
      <section className="relative isolate overflow-hidden border-b border-border">
        <svg aria-hidden="true" className="pointer-events-none absolute -right-36 top-8 h-[22rem] w-[min(74vw,64rem)] opacity-40 sm:top-16" viewBox="0 0 800 360" fill="none">
          <motion.path
            d="M0 248 C72 248 80 235 116 236 C153 237 157 275 198 272 C235 270 243 145 294 145 C344 145 345 208 391 209 C438 210 452 97 501 98 C553 99 553 190 601 190 C652 190 664 115 710 117 C751 118 759 165 800 164"
            stroke="var(--graph-1)"
            strokeWidth="2"
            strokeLinecap="round"
            initial={reduceMotion ? false : { pathLength: 0, opacity: 0.2 }}
            animate={{ pathLength: 1, opacity: 0.65 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 3.2, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
          />
        </svg>

        <div className="relative mx-auto grid max-w-[1600px] items-center gap-12 px-4 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-28 2xl:px-12">
          <div className="max-w-3xl">
            <motion.h1
              aria-label={title}
              variants={titleVariants}
              initial={reduceMotion ? false : "hidden"}
              animate="visible"
              className="text-balance font-sans text-5xl font-semibold leading-[0.98] text-primary sm:text-7xl xl:text-8xl"
            >
              {Array.from(title).map((character, index) => character === " " ? (
                <span key={index} aria-hidden="true" className="inline-block">&nbsp;</span>
              ) : (
                <motion.span key={index} aria-hidden="true" variants={characterVariants} className="inline-block">
                  {character}
                </motion.span>
              ))}
            </motion.h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-secondary sm:text-lg sm:leading-8">
              {t("home.heroDescription")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/showroom" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-sm bg-accent px-5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover">
                {t("home.browseCta")}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Link href="/learn" className="inline-flex min-h-12 items-center justify-center rounded-sm border border-border bg-background/80 px-5 text-sm font-semibold text-primary transition-colors hover:bg-surface">
                {t("home.learnCta")}
              </Link>
            </div>
          </div>

          <motion.article
            animate={reduceMotion ? undefined : { y: [0, -6, 0] }}
            transition={reduceMotion ? undefined : { duration: 6, ease: "easeInOut", repeat: Infinity }}
            className="mx-auto w-full max-w-[34rem] rounded-sm border border-border bg-surface p-3 shadow-md sm:p-4"
          >
            {featured ? (
              <Link href={`/iem/${encodeURIComponent(featured.iem.slug)}`} className="group block rounded-sm focus-visible:outline-offset-4">
                <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-surface-subtle">
                  {featured.iem.images.hero ? (
                    <Image
                      src={featured.iem.images.hero}
                      alt={`${featured.iem.brand} ${featured.iem.name}`}
                      fill
                      sizes="(min-width: 1024px) 40vw, 100vw"
                      className="object-contain p-6 transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex size-full flex-col items-center justify-center gap-3 text-tertiary">
                      <ImageOff aria-hidden="true" className="size-8" />
                      <span className="text-sm">{t("product.noImage")}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-end justify-between gap-4 px-2 pb-2 pt-5">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase text-secondary">{t("home.featuredLabel")} · {featured.iem.brand}</p>
                    <h2 className="mt-1 truncate text-xl font-semibold text-primary">{featured.iem.name}</h2>
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-secondary">
                      <Star aria-hidden="true" className="size-4 fill-current text-accent" />
                      {formatRating(featured.rating)}
                    </p>
                  </div>
                  {typeof featured.iem.priceUSD === "number" && (
                    <p className="font-mono text-sm font-medium text-primary">{formatPrice(featured.iem.priceUSD)}</p>
                  )}
                </div>
              </Link>
            ) : (
              <div className="flex min-h-[22rem] flex-col items-center justify-center rounded-sm bg-surface-subtle px-6 py-10 text-center">
                <Headphones aria-hidden="true" className="size-8 text-accent" />
                <p className="mt-5 text-xs font-semibold uppercase text-secondary">{t("home.featuredLabel")}</p>
                <h2 className="mt-2 text-xl font-semibold text-primary">{t("home.featuredEmptyTitle")}</h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-secondary">{t("home.featuredEmptyDescription")}</p>
              </div>
            )}
          </motion.article>
        </div>
      </section>

      <section aria-labelledby="quick-start-title" className="mx-auto max-w-[1600px] px-4 py-16 sm:px-8 sm:py-20 2xl:px-12">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase text-accent">{t("home.quickStartEyebrow")}</p>
          <h2 id="quick-start-title" className="mt-3 text-3xl font-semibold text-primary sm:text-4xl">{t("home.quickStartTitle")}</h2>
          <p className="mt-3 text-base leading-7 text-secondary">{t("home.quickStartDescription")}</p>
        </div>
        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {quickLinks.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div key={item.href} whileHover={reduceMotion ? undefined : { y: -3 }} transition={{ duration: reduceMotion ? 0 : 0.18 }}>
                <Link href={item.href} className="group flex h-full min-h-40 items-start gap-4 rounded-sm border border-border bg-surface p-5 transition-colors hover:border-accent/50 hover:bg-surface-subtle focus-visible:outline-offset-4 sm:p-6">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-sm bg-accent-muted text-accent">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-lg font-semibold text-primary">{t(item.title)}</span>
                    <span className="mt-2 block text-sm leading-6 text-secondary">{t(item.description)}</span>
                    <ArrowRight aria-hidden="true" className="mt-4 size-4 text-accent transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="editors-picks-title" className="border-y border-border bg-surface/60">
        <div className="mx-auto max-w-[1600px] px-4 py-16 sm:px-8 sm:py-20 2xl:px-12">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 id="editors-picks-title" className="text-3xl font-semibold text-primary sm:text-4xl">{t("home.picksTitle")}</h2>
              <p className="mt-3 text-sm leading-6 text-secondary sm:text-base">{t("home.picksDescription")}</p>
            </div>
            {picks.length > 0 && (
              <div className="hidden shrink-0 gap-2 md:flex">
                <button type="button" aria-label={t("home.previousPicks")} onClick={() => scrollPicks(-1)} className="inline-flex size-11 items-center justify-center rounded-sm border border-border bg-background text-primary transition-colors hover:bg-surface-subtle">
                  <ArrowLeft aria-hidden="true" className="size-5" />
                </button>
                <button type="button" aria-label={t("home.nextPicks")} onClick={() => scrollPicks(1)} className="inline-flex size-11 items-center justify-center rounded-sm border border-border bg-background text-primary transition-colors hover:bg-surface-subtle">
                  <ArrowRight aria-hidden="true" className="size-5" />
                </button>
              </div>
            )}
          </div>
          {picks.length > 0 ? (
            <ul ref={picksRef} aria-label={t("home.picksTitle")} className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-1 pb-4">
              {picks.map((iem) => (
                <li key={iem.slug} className="w-[min(78vw,17rem)] shrink-0 snap-start sm:w-[min(42vw,18rem)] lg:w-[calc(25%_-_0.75rem)]">
                  <IEMCard iem={iem} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex min-h-36 items-center justify-between gap-5 rounded-sm border border-dashed border-border px-5 py-6 sm:px-7">
              <p className="max-w-xl text-sm leading-6 text-secondary">{t("home.picksEmpty")}</p>
              <Link href="/showroom" className="inline-flex min-h-11 shrink-0 items-center gap-2 text-sm font-semibold text-accent hover:text-primary">
                {t("home.browseCta")}<ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      <section aria-labelledby="showroom-brands-title" className="py-14 sm:py-16">
        <h2 id="showroom-brands-title" className="mx-auto mb-3 max-w-[1600px] px-4 text-sm font-semibold text-primary sm:px-8 2xl:px-12">
          {t("showroom.brands")}
        </h2>
        <BrandCarousel brands={brands} />
      </section>

      <section aria-labelledby="frequency-guide-title" className="mx-auto max-w-[1600px] px-4 py-12 sm:px-8 sm:py-20 2xl:px-12">
        <div className="grid items-start gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div className="max-w-lg">
            <p className="text-xs font-semibold uppercase text-accent">{t("home.graphEyebrow")}</p>
            <h2 id="frequency-guide-title" className="mt-3 text-3xl font-semibold text-primary sm:text-4xl">{t("home.graphTitle")}</h2>
            <p className="mt-4 text-base leading-7 text-secondary">{t("home.graphDescription")}</p>
            {!graphIem && <p className="mt-3 text-xs leading-5 text-tertiary">{t("home.graphSampleNote")}</p>}
            <Link href="/learn" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-accent hover:text-primary">
              {t("home.graphLink")}<ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
          <div className="min-w-0 rounded-sm border border-border bg-surface p-3 sm:p-5">
            <div className="mb-3 flex flex-wrap justify-end gap-2">
              <button type="button" role="switch" aria-checked={showGraphZones} aria-label={t("graphModes.zones")} onClick={() => setShowGraphZones((value) => !value)} className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-border px-3 text-xs text-primary hover:bg-surface-subtle">
                <span className={`size-3 rounded-full ${showGraphZones ? "bg-accent" : "bg-border"}`} />{t("graphModes.zones")}
              </button>
            </div>
            <FrequencyGraph series={graphSeries} showZones={showGraphZones} showLegend />
          </div>
        </div>
      </section>

      <section className="bg-primary text-background">
        <div className="mx-auto flex max-w-[1600px] flex-col items-start justify-between gap-8 px-4 py-14 sm:px-8 sm:py-16 md:flex-row md:items-center 2xl:px-12">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold sm:text-4xl">{t("home.finalTitle")}</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-background/75 sm:text-base">{t("home.finalDescription")}</p>
          </div>
          <Link href="/showroom" className="inline-flex min-h-12 shrink-0 items-center gap-3 rounded-sm bg-background px-5 text-sm font-semibold text-primary transition-colors hover:bg-surface-subtle">
            {t("home.finalCta")}<ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}