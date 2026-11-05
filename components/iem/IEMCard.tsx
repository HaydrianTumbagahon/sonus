"use client";

import Image from "next/image";
import { ImageOff } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useRef, useState, type MouseEvent } from "react";
import { IEMDetailModal } from "@/components/iem/IEMDetailModal";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { IEM } from "@/types/iem";

export function IEMCard({ iem }: { iem: IEM }) {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const detailsTriggerRef = useRef<HTMLButtonElement>(null);

  const openDetails = (event: MouseEvent<HTMLButtonElement>) => {
    detailsTriggerRef.current = event.currentTarget;
    setOpen(true);
  };

  const setModalOpen = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) requestAnimationFrame(() => detailsTriggerRef.current?.focus());
  };

  return (
    <motion.article className="group flex h-full min-w-0 flex-col rounded-sm bg-surface">
      <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-surface-subtle">
        <button
          ref={detailsTriggerRef}
          type="button"
          aria-label={`${iem.brand} ${iem.name}`}
          aria-haspopup="dialog"
          onClick={openDetails}
          className="block size-full border-0 bg-transparent p-0 text-left"
        >
          {iem.images.hero ? (
            <motion.div
              className="absolute inset-0"
              whileHover={reduceMotion ? undefined : { scale: 1.08 }}
              transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <Image
                src={iem.images.hero}
                alt=""
                fill
                sizes="(min-width: 1536px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-contain p-5"
              />
            </motion.div>
          ) : (
            <div className="flex size-full items-center justify-center text-tertiary">
              <ImageOff aria-hidden="true" className="size-8" />
            </div>
          )}
        </button>
      </div>
      <div className="flex flex-1 flex-col px-5 pt-4 pb-5 max-[359px]:px-4">
        <h2 className="line-clamp-2 text-left text-base font-semibold text-primary">
          <button type="button" aria-haspopup="dialog" onClick={openDetails} className="group/name block w-full border-0 bg-transparent p-0 text-left font-semibold text-primary">
            <span className="relative inline-block after:absolute after:inset-x-0 after:bottom-0 after:h-px after:w-0 after:bg-current after:content-[''] after:transition-[width] after:duration-200 after:ease-out group-hover/name:after:w-full group-focus-visible/name:after:w-full motion-reduce:after:transition-none">
              {iem.name}
            </span>
          </button>
        </h2>
        <p className="mt-1 text-left text-xs font-medium text-secondary">{iem.brand}</p>
        <p className="mt-3 text-left font-mono text-sm font-medium text-primary">
          {typeof iem.priceUSD === "number" ? formatPrice(iem.priceUSD) : t("common.priceUnavailable")}
        </p>
      </div>
      <IEMDetailModal iem={iem} open={open} onOpenChange={setModalOpen} triggerRef={detailsTriggerRef} />
    </motion.article>
  );
}

export function IEMCardSkeleton({ label }: { label?: string }) {
  return (
    <div
      aria-hidden={label ? undefined : true}
      aria-label={label}
      className={`flex h-full min-w-0 flex-col rounded-sm bg-surface ${label ? "skeleton-shimmer" : ""}`}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-surface-subtle">
        {label && <span className="absolute inset-x-2 bottom-2 rounded-sm bg-background/90 px-2 py-1 text-center text-xs text-secondary">{label}</span>}
      </div>
      <div className="flex flex-1 flex-col px-5 pt-4 pb-5 max-[359px]:px-4">
        <div className="space-y-1">
          <div className="h-3 w-3/4 rounded bg-surface-subtle" />
          <div className="h-3 w-1/2 rounded bg-surface-subtle" />
        </div>
        <div className="mt-1 h-3 w-1/3 rounded bg-surface-subtle" />
        <div className="mt-3 h-4 w-1/3 rounded bg-surface-subtle" />
      </div>
    </div>
  );
}