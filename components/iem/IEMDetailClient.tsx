"use client";

import Link from "next/link";
import { Cable, Check, Circle, CircleDot, Layers, Minus, Plug, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { RatingSummary } from "@/components/iem/RatingNumbers";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { FrequencyGraph } from "@/components/iem/FrequencyGraph";
import { IEMCard } from "@/components/iem/IEMCard";
import { IEMGallery } from "@/components/iem/IEMGallery";
import { IEMSectionNav } from "@/components/iem/IEMSectionNav";
import { useAppStore } from "@/lib/store";
import type { IEM } from "@/types/iem";

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function asText(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return undefined;
}

function asStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function buildValue(iem: IEM, key: string): string | undefined {
  const build = asRecord(iem.build) ?? asRecord(iem.buildDetails);
  const materials = asRecord(iem.materials);
  return asText(build?.[key]) ?? asText(materials?.[key]) ?? asText(iem[`${key}Material`]) ?? asText(iem[key]);
}

function driverLabel(iem: IEM, t: (key: string) => string): string {
  const type = iem.driverType?.toLowerCase() ?? "";
  if (type.includes("hybrid")) return t("showroom.filters.hybrid");
  if (type.includes("bone") || type === "bc") return t("showroom.filters.boneConduction");
  if (type.includes("planar")) return t("showroom.filters.planar");
  if (type.includes("est") || type.includes("electrostatic")) return t("showroom.filters.est");
  if (type.includes("balanced") || type === "ba") return t("showroom.filters.ba");
  if (type.includes("dynamic") || type === "dd") return t("showroom.filters.dd");
  return iem.driverType ?? t("showroom.filters.unknownDriver");
}

const buildRows = [
  { key: "shell", label: "product.shell", Icon: Circle },
  { key: "faceplate", label: "product.faceplate", Icon: Layers },
  { key: "nozzle", label: "product.nozzle", Icon: CircleDot },
  { key: "cable", label: "product.cable", Icon: Cable },
  { key: "connector", label: "product.connector", Icon: Plug },
] as const;

const specRows = [
  { key: "brand", valueKey: "brand" },
  { key: "model", valueKey: "name" },
  { key: "price", valueKey: "priceUSD" },
  { key: "driver", valueKey: "driverConfiguration" },
  { key: "impedance", valueKey: "impedance" },
  { key: "sensitivity", valueKey: "sensitivity" },
  { key: "frequencyResponse", valueKey: "frequencyResponse" },
  { key: "weight", valueKey: "weight" },
  { key: "connector", valueKey: "connector" },
] as const;

export function IEMDetailClient({ iem, allIems }: { iem: IEM; allIems: IEM[] }) {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const inCompare = useAppStore((state) => state.compareList.includes(iem.slug));
  const compareCount = useAppStore((state) => state.compareList.length);
  const toggleCompare = useAppStore((state) => state.toggleCompare);
  const [showZones, setShowZones] = useState(true);
  const [comparisonSlug, setComparisonSlug] = useState("");

  const relatedIems = useMemo(() => allIems.filter((item) =>
    item.slug !== iem.slug &&
    (item.brandSlug === iem.brandSlug || (iem.driverType && item.driverType === iem.driverType)),
  ).slice(0, 4), [allIems, iem.brandSlug, iem.driverType, iem.slug]);
  const compareItem = allIems.find((item) => item.slug === comparisonSlug && item.frData?.length);
  const graphSeries = [
    ...(iem.frData?.length ? [{ id: iem.slug, label: `${iem.brand} ${iem.name}`, color: "var(--graph-1)", data: iem.frData }] : []),
    ...(compareItem?.frData?.length ? [{ id: compareItem.slug, label: `${compareItem.brand} ${compareItem.name}`, color: "var(--graph-2)", data: compareItem.frData }] : []),
  ];

  const insight = asText(iem.personalInsight) ?? asText(iem.insight) ?? iem.description;
  const inTheBox = asStringList(iem.inTheBox ?? iem.boxContents);
  const pros = asStringList(iem.pros);
  const cons = asStringList(iem.cons);
  const technicalSpecs = specRows.flatMap((row) => {
    const rawValue = row.valueKey === "priceUSD" ? iem.priceUSD : iem[row.valueKey];
    const value = row.valueKey === "priceUSD" && typeof rawValue === "number"
      ? formatPrice(rawValue)
      : asText(rawValue);
    return value ? [{ key: row.key, label: t(`spec.${row.key}`), value }] : [];
  });
  const customSpecs = Object.entries(iem.specs ?? {}).filter(([key]) =>
    !specRows.some((row) => row.key === key || row.valueKey === key),
  ).map(([key, value]) => {
    const translatedLabel = t(`spec.${key}`);
    const label = translatedLabel === `spec.${key}`
      ? key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase())
      : translatedLabel;
    return { key: `custom-${key}`, label, value: String(value) };
  });
  const allSpecs = [...technicalSpecs, ...customSpecs];

  const driverConfiguration = asText(iem.driverConfiguration);
  const price = typeof iem.priceUSD === "number" ? formatPrice(iem.priceUSD) : t("common.priceUnavailable");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_13rem] lg:gap-12">
        <div className="min-w-0 space-y-14">
          <section aria-labelledby="iem-title" className="scroll-mt-24 grid gap-8 md:grid-cols-2 md:items-start">
            <IEMGallery iem={iem} />
            <div className="space-y-5 md:py-4">
              <Link href={`/brand/${encodeURIComponent(iem.brandSlug)}`} className="inline-flex min-h-11 items-center text-sm font-medium text-secondary hover:text-accent">
                {iem.brand}
              </Link>
              <h1 id="iem-title" className="text-3xl font-semibold text-primary sm:text-4xl">{iem.name}</h1>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{driverLabel(iem, t)}</Badge>
                {driverConfiguration && <span className="text-sm text-secondary">{driverConfiguration}</span>}
              </div>
              <p className="font-mono text-2xl font-medium text-primary">{price}</p>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  disabled={!inCompare && compareCount >= 6}
                  aria-pressed={inCompare}
                  onClick={() => toggleCompare(iem.slug)}
                  className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${inCompare ? "bg-surface-subtle text-primary" : "bg-accent text-background hover:bg-accent-hover"}`}
                >
                  {inCompare && <Check aria-hidden="true" className="size-4" />}
                  {t(inCompare ? "product.removeFromCompare" : "product.addToCompare")}
                </button>
                <Link href="/compare" className="inline-flex min-h-12 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-primary hover:bg-surface-subtle">
                  {t("product.viewInCompare")}
                </Link>
              </div>
            </div>
          </section>

          {insight && (
            <section id="insight" aria-labelledby="insight-title" className="scroll-mt-24 border-t border-border pt-10">
              <h2 id="insight-title" className="mb-4 text-xl font-semibold text-primary">{t("product.personalInsight")}</h2>
              <p className="max-w-3xl text-sm leading-7 text-secondary">{insight}</p>
            </section>
          )}

          <section id="build" aria-labelledby="build-title" className="scroll-mt-24 border-t border-border pt-10">
            <h2 id="build-title" className="mb-6 text-xl font-semibold text-primary">{t("product.buildMaterials")}</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {buildRows.map(({ key, label, Icon }) => (
                <li key={key} className="flex min-h-16 items-center gap-4 rounded-md border border-border bg-surface px-4 py-3">
                  <Icon aria-hidden="true" className="size-5 shrink-0 text-secondary" />
                  <span className="min-w-0">
                    <span className="block text-xs text-tertiary">{t(label)}</span>
                    <span className="block break-words text-sm text-primary">{buildValue(iem, key) ?? t("common.notAvailable")}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section id="in-the-box" aria-labelledby="box-title" className="scroll-mt-24 border-t border-border pt-10">
            <h2 id="box-title" className="mb-5 text-xl font-semibold text-primary">{t("product.whatsInTheBox")}</h2>
            {inTheBox.length > 0 ? (
              <ul className="grid gap-2 sm:grid-cols-2">
                {inTheBox.map((item, index) => (
                  <li key={`${item}-${index}`} className="flex min-h-12 items-center gap-3 border-b border-border py-2 text-sm text-secondary">
                    <Check aria-hidden="true" className="size-4 shrink-0 text-accent" />{item}
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-secondary">{t("product.noBoxContents")}</p>}
          </section>

          <section id="specs" aria-labelledby="specs-title" className="scroll-mt-24 border-t border-border pt-10">
            <h2 id="specs-title" className="mb-5 text-xl font-semibold text-primary">{t("product.technicalSpecs")}</h2>
            {allSpecs.length > 0 ? (
              <dl className="divide-y divide-border border-y border-border">
                {allSpecs.map((row) => (
                  <div key={row.key} className="grid gap-1 py-3 sm:grid-cols-[minmax(10rem,0.8fr)_1.2fr] sm:gap-6">
                    <dt className="text-sm text-secondary">{row.label}</dt>
                    <dd className="font-mono text-sm text-primary">{row.value}</dd>
                  </div>
                ))}
              </dl>
            ) : <p className="text-sm text-secondary">{t("product.noSpecs")}</p>}
          </section>

          <section id="graph" aria-labelledby="graph-title" className="scroll-mt-24 border-t border-border pt-10">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <h2 id="graph-title" className="text-xl font-semibold text-primary">{t("product.frequencyResponse")}</h2>
              <div className="flex flex-wrap items-center gap-3">
                {allIems.some((item) => item.slug !== iem.slug && item.frData?.length) && (
                  <label className="flex min-h-11 items-center gap-2 text-sm text-secondary">
                    <span>{t("product.compareWith")}</span>
                    <select
                      aria-label={t("product.compareWith")}
                      value={comparisonSlug}
                      onChange={(event) => setComparisonSlug(event.target.value)}
                      className="min-h-11 max-w-48 rounded-md border border-border bg-background px-3 text-primary"
                    >
                      <option value="">{t("product.selectIem")}</option>
                      {allIems.filter((item) => item.slug !== iem.slug && item.frData?.length).map((item) => (
                        <option key={item.slug} value={item.slug}>{item.brand} {item.name}</option>
                      ))}
                    </select>
                  </label>
                )}
                <button type="button" role="switch" aria-checked={showZones} aria-label={t("graphModes.zones")} onClick={() => setShowZones((value) => !value)} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-3 text-sm text-primary hover:bg-surface-subtle">
                  <span className={`size-3 rounded-full ${showZones ? "bg-accent" : "bg-border"}`} />{t("graphModes.zones")}
                </button>
              </div>
            </div>
            {graphSeries.length > 0 ? (
              <FrequencyGraph series={graphSeries} showZones={showZones} />
            ) : (
              <p className="rounded-md border border-dashed border-border bg-surface px-4 py-8 text-center text-sm text-secondary">
                {t("product.noFrequencyData")}
              </p>
            )}
            {iem.measuredBy && <p className="mt-4 text-xs text-tertiary">{t("product.measuredBy").replace("{name}", iem.measuredBy)}</p>}
          </section>

          <section id="pros-cons" aria-labelledby="pros-cons-title" className="scroll-mt-24 border-t border-border pt-10">
            <h2 id="pros-cons-title" className="mb-5 text-xl font-semibold text-primary">{t("product.prosCons")}</h2>
            {(pros.length > 0 || cons.length > 0) ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-md border border-border bg-surface p-5">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold text-primary"><Plus aria-hidden="true" className="size-4 text-accent" />{t("product.pros")}</h3>
                  <ul className="space-y-3 text-sm text-secondary">
                    {pros.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
                    {pros.length === 0 && <li>{t("product.noProsCons")}</li>}
                  </ul>
                </div>
                <div className="rounded-md border border-border bg-surface p-5">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold text-primary"><Minus aria-hidden="true" className="size-4 text-secondary" />{t("product.cons")}</h3>
                  <ul className="space-y-3 text-sm text-secondary">
                    {cons.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
                    {cons.length === 0 && <li>{t("product.noProsCons")}</li>}
                  </ul>
                </div>
              </div>
            ) : <p className="text-sm text-secondary">{t("product.noProsCons")}</p>}
          </section>

          <section id="ratings" aria-labelledby="ratings-title" className="scroll-mt-24 border-t border-border pt-10">
            <h2 id="ratings-title" className="mb-6 text-xl font-semibold text-primary">{t("rating.title")}</h2>
            <RatingSummary ratings={iem.ratings} />
          </section>

          {relatedIems.length > 0 && (
            <section aria-labelledby="related-title" className="border-t border-border pt-10">
              <h2 id="related-title" className="mb-5 text-xl font-semibold text-primary">{t("product.related")}</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {relatedIems.map((item) => <IEMCard key={item.slug} iem={item} />)}
              </div>
            </section>
          )}
        </div>
        <aside><IEMSectionNav /></aside>
      </div>
    </div>
  );
}