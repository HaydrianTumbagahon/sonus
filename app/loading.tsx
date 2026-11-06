"use client";

import { PageBand } from "@/components/layout/PageBand";
import { useLanguage } from "@/components/providers/LanguageProvider";

export default function Loading() {
  const { t } = useLanguage();

  return (
    <div aria-busy="true" aria-label={t("common.loadingPage")} className="min-h-[60dvh] bg-background">
      <PageBand tone="brand">
        <div className="h-12 max-w-sm animate-pulse rounded-sm bg-on-brand/20 motion-reduce:animate-none" />
      </PageBand>
      <div className="mx-auto max-w-7xl space-y-6 px-4 pt-[calc(2rem+var(--wave-h))] sm:px-6">
        <div className="h-8 w-48 animate-pulse rounded-sm bg-surface-subtle motion-reduce:animate-none" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="h-48 animate-pulse rounded-sm border border-border bg-surface motion-reduce:animate-none"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
