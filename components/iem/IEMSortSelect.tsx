"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import type { SortOption } from "@/components/iem/filter-types";

const options: { value: SortOption; key: string }[] = [
  { value: "default", key: "showroom.filters.sortDefault" },
  { value: "price-up", key: "showroom.filters.sortPriceUp" },
  { value: "price-down", key: "showroom.filters.sortPriceDown" },
  { value: "rating", key: "showroom.filters.sortRating" },
  { value: "newest", key: "showroom.filters.sortNewest" },
];

export function IEMSortSelect({
  value,
  onChange,
  showLabel = false,
  className = "",
}: {
  value: SortOption;
  onChange: (value: SortOption) => void;
  showLabel?: boolean;
  className?: string;
}) {
  const { t } = useLanguage();

  return (
    <label className={`flex items-center gap-2 ${className}`}>
      <span className={showLabel ? "" : "sr-only"}>{t("showroom.filters.sort")}</span>
      <select
        aria-label={t("showroom.filters.sort")}
        value={value}
        onChange={(event) => onChange(event.target.value as SortOption)}
        className="min-h-11 rounded-md border border-border bg-background px-3 text-sm text-primary focus-visible:border-accent"
      >
        {options.map((option) => <option key={option.value} value={option.value}>{t(option.key)}</option>)}
      </select>
    </label>
  );
}