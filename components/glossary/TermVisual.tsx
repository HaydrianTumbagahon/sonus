"use client";

import type { GlossaryTerm } from "@/data/glossary";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { glossaryImages } from "@/data/glossaryImages";
import { useEffect, useState } from "react";

const frequencyZones: Record<string, [number, number]> = {
  "sub-bass": [0, 18],
  "mid-bass": [15, 34],
  midrange: [33, 61],
  "upper-mids": [58, 76],
  treble: [74, 100],
  sibilance: [82, 98],
};

export function TermVisual({ term }: { term: GlossaryTerm }) {
  const { t } = useLanguage();
  const image = glossaryImages[term.slug];
  const [imageState, setImageState] = useState<"loading" | "loaded" | "fallback">(image ? "loading" : "fallback");

  useEffect(() => {
    if (!image || imageState !== "loading") return;
    const timeout = window.setTimeout(() => setImageState("fallback"), 8000);
    return () => window.clearTimeout(timeout);
  }, [image, imageState, term.slug]);

  if (term.visual === "none") return null;

  return (
    <figure className="space-y-2 rounded-md border border-border bg-surface px-4 py-4">
      <figcaption className="text-xs font-medium text-secondary">
        {t(term.visual === "diagram" ? "glossary.diagram" : term.visual === "waveform" ? "glossary.waveform" : "glossary.frequencyRange")}
      </figcaption>
      {term.visual === "frequency-zone" ? (
        <div role="img" aria-label={`${t("glossary.frequencyRange")}: ${t("glossary.lowest")} to ${t("glossary.highest")}`} className="space-y-2 py-2">
          <div className="relative h-3 overflow-hidden rounded-full bg-surface-subtle">
            <div className="absolute inset-y-0 rounded-full bg-accent" style={{ left: `${frequencyZones[term.slug]?.[0] ?? 10}%`, width: `${(frequencyZones[term.slug]?.[1] ?? 35) - (frequencyZones[term.slug]?.[0] ?? 10)}%` }} />
          </div>
          <div className="flex justify-between font-mono text-[10px] text-tertiary">
            <span>20 Hz</span><span>200 Hz</span><span>2 kHz</span><span>20 kHz</span>
          </div>
        </div>
      ) : term.visual === "waveform" ? (
        <svg role="img" aria-label={t("glossary.waveform")} viewBox="0 0 320 72" className="h-16 w-full" preserveAspectRatio="none">
          <path d="M0 36h26l8-5 8 10 8-24 9 38 9-19h24l7-7 8 14 8-27 9 39 9-19h27l8-5 8 10 8-22 8 37 9-20h35l8-5 8 10 8-18 8 32 8-19h37" fill="none" stroke="var(--graph-2)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          <path d="M0 58H320" stroke="var(--border)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        </svg>
      ) : (
        image && imageState !== "fallback" ? (
          <div className="space-y-2">
            <div className="relative aspect-[16/7] max-h-[220px] overflow-hidden rounded-md bg-surface-subtle sm:max-h-[280px]">
              {imageState === "loading" && <div aria-hidden="true" className="absolute inset-0 animate-pulse bg-surface-subtle" />}
              <img
                src={image.url}
                alt={image.alt}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                width={900}
                height={394}
                onLoad={() => setImageState("loaded")}
                onError={() => setImageState("fallback")}
                className={`h-full w-full object-contain transition-opacity duration-200 ${imageState === "loaded" ? "opacity-100" : "opacity-0"}`}
              />
            </div>
            <p className="text-xs text-tertiary">
              Image: {image.credit}{" "}
              <a href={image.sourcePage} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Source</a>
            </p>
          </div>
        ) : (
        <svg role="img" aria-label={t("glossary.diagram")} viewBox="0 0 320 100" className="h-20 w-full" preserveAspectRatio="xMidYMid meet">
          <path d="M70 50h58m64 0h58M150 31v38" fill="none" stroke="var(--border)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          <rect x="22" y="27" width="48" height="46" rx="8" fill="var(--surface-subtle)" stroke="var(--graph-1)" strokeWidth="2" />
          <circle cx="150" cy="50" r="22" fill="var(--accent-muted)" stroke="var(--graph-2)" strokeWidth="2" />
          <rect x="230" y="27" width="68" height="46" rx="8" fill="var(--surface-subtle)" stroke="var(--graph-3)" strokeWidth="2" />
        </svg>
        )
      )}
    </figure>
  );
}