import brandData from "@/generated/brands.json";
import iemData from "@/generated/iems.json";
import targetData from "@/generated/targets.json";
import glossaryData from "@/generated/glossary.json";
import type { Brand, FrequencyTarget, IEM } from "@/types/iem";
import type { GlossaryTerm } from "@/data/glossary";

const brands = brandData as Brand[];
const iems = iemData as IEM[];
const targets = targetData as FrequencyTarget[];
const cleanGlossaryText = (value: string) => value
  .split(/\r?\n/)
  .filter((line) => !/^#/.test(line.trim()) && line.trim() !== "No related terms listed.")
  .join("\n")
  .replace(/\n{3,}/g, "\n\n")
  .trim();
const glossaryTerms = (glossaryData as GlossaryTerm[]).map((term) => ({
  ...term,
  explanation: cleanGlossaryText(term.explanation),
}));

export function getAllIEMs(): IEM[] {
  return iems;
}

export function getIEMListingData(items: IEM[]): IEM[] {
  return items.map((iem) => {
    const { frData, frDataL, frDataR, ...listing } = iem;
    return listing as IEM;
  });
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

export function getAllGlossaryTerms(): GlossaryTerm[] {
  return glossaryTerms;
}

export function getGlossaryTermBySlug(slug: string): GlossaryTerm | undefined {
  return glossaryTerms.find((term) => term.slug === slug);
}

export function getBrandBySlug(slug: string): Brand | undefined {
  return brands.find((brand) => brand.slug === slug);
}

export function getIEMsByBrand(brandSlug: string): IEM[] {
  return iems.filter((iem) => iem.brandSlug === brandSlug);
}