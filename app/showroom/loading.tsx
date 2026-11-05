"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { IEMCardSkeleton } from "@/components/iem/IEMCard";

export default function ShowroomLoading() {
  const { t } = useLanguage();

  return (
    <div aria-label={t("showroomUi.loading")} className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:py-10">
      <header className="space-y-3">
        <div className="h-9 w-48 animate-pulse rounded-sm bg-surface-subtle" />
        <div className="h-5 w-96 max-w-full animate-pulse rounded-sm bg-surface-subtle" />
      </header>
      <div className="h-16 animate-pulse rounded-sm border-y border-border bg-surface" />
      <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => <IEMCardSkeleton key={index} />)}
      </div>
    </div>
  );
}