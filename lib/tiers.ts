import type { IEMTier } from "@/types/iem";

export const IEM_PRICE_TIER_THRESHOLDS = {
  entryMaxExclusive: 100,
  midMaxInclusive: 400,
} as const;

export function getIEMTier(iem: { tier?: IEMTier; priceUSD?: number }): IEMTier | undefined {
  if (iem.tier) return iem.tier;
  if (typeof iem.priceUSD !== "number" || !Number.isFinite(iem.priceUSD)) return undefined;
  if (iem.priceUSD < IEM_PRICE_TIER_THRESHOLDS.entryMaxExclusive) return "entry";
  if (iem.priceUSD <= IEM_PRICE_TIER_THRESHOLDS.midMaxInclusive) return "mid";
  return "flagship";
}