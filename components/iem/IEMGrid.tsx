"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { IEMCard, IEMCardSkeleton } from "@/components/iem/IEMCard";
import type { IEM } from "@/types/iem";

export function IEMGrid({
  items,
  loading = false,
  skeletonCount = 8,
  skeletonLabel,
  ariaLabel,
}: {
  items: IEM[];
  loading?: boolean;
  skeletonCount?: number;
  skeletonLabel?: string;
  ariaLabel?: string;
}) {
  const { t } = useLanguage();

  return (
    <section aria-label={ariaLabel ?? t("nav.showroom")}>
      <motion.div layout className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {loading ? (
          Array.from({ length: skeletonCount }, (_, index) => <IEMCardSkeleton key={index} label={skeletonLabel} />)
        ) : (
          <AnimatePresence mode="popLayout" initial={false}>
            {items.length > 0 ? items.map((iem) => <IEMCard key={iem.slug} iem={iem} />) : (
              <motion.div
                key="empty"
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="col-span-full flex min-h-56 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface px-6 py-10 text-center"
              >
                <h2 className="text-lg font-semibold text-primary">{t("showroom.emptyTitle")}</h2>
                <p className="max-w-md text-sm text-secondary">{t("showroom.emptyDescription")}</p>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.div>
    </section>
  );
}