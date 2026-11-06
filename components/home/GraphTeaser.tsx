"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { OutlineNumber } from "@/components/home/OutlineNumber";
import { SectionHeading } from "@/components/home/SectionHeading";
import { WaveEdge } from "@/components/home/WaveEdge";
import { FrequencyGraph, type FrequencyGraphSeries } from "@/components/iem/FrequencyGraph";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { FrequencyTarget, IEM } from "@/types/iem";

type GraphTeaserProps = {
  iems: IEM[];
  targets: FrequencyTarget[];
};

function averageRating(iem: IEM): number {
  const values = ["build", "sound", "value"]
    .map((key) => iem.ratings?.[key])
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (values.length === 0) return typeof iem.ratings?.overall === "number" ? iem.ratings.overall : 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function GraphTeaser({ iems, targets }: GraphTeaserProps) {
  const { t } = useLanguage();
  const [highlightRange, setHighlightRange] = useState<[number, number] | undefined>();
  const highestRated = [...iems]
    .filter((iem) => iem.frData && iem.frData.length > 0)
    .sort((left, right) => averageRating(right) - averageRating(left))[0];
  const target = targets.find((item) => /Harman\s+IE\s+2019/i.test(item.name));

  const series: FrequencyGraphSeries[] = [];
  if (highestRated) {
    series.push({
      id: highestRated.slug,
      label: `${highestRated.brand} ${highestRated.name}`,
      color: "var(--graph-1)",
      data: highestRated.frData ?? [],
    });
  }
  if (target) {
    series.push({
      id: target.slug,
      label: target.name,
      color: "var(--on-brand)",
      data: target.data,
      dashed: true,
      isTarget: true,
    });
  }

  const callouts: Array<{ number: string; title: string; range: [number, number]; copy: string; dot: string }> = [
    { number: "01", title: t("home.graphBassTitle"), range: [20, 250], copy: t("home.graphBassCopy"), dot: "var(--on-brand)" },
    { number: "02", title: t("home.graphMidsTitle"), range: [250, 6000], copy: t("home.graphMidsCopy"), dot: "var(--on-brand)" },
    { number: "03", title: t("home.graphTrebleTitle"), range: [6000, 20000], copy: t("home.graphTrebleCopy"), dot: "var(--on-brand)" },
  ];

  const activate = (range: [number, number]) => setHighlightRange(range);
  const clear = () => setHighlightRange(undefined);

  return (
    <section aria-labelledby="frequency-guide-title" className="relative isolate py-12 sm:py-20" style={{ background: "var(--brand)", margin: 0, border: 0, boxShadow: "none" }}>
      <WaveEdge position="top" variant={1} />
      <WaveEdge position="bottom" variant={2} />
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8 2xl:px-12">
        <SectionHeading
          title={t("home.graphTitle")}
          className="max-w-2xl"
          eyebrowClassName="text-on-brand"
          titleClassName="text-on-brand"
          titleStyle={{
            color: "var(--on-brand)",
            textShadow: "4px 4px 0 color-mix(in srgb, var(--on-brand) 25%, transparent)",
          }}
        />

        <div className="mt-10 overflow-x-auto sm:mt-12 md:overflow-visible">
          <div className="min-w-[640px] md:min-w-0">
            <FrequencyGraph series={series} variant="onBrand" showLegend highlightRange={highlightRange} />
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3 md:gap-10">
          {callouts.map((callout) => (
            <button
              type="button"
              key={callout.number}
              aria-pressed={highlightRange?.[0] === callout.range[0]}
              onMouseEnter={() => activate(callout.range)}
              onMouseLeave={clear}
              onFocus={() => activate(callout.range)}
              onBlur={clear}
              onClick={() => highlightRange?.[0] === callout.range[0] ? clear() : activate(callout.range)}
              className="group text-left focus-visible:outline-offset-4"
            >
              <div className="flex items-start gap-4">
                <OutlineNumber
                  value={callout.number}
                  className="text-[clamp(2.75rem,6vw,5rem)]"
                  style={{ WebkitTextStroke: "2px color-mix(in srgb, var(--on-brand) 40%, transparent)" }}
                />
                <div className="pt-2">
                  <p className="flex items-center gap-2 text-sm font-medium text-on-brand">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: callout.dot }} />
                    {callout.title}
                  </p>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-on-brand">{callout.copy}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start gap-5 sm:items-center">
          <p className="text-center text-lg text-on-brand sm:text-xl">{t("home.graphCtaLine")}</p>
          <Link
            href="/learn"
            className="group inline-flex h-[52px] items-center gap-3 rounded-full bg-on-brand px-5 text-sm text-brand transition-[background-color,transform] duration-200 active:scale-96 focus-visible:outline-offset-4"
            style={{ color: "var(--brand)" }}
          >
            {t("home.graphLink")}
            <ArrowRight aria-hidden="true" className="size-[18px] transition-transform duration-200 group-hover:translate-x-[3px]" strokeWidth={2} />
          </Link>
        </div>
      </div>
    </section>
  );
}
