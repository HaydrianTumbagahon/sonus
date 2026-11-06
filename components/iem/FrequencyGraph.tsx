"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { FrequencyPoint } from "@/types/iem";

export type FrequencyGraphSeries = {
  id: string;
  label: string;
  color: string;
  data: FrequencyPoint[];
  strokeWidth?: number;
  dashed?: boolean;
  isTarget?: boolean;
  normalizationId?: string;
  channel?: "left" | "right";
};

type Props = {
  series: FrequencyGraphSeries[];
  height?: number;
  onRemove?: (id: string) => void;
  showLegend?: boolean;
  measuredBy?: string;
  measuredOn?: string;
  showZones?: boolean;
  animationTrigger?: boolean;
  variant?: "default" | "bare" | "onBrand";
  highlightRange?: [number, number];
  compact?: boolean;
  newSeriesIds?: string[];
};

type PlotPoint = { x: number; y: number };
type PreparedSeries = FrequencyGraphSeries & {
  points: FrequencyPoint[];
  path: string;
  stroke: string;
  isLeftChannel: boolean;
};

const minFrequency = 20;
const maxFrequency = 20000;
const normalizationReferenceDb = 60;
const minimumDb = 40;
const maximumDb = 80;
const frequencyTicks = [20, 30, 40, 50, 60, 80, 100, 150, 200, 300, 400, 500, 600, 800, 1000, 1500, 2000, 3000, 4000, 5000, 6000, 8000, 10000, 15000, 20000];
const emphasizedTicks = new Set([100, 1000, 10000]);
const requiredLabels = new Set([20, 100, 1000, 10000, 20000]);
const margins = { top: 54, right: 12, bottom: 42, left: 58 };

const frequencyZones = [
  { start: 20, end: 60, key: "subBass", shortKey: "shortSubBass" },
  { start: 60, end: 250, key: "bass", shortKey: "shortBass" },
  { start: 250, end: 2000, key: "mids", shortKey: "shortMids" },
  { start: 2000, end: 6000, key: "upperMids", shortKey: "shortUpperMids" },
  { start: 6000, end: 20000, key: "treble", shortKey: "shortTreble" },
] as const;

function cleanData(data: FrequencyPoint[]): FrequencyPoint[] {
  const sorted = data
    .filter((point) => Number.isFinite(point.frequency) && point.frequency > 0 && Number.isFinite(point.db))
    .sort((left, right) => left.frequency - right.frequency);
  const unique = new Map<number, number>();
  for (const point of sorted) unique.set(point.frequency, point.db);
  return [...unique].map(([frequency, db]) => ({ frequency, db }));
}

function valueAtFrequency(data: FrequencyPoint[], frequency: number): number | undefined {
  if (data.length === 0) return undefined;
  if (frequency <= data[0].frequency) return data[0].db;
  if (frequency >= data[data.length - 1].frequency) return data[data.length - 1].db;

  let upperIndex = 1;
  while (data[upperIndex].frequency < frequency) upperIndex += 1;
  const lower = data[upperIndex - 1];
  const upper = data[upperIndex];
  const position = (Math.log10(frequency) - Math.log10(lower.frequency)) /
    (Math.log10(upper.frequency) - Math.log10(lower.frequency));
  return lower.db + (upper.db - lower.db) * position;
}

function monotonePath(points: PlotPoint[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  const intervals = points.slice(0, -1).map((point, index) => points[index + 1].x - point.x);
  const slopes = points.slice(0, -1).map((point, index) =>
    (points[index + 1].y - point.y) / intervals[index],
  );
  const tangents = Array(points.length).fill(0) as number[];
  tangents[0] = slopes[0];
  tangents[tangents.length - 1] = slopes[slopes.length - 1];

  for (let index = 1; index < points.length - 1; index += 1) {
    const previousSlope = slopes[index - 1];
    const nextSlope = slopes[index];
    if (previousSlope * nextSlope <= 0) continue;
    const previousInterval = intervals[index - 1];
    const nextInterval = intervals[index];
    const weight1 = 2 * nextInterval + previousInterval;
    const weight2 = nextInterval + 2 * previousInterval;
    tangents[index] = (weight1 + weight2) /
      (weight1 / previousSlope + weight2 / nextSlope);
  }

  for (let index = 0; index < slopes.length; index += 1) {
    const slope = slopes[index];
    if (slope === 0) {
      tangents[index] = 0;
      tangents[index + 1] = 0;
      continue;
    }
    const alpha = tangents[index] / slope;
    const beta = tangents[index + 1] / slope;
    const magnitude = alpha * alpha + beta * beta;
    if (magnitude > 9) {
      const scale = 3 / Math.sqrt(magnitude);
      tangents[index] = scale * alpha * slope;
      tangents[index + 1] = scale * beta * slope;
    }
  }

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const interval = intervals[index];
    path += ` C ${start.x + interval / 3} ${start.y + tangents[index] * interval / 3}`;
    path += ` ${end.x - interval / 3} ${end.y - tangents[index + 1] * interval / 3}`;
    path += ` ${end.x} ${end.y}`;
  }
  return path;
}

function makeYTicks(minimum: number, maximum: number): number[] {
  const ticks: number[] = [];
  const start = Math.ceil(minimum / 5) * 5;
  for (let tick = start; tick <= maximum + 0.001; tick += 5) ticks.push(tick);
  return ticks;
}

function formatFrequency(value: number, t: (key: string) => string, locale: string): string {
  if (value >= 1000) {
    const formatted = new Intl.NumberFormat(locale, { maximumFractionDigits: value % 1000 === 0 ? 0 : 1 }).format(value / 1000);
    return `${formatted} ${t("graph.kilohertz")}`;
  }
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value)} ${t("graph.hertz")}`;
}

function formatTick(value: number, compact: boolean, t: (key: string) => string, locale: string): string {
  if (compact && value === 20) return "20";
  if (compact && value === 20000) return "20k";
  if (value === 20) return `20${t("graph.hertz")}`;
  if (value === 20000) return `20${t("graph.kilohertz")}`;
  if (value >= 1000) {
    const formatted = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value / 1000);
    return `${formatted}k`;
  }
  if (compact) return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);
}

function labelBounds(tick: number, x: number, text: string, compact: boolean): [number, number] {
  const labelWidth = Math.max(12, text.length * (compact ? 5.2 : 6));
  if (tick === 20) return [x, x + labelWidth];
  if (tick === 20000) return [x - labelWidth, x];
  return [x - labelWidth / 2, x + labelWidth / 2];
}

function visibleFrequencyLabels(
  width: number,
  xForFrequency: (frequency: number) => number,
  t: (key: string) => string,
  locale: string,
  compactMode = false,
): Set<number> {
  if (compactMode) {
    return new Set([20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000]);
  }
  const compact = width < 620;
  const visible = new Set(requiredLabels);
  const optional = frequencyTicks.filter((tick) => !requiredLabels.has(tick));
  for (const tick of optional) {
    const currentBounds = labelBounds(tick, xForFrequency(tick), formatTick(tick, compact, t, locale), compact);
    const overlaps = [...visible].some((other) => {
      const otherBounds = labelBounds(other, xForFrequency(other), formatTick(other, compact, t, locale), compact);
      return currentBounds[0] < otherBounds[1] + 4 && currentBounds[1] + 4 > otherBounds[0];
    });
    if (!overlaps) visible.add(tick);
  }
  return visible;
}

function normalizationGroup(series: FrequencyGraphSeries): string {
  return series.normalizationId ?? series.id.replace(/[-_](?:left|right|l|r)$/i, "");
}

function zoneForFrequency(frequency: number, t: (key: string) => string): string {
  const zone = frequencyZones.find((item, index) =>
    frequency >= item.start && (frequency < item.end || index === frequencyZones.length - 1),
  );
  return zone ? t(`frequencyZones.${zone.key}`) : "";
}

function channelIsLeft(series: FrequencyGraphSeries): boolean {
  return series.channel === "left" || /(?:^|[\s(_-])(?:l|left)(?:\))?$/i.test(`${series.id} ${series.label}`);
}

export function FrequencyGraph({
  series,
  height,
  onRemove,
  showLegend = true,
  measuredBy,
  measuredOn,
  showZones = true,
  animationTrigger = true,
  variant = "default",
  highlightRange,
  compact = false,
  newSeriesIds = [],
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [inView, setInView] = useState(false);
  const [hasRevealed, setHasRevealed] = useState(false);
  const [hoverFrequency, setHoverFrequency] = useState<number | null>(null);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => new Set());
  const clipId = useId().replace(/:/g, "");
  const reduceMotion = useReducedMotion();
  const { lang, t } = useLanguage();
  const locale = lang === "jp" ? "ja-JP" : lang === "cn" ? "zh-CN" : "en-US";
  const onBrand = variant === "onBrand";

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const measure = () => setWidth(Math.round(element.getBoundingClientRect().width));
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) setWidth(Math.round(entries[0].contentRect.width));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || inView) return;
    if (reduceMotion) {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setInView(true);
        observer.disconnect();
      }
    }, { threshold: 0.15 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [inView, reduceMotion]);

  const chartWidth = Math.max(width, 1);
  const chartHeight = compact
    ? (width > 0 && width < 768 ? Math.max(260, height ?? 260) : 380)
    : variant === "bare" || variant === "onBrand"
    ? (width > 0 && width < 700 ? (height ?? 320) : (height ?? 420))
    : Math.max(300, height ?? (width > 0 ? width / (width < 640 ? 1.5 : 2.3) : 360));
  const chartMargins = compact
    ? { ...margins, left: width < 420 ? 34 : 40, bottom: 28, right: width < 420 ? 14 : 14 }
    : { ...margins, left: width < 420 ? 44 : margins.left, right: width < 420 ? 14 : margins.right };
  const plotWidth = Math.max(1, chartWidth - chartMargins.left - chartMargins.right);
  const plotHeight = chartHeight - chartMargins.top - chartMargins.bottom;
  const cleaned = useMemo(() => series.map((item) => ({ ...item, points: cleanData(item.data) })), [series]);

  const groupBaselineValues = new Map<string, number[]>();
  for (const item of cleaned) {
    if (item.isTarget) continue;
    const baseline = valueAtFrequency(item.points, 1000);
    if (baseline === undefined) continue;
    const group = normalizationGroup(item);
    groupBaselineValues.set(group, [...(groupBaselineValues.get(group) ?? []), baseline]);
  }
  const groupBaselines = new Map([...groupBaselineValues].map(([group, values]) => [
    group,
    values.reduce((total, value) => total + value, 0) / values.length,
  ]));
  const prepared = cleaned.map((item) => {
    const ownBaseline = valueAtFrequency(item.points, 1000);
    const groupBaseline = item.isTarget ? ownBaseline : groupBaselines.get(normalizationGroup(item));
    const offset = groupBaseline === undefined ? 0 : normalizationReferenceDb - groupBaseline;
    return { ...item, points: item.points.map((point) => ({ ...point, db: point.db + offset })) };
  });

  const visible = prepared.filter((item) => !hiddenIds.has(item.id));
  const allPreparedDb = prepared.flatMap((item) => item.points.map((point) => point.db));
  const yMinimumDb = allPreparedDb.length > 0 ? Math.min(minimumDb, Math.floor(Math.min(...allPreparedDb) / 5) * 5) : minimumDb;
  const yMaximumDb = allPreparedDb.length > 0 ? Math.max(maximumDb, Math.ceil(Math.max(...allPreparedDb) / 5) * 5) : maximumDb;
  const yTicks = makeYTicks(yMinimumDb, yMaximumDb);

  const xForFrequency = (frequency: number) => chartMargins.left +
    ((Math.log10(frequency) - Math.log10(minFrequency)) / (Math.log10(maxFrequency) - Math.log10(minFrequency))) * plotWidth;
  const yForDb = (db: number) => chartMargins.top + ((yMaximumDb - db) / (yMaximumDb - yMinimumDb)) * plotHeight;
  const visibleTicks = visibleFrequencyLabels(chartWidth, xForFrequency, t, locale, compact && chartWidth < 768);
  const plotted = visible.map((item): PreparedSeries => {
    const points = item.points.map((point) => ({ x: xForFrequency(point.frequency), y: yForDb(point.db) }));
    return {
      ...item,
      stroke: onBrand
        ? (item.isTarget ? "var(--on-brand)" : "var(--graph-line-on-brand)")
        : item.isTarget
          ? "var(--graph-6)"
          : channelIsLeft(item)
            ? `color-mix(in srgb, ${item.color} 65%, black)`
            : item.color,
      isLeftChannel: channelIsLeft(item),
      path: monotonePath(points),
    };
  }).sort((left, right) => Number(Boolean(right.isTarget)) - Number(Boolean(left.isTarget)));

  const canReveal = inView && animationTrigger && width > 0;
  useEffect(() => {
    if (canReveal && reduceMotion) setHasRevealed(true);
  }, [canReveal, reduceMotion]);

  const updateHover = (event: React.PointerEvent<SVGRectElement>) => {
    const bounds = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (!bounds || width === 0) return;
    const svgX = ((event.clientX - bounds.left) / bounds.width) * chartWidth;
    const ratio = Math.max(0, Math.min(1, (svgX - chartMargins.left) / plotWidth));
    setHoverFrequency(minFrequency * (maxFrequency / minFrequency) ** ratio);
  };

  const interactionReady = reduceMotion || hasRevealed;
  const hoverValues = hoverFrequency !== null && interactionReady
    ? visible.map((item) => ({ ...item, db: valueAtFrequency(item.points, hoverFrequency) }))
    : [];
  const hoverX = hoverFrequency === null ? 0 : xForFrequency(hoverFrequency);
  const tooltipLeft = Math.max(chartMargins.left, Math.min(chartWidth - 196, hoverX + 12));
  const dataSummary = visible.map((item) => {
    const dbValues = item.points.map((point) => point.db);
    return `${item.label}: ${Math.min(...dbValues).toFixed(1)} to ${Math.max(...dbValues).toFixed(1)} ${t("graph.decibels")}`;
  }).join(". ");

  const handleGraphKeyDown = (event: React.KeyboardEvent<SVGSVGElement>) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const currentFrequency = hoverFrequency ?? 1000;
    const currentIndex = frequencyTicks.reduce((closest, tick, index) =>
      Math.abs(tick - currentFrequency) < Math.abs(frequencyTicks[closest] - currentFrequency) ? index : closest, 0);
    const direction = event.key === "ArrowLeft" || event.key === "ArrowDown" ? -1 : 1;
    const nextIndex = Math.max(0, Math.min(frequencyTicks.length - 1, currentIndex + direction));
    setHoverFrequency(frequencyTicks[nextIndex]);
  };

  const toggleSeries = (id: string) => {
    setHiddenIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderLegend = (className: string) => (
    <ul aria-label={t("graphUi.legend")} className={className}>
      {prepared.map((item) => {
        const hidden = hiddenIds.has(item.id);
        const stroke = onBrand
          ? (item.isTarget ? "var(--on-brand)" : "var(--graph-line-on-brand)")
          : item.isTarget
            ? "var(--graph-6)"
            : channelIsLeft(item)
              ? `color-mix(in srgb, ${item.color} 65%, black)`
              : item.color;
        return (
          <li key={item.id} className="flex min-w-0 items-center gap-1">
            <button type="button" aria-pressed={!hidden} aria-label={`${t(hidden ? "graphUi.showSeries" : "graphUi.hideSeries")} ${item.label}`} onClick={() => toggleSeries(item.id)} className={`inline-flex min-h-11 max-w-full items-center gap-2 rounded-sm px-2 text-left text-xs font-bold transition-opacity ${hidden ? "opacity-45" : ""}`}>
              <span aria-hidden="true" className="w-5 shrink-0 border-t-[3px]" style={{ borderColor: stroke, borderStyle: item.isTarget || item.dashed ? "dashed" : "solid" }} />
              <span className="truncate" style={{ color: stroke }}>{item.label}</span>
            </button>
            {onRemove && <button type="button" aria-label={t("graph.removeSeries").replace("{label}", item.label)} onClick={() => onRemove(item.id)} className="inline-flex size-9 shrink-0 items-center justify-center rounded-sm text-tertiary hover:bg-surface-subtle hover:text-primary"><X aria-hidden="true" className="size-4" /></button>}
          </li>
        );
      })}
    </ul>
  );

  const compactTicks = width < 620;
  const revealActive = canReveal && !hasRevealed && !reduceMotion;

  return (
    <div className="w-full space-y-2">
      {measuredOn && <p className="text-right font-mono text-xs text-tertiary">{t("graphUi.measuredOn").replace("{name}", measuredOn)}</p>}
      <div ref={containerRef} className="relative w-full touch-none" style={{ height: chartHeight }}>
        {width > 0 && (
          <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" role="img" tabIndex={0} aria-label={`${t("graph.ariaLabel")}. ${visible.map((item) => item.label).join(", ")}. ${t("graphUi.keyboardHelp")}`} aria-describedby={`${clipId}-summary`} onKeyDown={handleGraphKeyDown} className="block overflow-visible focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2" shapeRendering="geometricPrecision">
            <defs>
              <clipPath id={clipId}>
                <motion.rect
                  x={chartMargins.left}
                  y={chartMargins.top}
                  height={plotHeight}
                  initial={false}
                  animate={{ width: reduceMotion || hasRevealed || revealActive ? plotWidth : 0 }}
                  transition={reduceMotion || hasRevealed ? { duration: 0 } : { duration: 1.6, ease: "easeOut" }}
                  onAnimationComplete={() => {
                    if (!revealActive) return;
                    setHasRevealed(true);
                  }}
                />
              </clipPath>
            </defs>

            {showZones && frequencyZones.map((zone, index) => {
              const x1 = xForFrequency(zone.start);
              const x2 = xForFrequency(zone.end);
              const widthForZone = x2 - x1;
              const label = t(`frequencyZones.${compactTicks ? zone.shortKey : zone.key}`);
              const canFitLabel = widthForZone >= label.length * (compactTicks ? 5.5 : 7);
              const isHighlighted = highlightRange
                ? zone.end > highlightRange[0] && zone.start < highlightRange[1]
                : false;
              const zoneOpacity = onBrand
                ? highlightRange
                  ? (isHighlighted ? 0.3 : 0)
                  : 0
                : highlightRange ? (isHighlighted ? 0.62 : 0.08) : (index % 2 === 0 ? 0.18 : 0.3);
              return (
                <g key={zone.key}>
                  <rect
                    x={x1}
                    y={chartMargins.top}
                    width={widthForZone}
                    height={plotHeight}
                    fill={onBrand ? "var(--graph-line-on-brand)" : "var(--surface-subtle)"}
                    fillOpacity={zoneOpacity}
                    stroke={onBrand && isHighlighted ? "var(--graph-line-on-brand)" : undefined}
                    strokeWidth={onBrand && isHighlighted ? 2 : undefined}
                    style={{ transition: "fill-opacity 250ms ease, stroke-opacity 250ms ease" }}
                  />
                  {index > 0 && <line x1={x1} x2={x1} y1={chartMargins.top - 3} y2={chartMargins.top + plotHeight} stroke={onBrand ? "color-mix(in srgb, var(--on-brand) 30%, transparent)" : "var(--border)"} strokeDasharray="3 4" strokeOpacity={onBrand ? "0.3" : "0.75"} />}
                  {canFitLabel && <text x={(x1 + x2) / 2} y={chartMargins.top - 22} textAnchor="middle" fontSize={compactTicks ? "9" : "10"} fill={onBrand ? "var(--on-brand)" : "var(--text-tertiary)"} fillOpacity={highlightRange ? (isHighlighted ? 1 : 0.25) : (onBrand ? 1 : 1)} fontWeight={highlightRange && isHighlighted ? 700 : 400} fontFamily="var(--font-family-sans)" style={{ transition: "fill-opacity 250ms ease, font-weight 250ms ease" }}>{label}</text>}
                </g>
              );
            })}

            {yTicks.map((tick) => {
              const y = yForDb(tick);
              const major = tick % 10 === 0;
              return (
                <g key={`y-${tick}`}>
                  <line x1={chartMargins.left} x2={chartWidth - chartMargins.right} y1={y} y2={y} stroke={onBrand ? "color-mix(in srgb, var(--on-brand) 18%, transparent)" : "var(--border)"} strokeOpacity={onBrand ? "1" : major ? "0.76" : "0.45"} strokeWidth={onBrand && major ? "1.1" : "0.7"} shapeRendering="crispEdges" />
                  <text x={chartMargins.left - 7} y={y + 4} textAnchor="end" fontSize="10" fill={onBrand ? "var(--on-brand)" : "var(--text-tertiary)"} fontFamily="var(--font-geist-mono)">{tick}</text>
                </g>
              );
            })}

            {frequencyTicks.map((tick) => {
              const x = xForFrequency(tick);
              return (
                <g key={`x-${tick}`}>
                  <line x1={x} x2={x} y1={chartMargins.top} y2={chartMargins.top + plotHeight} stroke={onBrand ? "color-mix(in srgb, var(--on-brand) 18%, transparent)" : "var(--border)"} strokeOpacity={onBrand ? (emphasizedTicks.has(tick) ? "0.32" : "1") : emphasizedTicks.has(tick) ? "0.8" : "0.38"} strokeWidth={emphasizedTicks.has(tick) ? "1.1" : "0.7"} shapeRendering="crispEdges" />
                  {visibleTicks.has(tick) && <text x={x} y={chartMargins.top + plotHeight + 20} textAnchor={tick === 20 ? "start" : tick === 20000 ? "end" : "middle"} fontSize={compactTicks ? "9" : "10"} fill={onBrand ? "var(--on-brand)" : "var(--text-tertiary)"} fontFamily="var(--font-geist-mono)">{formatTick(tick, compactTicks, t, locale)}</text>}
                </g>
              );
            })}

            <text x="12" y={chartMargins.top + plotHeight / 2} textAnchor="middle" transform={`rotate(-90 12 ${chartMargins.top + plotHeight / 2})`} fontSize="10" fill={onBrand ? "var(--on-brand)" : "var(--text-tertiary)"} fontFamily="var(--font-geist-mono)">dB</text>
            <text x={chartMargins.left + plotWidth / 2} y={chartMargins.top + plotHeight / 2 + 5} textAnchor="middle" fontSize="32" fontWeight="600" letterSpacing="0" fill="var(--text-tertiary)" fillOpacity="0.055" fontFamily="var(--font-family-sans)">Sonus</text>

            <g clipPath={`url(#${clipId})`} fill="none">
              <AnimatePresence initial={false}>
                {plotted.filter((item) => item.path.length > 0).map((item) => {
                  const first = item.points[0];
                  const last = item.points[item.points.length - 1];
                  const isNewSeries = newSeriesIds.includes(item.id);
                  const intersectsHighlight = highlightRange
                    ? item.points.some((point) => point.frequency >= highlightRange[0] && point.frequency <= highlightRange[1])
                    : false;
                  const lineOpacity = onBrand && highlightRange && !intersectsHighlight ? 0.55 : 1;
                  const lineWidth = highlightRange && intersectsHighlight ? 4.5 : (item.strokeWidth ?? (item.isTarget ? (onBrand ? 2 : 1.75) : 3));
                  return (
                    <g key={item.id}>
                      {onBrand && !item.isTarget && (
                        <motion.path
                          d={item.path}
                          stroke="var(--on-brand)"
                          strokeWidth="5"
                          strokeOpacity="0.25"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          vectorEffect="non-scaling-stroke"
                          animate={{ d: item.path, opacity: lineOpacity }}
                          transition={{ duration: reduceMotion ? 0 : 0.25 }}
                        />
                      )}
                      <motion.path
                        d={item.path}
                        stroke={item.stroke}
                        strokeWidth={lineWidth}
                        strokeDasharray={item.isTarget || item.dashed ? "7 6" : undefined}
                        strokeOpacity={onBrand
                          ? (item.isTarget ? 0.6 : !item.isLeftChannel ? 0.65 : lineOpacity)
                          : lineOpacity}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                        initial={reduceMotion || !isNewSeries ? false : { opacity: 0.9, pathLength: 0 }}
                        animate={{
                          d: item.path,
                          pathLength: 1,
                          opacity: onBrand
                            ? (item.isTarget ? 0.6 : !item.isLeftChannel ? 0.65 : lineOpacity)
                            : lineOpacity,
                        }}
                        exit={reduceMotion ? undefined : { opacity: 0 }}
                        transition={reduceMotion ? { duration: 0 } : { pathLength: { duration: 0 }, d: { duration: 0.42, ease: "easeOut" }, opacity: { duration: 0.2 }}}
                      />
                      {revealActive && first && last && (
                        <motion.circle
                          r="3"
                          fill={item.stroke}
                          initial={{ cx: xForFrequency(first.frequency), cy: yForDb(first.db), opacity: 1 }}
                          animate={{ cx: xForFrequency(last.frequency), cy: yForDb(last.db), opacity: 0 }}
                          transition={{ duration: 1.6, ease: "easeOut" }}
                        />
                      )}
                    </g>
                  );
                })}
              </AnimatePresence>
              {hoverFrequency !== null && interactionReady && <line x1={hoverX} x2={hoverX} y1={chartMargins.top} y2={chartMargins.top + plotHeight} stroke={onBrand ? "color-mix(in srgb, var(--on-brand) 60%, transparent)" : "var(--text-tertiary)"} strokeWidth="1" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />}
            </g>

            <rect
              x={chartMargins.left}
              y={chartMargins.top}
              width={plotWidth}
              height={plotHeight}
              fill="transparent"
              pointerEvents={interactionReady ? "all" : "none"}
              aria-hidden="true"
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                updateHover(event);
              }}
              onPointerMove={updateHover}
              onPointerCancel={() => setHoverFrequency(null)}
              onPointerLeave={(event) => {
                if (event.pointerType === "mouse") setHoverFrequency(null);
              }}
            />
          </svg>
        )}

        <AnimatePresence>
          {hoverFrequency !== null && interactionReady && width > 0 && (
            <motion.div role="status" aria-live="polite" initial={reduceMotion ? false : { opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: 3 }} className="pointer-events-none absolute z-10 min-w-44 rounded-md border border-border bg-background/95 p-3 text-xs shadow-md backdrop-blur" style={{ left: tooltipLeft, top: chartMargins.top + 6 }}>
              <p className="mb-2 font-mono font-medium text-primary">{t("graph.frequency")}: {formatFrequency(hoverFrequency, t, locale)}</p>
              <p className="mb-2 text-secondary">{zoneForFrequency(hoverFrequency, t)}</p>
              <ul className="space-y-1.5">
                {hoverValues.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-4 text-secondary">
                    <span className="flex min-w-0 items-center gap-2"><span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: item.isTarget ? "var(--graph-6)" : item.color }} /><span className="truncate">{item.label}</span></span>
                    <span className="shrink-0 font-mono text-primary">{item.db === undefined ? t("graph.empty") : `${item.db.toFixed(2)} ${t("graph.decibels")}`}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        {showLegend && series.length > 0 && <div className="absolute bottom-[48px] left-[64px] hidden max-h-32 max-w-[55%] overflow-y-auto md:block">{renderLegend("flex flex-col items-start gap-0.5")}</div>}
      </div>

      <p className={`text-xs ${onBrand ? "" : "text-tertiary"}`} style={onBrand ? { color: "var(--on-brand)" } : undefined}>{t("graphModes.normalizedCaption")}</p>
      <p id={`${clipId}-summary`} className="sr-only">{t("graph.dataSummary")}: {dataSummary || t("graph.empty")}</p>
      {showLegend && series.length > 0 && <div className="md:hidden">{renderLegend("flex flex-col items-start gap-0.5")}</div>}
      {measuredBy && <p className="text-xs text-tertiary">{t("graphUi.measuredBy").replace("{name}", measuredBy)}</p>}
    </div>
  );
}