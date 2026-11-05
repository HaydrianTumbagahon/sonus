"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { AnimatedRatingNumber } from "@/components/iem/RatingNumbers";
import { compareColor } from "@/components/compare/colors";
import type { IEM } from "@/types/iem";

type Props = {
  items: IEM[];
  onRemove: (slug: string) => void;
};

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function getBuildValue(iem: IEM, key: string): string {
  const build = asRecord(iem.build) ?? asRecord(iem.buildDetails);
  const materials = asRecord(iem.materials);
  const value = build?.[key] ?? materials?.[key] ?? iem[`${key}Material`] ?? iem[key];
  if (typeof value === "string" || typeof value === "number") return String(value);
  return "";
}

export function CompareTable({ items, onRemove }: Props) {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const reduceMotion = useReducedMotion();
  const prices = items.map((item) => item.priceUSD).filter((price): price is number => typeof price === "number" && Number.isFinite(price));
  const lowestPrice = prices.length > 0 ? Math.min(...prices) : undefined;
  const ratingKeys = ["build", "value", "sound"] as const;
  const bestRatings = Object.fromEntries(ratingKeys.map((key) => {
    const values = items.map((item) => item.ratings?.[key])
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value))
      .map((value) => Math.max(0, Math.min(10, value)));
    return [key, values.length > 0 ? Math.max(...values) : undefined];
  })) as Record<(typeof ratingKeys)[number], number | undefined>;
  const overallRatings = items.map((item) => {
    const values = ratingKeys.map((key) => item.ratings?.[key]);
    return values.every((value): value is number => typeof value === "number" && Number.isFinite(value))
      ? values.reduce((sum, value) => sum + value, 0) / ratingKeys.length
      : undefined;
  });
  const bestOverall = Math.max(...overallRatings.filter((value): value is number => value !== undefined));

  const details: { key: string; label: string; getValue: (item: IEM) => string }[] = [
    { key: "driverType", label: t("spec.driverType"), getValue: (item) => item.driverType ?? t("common.notAvailable") },
    { key: "driverConfiguration", label: t("spec.driverConfiguration"), getValue: (item) => item.driverConfiguration ?? t("common.notAvailable") },
    { key: "price", label: t("spec.price"), getValue: (item) => typeof item.priceUSD === "number" ? formatPrice(item.priceUSD) : t("common.notAvailable") },
    { key: "impedance", label: t("spec.impedance"), getValue: (item) => String(item.impedance ?? t("common.notAvailable")) },
    { key: "sensitivity", label: t("spec.sensitivity"), getValue: (item) => String(item.sensitivity ?? t("common.notAvailable")) },
    { key: "frequencyResponse", label: t("spec.frequencyResponse"), getValue: (item) => item.frequencyResponse ?? t("common.notAvailable") },
    { key: "shell", label: t("spec.shell"), getValue: (item) => getBuildValue(item, "shell") || t("common.notAvailable") },
    { key: "faceplate", label: t("spec.faceplate"), getValue: (item) => getBuildValue(item, "faceplate") || t("common.notAvailable") },
    { key: "nozzle", label: t("spec.nozzle"), getValue: (item) => getBuildValue(item, "nozzle") || t("common.notAvailable") },
    { key: "cable", label: t("spec.cable"), getValue: (item) => getBuildValue(item, "cable") || t("common.notAvailable") },
    { key: "connector", label: t("spec.connector"), getValue: (item) => getBuildValue(item, "connector") || item.connector || t("common.notAvailable") },
  ];

  return (
    <div className="overflow-x-auto overscroll-x-contain rounded-md border border-border snap-x snap-mandatory">
      <motion.table layout aria-label={t("compare.title")} className="w-full min-w-[760px] border-collapse text-sm">
        <caption className="sr-only">{t("compare.title")}</caption>
        <thead className="sticky top-0 z-20 bg-background">
          <tr>
            <th scope="col" className="sticky left-0 z-30 w-44 min-w-44 border-b border-border bg-background p-3 text-left" />
            <AnimatePresence initial={false}>
              {items.map((item, index) => (
                <motion.th
                  layout
                  key={item.slug}
                  scope="col"
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                  className="min-w-52 snap-start border-b border-border bg-background p-3 text-left align-top"
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-1 size-3 shrink-0 rounded-full" style={{ backgroundColor: compareColor(index) }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-secondary">{item.brand}</p>
                      <Link href={`/iem/${encodeURIComponent(item.slug)}`} className="mt-1 block text-sm font-semibold text-primary hover:text-accent">
                        {item.name}
                      </Link>
                    </div>
                    <button type="button" aria-label={`${t("compare.remove")}: ${item.name}`} onClick={() => onRemove(item.slug)} className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-tertiary hover:bg-surface-subtle hover:text-primary">
                      <X aria-hidden="true" className="size-4" />
                    </button>
                  </div>
                </motion.th>
              ))}
            </AnimatePresence>
          </tr>
        </thead>
        <tbody>
          {details.map((row) => (
            <tr key={row.key}>
              <th scope="row" className="sticky left-0 z-10 w-44 min-w-44 snap-start border-b border-border bg-background p-3 text-left font-medium text-secondary">
                {row.label}
              </th>
              {items.map((item) => {
                const isBestPrice = row.key === "price" && typeof item.priceUSD === "number" && item.priceUSD === lowestPrice;
                return (
                  <td key={item.slug} className={`min-w-52 snap-start border-b border-border p-3 text-primary ${isBestPrice ? "bg-accent-muted" : "bg-background"}`}>
                    {row.getValue(item)}
                  </td>
                );
              })}
            </tr>
          ))}
          {ratingKeys.map((key, ratingIndex) => (
            <tr key={`rating-${key}`}>
              <th scope="row" className="sticky left-0 z-10 w-44 min-w-44 snap-start border-b border-border bg-background p-3 text-left font-medium text-secondary">
                {t(`rating.${key}`)}
              </th>
              {items.map((item) => {
                const value = item.ratings?.[key];
                const valid = typeof value === "number" && Number.isFinite(value);
                const score = valid ? Math.max(0, Math.min(10, value)) : 0;
                const isBest = valid && score === bestRatings[key];
                return (
                  <td key={item.slug} className={`min-w-52 snap-start border-b border-border p-3 ${isBest ? "bg-accent-muted" : "bg-background"}`}>
                    <AnimatedRatingNumber value={valid ? score : undefined} delay={ratingIndex * 100} valueClassName={`text-xl ${isBest ? "text-accent" : "text-primary"}`} />
                  </td>
                );
              })}
            </tr>
          ))}
          <tr>
            <th scope="row" className="sticky left-0 z-10 w-44 min-w-44 snap-start border-b border-border bg-background p-3 text-left font-medium text-secondary">
              {t("rating.overall")}
            </th>
            {items.map((item, index) => {
              const value = overallRatings[index];
              const isBest = value !== undefined && value === bestOverall;
              return (
                <td key={item.slug} className={`min-w-52 snap-start border-b border-border p-3 ${isBest ? "bg-accent-muted" : "bg-background"}`}>
                  <AnimatedRatingNumber value={value} delay={ratingKeys.length * 100} valueClassName={`text-xl ${isBest ? "text-accent" : "text-primary"}`} />
                </td>
              );
            })}
          </tr>
        </tbody>
      </motion.table>
    </div>
  );
}