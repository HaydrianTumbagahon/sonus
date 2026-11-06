"use client";

import Link from "next/link";
import {
  ArrowRight,
} from "lucide-react";
import { BrandCarousel } from "@/components/home/BrandCarousel";
import { Hero } from "@/components/home/Hero";
import { GraphTeaser } from "@/components/home/GraphTeaser";
import { TopFive } from "@/components/home/TopFive";
import { SectionHeading } from "@/components/home/SectionHeading";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { Brand, FrequencyTarget, IEM } from "@/types/iem";

export function HomeClient({
  brands,
  graphIem,
  heroIems,
  topFiveIems,
  targets,
}: {
  brands: Brand[];
  graphIem?: IEM;
  heroIems: IEM[];
  topFiveIems: IEM[];
  targets: FrequencyTarget[];
}) {
  const { t } = useLanguage();

  return (
    <div data-home className="overflow-x-clip">
      <Hero iems={heroIems} />

      <TopFive iems={topFiveIems} />

      <section aria-label={t("home.brandSectionTitle")} className="relative isolate bg-background pb-[calc(3.5rem+var(--wave-h))] pt-[calc(3.5rem+var(--wave-h))] sm:pb-[calc(4rem+var(--wave-h))] sm:pt-[calc(4rem+var(--wave-h))]">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-8 2xl:px-12">
          <SectionHeading
            className="mb-8"
            title={t("home.brandSectionTitle")}
          />
        </div>
        <div id="showroom-brands-title">
          <BrandCarousel brands={brands} />
        </div>
      </section>

      <GraphTeaser iem={graphIem} targets={targets} />

      <section className="bg-background text-primary">
        <div className="mx-auto flex max-w-[1600px] flex-col items-start justify-between gap-8 px-4 pb-[calc(3.5rem+var(--wave-h))] pt-[calc(3.5rem+var(--wave-h))] sm:px-8 sm:pb-[calc(4rem+var(--wave-h))] sm:pt-[calc(4rem+var(--wave-h))] md:flex-row md:items-center 2xl:px-12">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold sm:text-4xl">{t("home.finalTitle")}</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-secondary sm:text-base">{t("home.finalDescription")}</p>
          </div>
          <Link href="/showroom" className="group inline-flex min-h-12 shrink-0 items-center gap-3 rounded-full bg-brand px-5 text-sm text-on-brand transition-[background-color,transform] duration-200 active:scale-96 hover:bg-brand-hover">
            <span>{t("home.finalCta")}</span>
            <ArrowRight aria-hidden="true" className="size-[18px] transition-transform duration-200 group-hover:translate-x-[3px]" strokeWidth={2} />
          </Link>
        </div>
      </section>
    </div>
  );
}