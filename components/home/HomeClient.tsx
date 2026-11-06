"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRef, useState } from "react";
import { BrandCarousel } from "@/components/home/BrandCarousel";
import { Hero } from "@/components/home/Hero";
import { FrequencyGraph } from "@/components/iem/FrequencyGraph";
import { IEMCard } from "@/components/iem/IEMCard";
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

export function HomeClient({ brands, iems, heroIems }: { brands: Brand[]; iems: IEM[]; heroIems: IEM[] }) {
  const { t } = useLanguage();
  const reduceMotion = useReducedMotion();
  const picksRef = useRef<HTMLUListElement>(null);
  const [showGraphZones, setShowGraphZones] = useState(true);
  const rankedIems = iems
    .map((iem) => ({ iem, rating: ratingFor(iem) }))
    .filter((entry): entry is { iem: IEM; rating: number } => entry.rating !== undefined)
    .sort((left, right) => right.rating - left.rating || left.iem.name.localeCompare(right.iem.name));
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

  return (
    <div>
      <Hero iems={heroIems} />

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