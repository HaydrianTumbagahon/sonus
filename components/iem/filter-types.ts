import type { IEMTier } from "@/types/iem";

export const driverOptions = [
  { value: "all", key: "showroomUi.all" },
  { value: "dd", key: "showroom.filters.dd" },
  { value: "ba", key: "showroom.filters.ba" },
  { value: "planar", key: "showroom.filters.planar" },
  { value: "est", key: "showroom.filters.est" },
  { value: "bone-conduction", key: "showroom.filters.boneConduction" },
  { value: "hybrid", key: "showroom.filters.hybrid" },
] as const;

export type DriverFilter = (typeof driverOptions)[number]["value"];
export type PriceSort = "default" | "low-to-high" | "high-to-low";
export type TierFilter = "all" | IEMTier;
export type SortOption = "default" | "price-up" | "price-down" | "rating" | "newest";

export type ShowroomFilters = {
  brands: string[];
  price: PriceSort;
  driver: DriverFilter;
  tier: TierFilter;
  query: string;
};

export const defaultShowroomFilters: ShowroomFilters = {
  brands: [],
  price: "default",
  driver: "all",
  tier: "all",
  query: "",
};

export function parseShowroomFilters(params: URLSearchParams, brandSlugs: string[]): ShowroomFilters {
  const requestedBrands = params.getAll("brand").flatMap((value) => value.split(","));
  const requestedPrice = params.get("price");
  const requestedDriver = params.get("driver");
  const requestedTier = params.get("tier");

  return {
    brands: [...new Set(requestedBrands)].filter((slug) => brandSlugs.includes(slug)),
    price: requestedPrice === "low-to-high" || requestedPrice === "high-to-low" ? requestedPrice : "default",
    driver: driverOptions.some((option) => option.value === requestedDriver)
      ? requestedDriver as DriverFilter
      : "all",
    tier: ["entry", "mid", "flagship"].includes(requestedTier ?? "")
      ? requestedTier as IEMTier
      : "all",
    query: params.get("q") ?? "",
  };
}

export function serializeShowroomFilters(filters: ShowroomFilters): string {
  const params = new URLSearchParams();
  filters.brands.forEach((slug) => params.append("brand", slug));
  if (filters.price !== "default") params.set("price", filters.price);
  if (filters.driver !== "all") params.set("driver", filters.driver);
  if (filters.tier !== "all") params.set("tier", filters.tier);
  if (filters.query.trim()) params.set("q", filters.query.trim());
  return params.toString();
}