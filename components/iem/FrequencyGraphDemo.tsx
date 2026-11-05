"use client";

import { useState } from "react";
import { FrequencyGraph, type FrequencyGraphSeries } from "@/components/iem/FrequencyGraph";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function FrequencyGraphDemo({
  iemSeries,
  targetSeries,
  measuredBy,
  measuredOn,
}: {
  iemSeries: FrequencyGraphSeries[];
  targetSeries: FrequencyGraphSeries[];
  measuredBy?: string;
  measuredOn?: string;
}) {
  const { t } = useLanguage();
  const [showZones, setShowZones] = useState(true);
  const [showTargets, setShowTargets] = useState(true);
  const series = [...iemSeries, ...(showTargets ? targetSeries : [])];

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-semibold text-primary">{t("graph.previewTitle")}</h1>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={showZones}
            aria-label={t("graphModes.zones")}
            onClick={() => setShowZones((value) => !value)}
            className="inline-flex min-h-11 items-center gap-3 rounded-md border border-border bg-surface px-3 text-sm text-primary"
          >
            <span>{t("graphModes.zones")}</span>
            <span className={`relative h-6 w-11 rounded-full transition-colors ${showZones ? "bg-accent" : "bg-border"}`}>
              <span className={`absolute top-1 size-4 rounded-full bg-background transition-transform ${showZones ? "translate-x-6" : "translate-x-1"}`} />
            </span>
          </button>
          <button
            type="button"
            role="switch"
            aria-checked={showTargets}
            aria-label={t("graphUi.targets")}
            onClick={() => setShowTargets((value) => !value)}
            className="inline-flex min-h-11 items-center gap-3 rounded-md border border-border bg-surface px-3 text-sm text-primary"
          >
            <span>{t("graphUi.targets")}</span>
            <span className={`relative h-6 w-11 rounded-full transition-colors ${showTargets ? "bg-accent" : "bg-border"}`}>
              <span className={`absolute top-1 size-4 rounded-full bg-background transition-transform ${showTargets ? "translate-x-6" : "translate-x-1"}`} />
            </span>
            <span className="text-secondary">{t(showTargets ? "graphUi.targetsOn" : "graphUi.targetsOff")}</span>
          </button>
        </div>
      </header>

      {iemSeries.length === 0 && <p className="text-sm text-secondary">{t("graphUi.noIemData")}</p>}

      <FrequencyGraph
        series={series}
        showZones={showZones}
        measuredBy={measuredBy}
        measuredOn={measuredOn}
      />
    </div>
  );
}