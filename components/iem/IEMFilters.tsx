"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Popover } from "@base-ui/react/popover";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { driverOptions, type DriverFilter, type PriceSort, type ShowroomFilters, type TierFilter } from "@/components/iem/filter-types";
import type { Brand } from "@/types/iem";

type FilterOption = {
  value: string;
  label: string;
  disabled?: boolean;
  suffix?: string;
  count?: number;
  leading?: ReactNode;
};

function FilterDropdown({
  label,
  value,
  options,
  onSelect,
  multiple = false,
  selectedValues = [],
  selectedLabel,
}: {
  label: string;
  value: string;
  options: FilterOption[];
  onSelect: (value: string) => void;
  multiple?: boolean;
  selectedValues?: string[];
  selectedLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value) ?? options[0];

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger className="inline-flex min-h-11 shrink-0 items-center gap-3 rounded-sm border border-border bg-background px-3 text-sm text-primary transition-colors hover:bg-surface-subtle focus-visible:outline-offset-2">
        <span className="text-secondary">{label}</span>
        <span className="max-w-36 truncate font-medium">{selectedLabel ?? selected.label}</span>
        <ChevronDown aria-hidden="true" className={`size-4 shrink-0 text-tertiary transition-transform ${open ? "rotate-180" : ""}`} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={6} align="start" className="z-50 outline-none">
          <Popover.Popup className="max-h-[min(70dvh,28rem)] w-72 overflow-y-auto rounded-md border border-border bg-background p-1 shadow-lg outline-none">
            <p className="px-3 py-2 text-xs font-semibold uppercase text-tertiary">{label}</p>
            <div role="listbox" aria-label={label} aria-multiselectable={multiple || undefined}>
              {options.map((option) => {
                const isSelected = multiple
                  ? option.value === "all" ? selectedValues.length === 0 : selectedValues.includes(option.value)
                  : value === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={option.disabled}
                    onClick={() => {
                      onSelect(option.value);
                      if (!multiple) setOpen(false);
                    }}
                    className="flex min-h-11 w-full items-center gap-3 rounded-sm px-2 text-left text-sm text-primary transition-colors hover:bg-surface-subtle focus-visible:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    {option.leading}
                    <span className="min-w-0 flex-1 truncate">{option.label}</span>
                    {option.suffix && <span className="shrink-0 rounded-sm bg-surface-subtle px-1.5 py-0.5 text-[10px] font-medium text-secondary">{option.suffix}</span>}
                    <span className="ml-auto flex shrink-0 items-center gap-2">
                      {option.count !== undefined && <span className="font-mono text-xs text-secondary">{option.count}</span>}
                      {isSelected && <Check aria-hidden="true" className="size-4 text-accent" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function IEMFilters({
  brands,
  filters,
  onChange,
  brandCounts,
  totalCount,
}: {
  brands: Brand[];
  filters: ShowroomFilters;
  onChange: (filters: ShowroomFilters) => void;
  brandCounts: Record<string, number>;
  totalCount: number;
}) {
  const { t } = useLanguage();
  const update = (patch: Partial<ShowroomFilters>) => onChange({ ...filters, ...patch });
  const sortedBrands = [...brands].sort((left, right) => {
    if (left.status !== right.status) return left.status === "live" ? -1 : 1;
    if (left.status === "live") return (brandCounts[right.slug] ?? 0) - (brandCounts[left.slug] ?? 0);
    return 0;
  });
  const selectedBrand = brands.find((brand) => brand.slug === filters.brands[0]);
  const selectedBrandLabel = filters.brands.length === 0
    ? t("showroomUi.allBrands")
    : filters.brands.length === 1
      ? selectedBrand?.name ?? t("showroomUi.allBrands")
      : t("showroomUi.selectedBrands").replace("{count}", String(filters.brands.length));
  const brandOptions: FilterOption[] = [
    { value: "all", label: t("showroomUi.allBrands"), count: totalCount },
    ...sortedBrands.map((brand) => ({
      value: brand.slug,
      label: brand.name,
      disabled: brand.status !== "live",
      suffix: brand.status !== "live" ? t("common.soon") : undefined,
      count: brand.status === "live" ? brandCounts[brand.slug] ?? 0 : undefined,
      leading: (
        <span className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-border bg-surface-subtle text-[10px] font-semibold text-secondary">
          {brand.logo
            ? <Image src={brand.logo} alt="" fill sizes="32px" className="object-contain p-0.5" />
            : brand.name.slice(0, 2).toUpperCase()}
        </span>
      ),
    })),
  ];
  const priceOptions: FilterOption[] = [
    { value: "default", label: t("showroomUi.sortDefault") },
    { value: "low-to-high", label: t("showroomUi.sortLowToHigh") },
    { value: "high-to-low", label: t("showroomUi.sortHighToLow") },
  ];
  const driverFilterOptions: FilterOption[] = driverOptions.map((option) => ({
    value: option.value,
    label: t(option.key),
  }));
  const tierOptions: FilterOption[] = [
    { value: "all", label: t("showroomUi.all") },
    { value: "entry", label: t("showroomUi.tierEntry") },
    { value: "mid", label: t("showroomUi.tierMid") },
    { value: "flagship", label: t("showroomUi.tierFlagship") },
  ];

  return (
    <div data-intro role="group" aria-label={t("showroomUi.filters")} className="max-w-full overflow-x-auto md:overflow-visible">
      <div className="flex w-max gap-2 md:w-auto md:flex-wrap">
        <FilterDropdown
          label={t("showroomUi.brand")}
          value={filters.brands.length === 1 ? filters.brands[0] : filters.brands.length === 0 ? "all" : "multiple"}
          options={brandOptions}
          multiple
          selectedValues={filters.brands}
          selectedLabel={selectedBrandLabel}
          onSelect={(value) => update({ brands: value === "all"
            ? []
            : filters.brands.includes(value)
              ? filters.brands.filter((slug) => slug !== value)
              : [...filters.brands, value] })}
        />
        <FilterDropdown
          label={t("showroomUi.price")}
          value={filters.price}
          options={priceOptions}
          onSelect={(value) => update({ price: value as PriceSort })}
        />
        <FilterDropdown
          label={t("showroomUi.driver")}
          value={filters.driver}
          options={driverFilterOptions}
          onSelect={(value) => update({ driver: value as DriverFilter })}
        />
        <FilterDropdown
          label={t("showroomUi.tier")}
          value={filters.tier}
          options={tierOptions}
          onSelect={(value) => update({ tier: value as TierFilter })}
        />
      </div>
    </div>
  );
}