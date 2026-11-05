"use client";

import Image from "next/image";
import Link from "next/link";
import { BellRing, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { IEMGrid } from "@/components/iem/IEMGrid";
import { IEMSortSelect } from "@/components/iem/IEMSortSelect";
import { sortIEMs } from "@/components/iem/sortIEMs";
import type { SortOption } from "@/components/iem/filter-types";
import type { Brand, IEM } from "@/types/iem";

export function BrandPageClient({ brand, iems }: { brand: Brand; iems: IEM[] }) {
  const { t } = useLanguage();
  const [sort, setSort] = useState<SortOption>("default");
  const comingSoon = brand.status === "coming-soon";
  const sortedIems = useMemo(() => sortIEMs(iems, sort), [iems, sort]);
  const description = brand.description ?? t(comingSoon ? "brand.comingSoonDescription" : "brand.liveDescription");
  const itemCount = t("brand.itemCount").replace("{count}", String(brand.iemCount));

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:py-10">
      <nav aria-label={t("brand.breadcrumb")} className="flex items-center gap-2 text-sm text-secondary">
        <Link href="/showroom" className="min-h-11 inline-flex items-center hover:text-primary">{t("nav.showroom")}</Link>
        <ChevronRight aria-hidden="true" className="size-4" />
        <span aria-current="page" className="text-primary">{brand.name}</span>
      </nav>

      <header className="grid gap-6 border-y border-border bg-surface px-5 py-7 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:px-8 sm:py-9">
        <div className="flex size-20 items-center justify-center overflow-hidden rounded-lg border border-border bg-background text-xl font-semibold text-secondary sm:size-24">
          {brand.logo ? (
            <Image src={brand.logo} alt={`${brand.name} ${t("showroom.logoAlt")}`} width={96} height={96} className="size-full object-contain p-2" priority />
          ) : brand.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold text-primary">{brand.name}</h1>
            {comingSoon && <Badge variant="secondary">{t("brand.comingSoon")}</Badge>}
          </div>
          <p className="max-w-3xl text-sm leading-relaxed text-secondary">{description}</p>
          <p className="font-mono text-sm text-tertiary">{itemCount}</p>
        </div>
      </header>

      {comingSoon && (
        <aside className="flex items-start gap-4 rounded-md border border-border bg-surface px-5 py-4">
          <BellRing aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-accent" />
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-primary">{t("brand.wantNotified")}</h2>
            <p className="text-sm text-secondary">{t("brand.notificationMessage")}</p>
          </div>
        </aside>
      )}

      <section aria-labelledby="brand-iem-heading" className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="brand-iem-heading" className="text-xl font-semibold text-primary">{t("brand.models")}</h2>
          {!comingSoon && <IEMSortSelect value={sort} onChange={setSort} />}
        </div>
        {comingSoon ? (
          <IEMGrid
            items={[]}
            loading
            skeletonCount={6}
            skeletonLabel={t("brand.comingSoon")}
            ariaLabel={brand.name}
          />
        ) : (
          <IEMGrid items={sortedIems} ariaLabel={brand.name} />
        )}
      </section>
    </div>
  );
}