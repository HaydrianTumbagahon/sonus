import brandData from "@/generated/brands.json";
import iemData from "@/generated/iems.json";
import targetData from "@/generated/targets.json";
import type { Brand, FrequencyTarget, IEM } from "@/types/iem";

const brands = brandData as Brand[];
const iems = iemData as IEM[];
const targets = targetData as FrequencyTarget[];

export function getAllIEMs(): IEM[] {
  return iems;
}

export function getAllTargets(): FrequencyTarget[] {
  return targets;
}

export function getIEMBySlug(slug: string): IEM | undefined {
  return iems.find((iem) => iem.slug === slug);
}

export function getAllBrands(): Brand[] {
  return brands;
}

export function getBrandBySlug(slug: string): Brand | undefined {
  return brands.find((brand) => brand.slug === slug);
}

export function getIEMsByBrand(brandSlug: string): IEM[] {
  return iems.filter((iem) => iem.brandSlug === brandSlug);
}