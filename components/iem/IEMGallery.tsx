"use client";

import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, ArrowRight, ImageOff, X } from "lucide-react";
import { useRef, useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { IEM } from "@/types/iem";

export function IEMGallery({ iem }: { iem: IEM }) {
  const { t } = useLanguage();
  const images = [...new Set([iem.images.hero, ...iem.images.gallery].filter((image): image is string => Boolean(image)))];
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const pointerStart = useRef<number | null>(null);
  const didSwipe = useRef(false);
  const activeImage = images[activeIndex];
  const imageLabel = (index: number) => t("product.showImage").replace("{index}", String(index + 1));

  const moveImage = (direction: number) => {
    setActiveIndex((index) => (index + direction + images.length) % images.length);
  };

  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center rounded-lg bg-surface-subtle text-secondary">
        <span className="flex flex-col items-center gap-3 text-sm">
          <ImageOff aria-hidden="true" className="size-8" />
          {t("product.noImage")}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        aria-label={t("product.openImage")}
        onPointerDown={(event) => {
          pointerStart.current = event.clientX;
          if (event.pointerType === "touch") event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerUp={(event) => {
          if (pointerStart.current === null) return;
          const difference = event.clientX - pointerStart.current;
          pointerStart.current = null;
          if (event.pointerType === "touch" && Math.abs(difference) > 40) {
            didSwipe.current = true;
            moveImage(difference < 0 ? 1 : -1);
          }
        }}
        onClick={() => {
          if (didSwipe.current) {
            didSwipe.current = false;
            return;
          }
          setLightboxOpen(true);
        }}
        className="relative block aspect-[4/5] w-full overflow-hidden rounded-lg bg-surface-subtle text-left focus-visible:outline-offset-4"
      >
        <Image src={activeImage} alt={`${iem.brand} ${iem.name}`} fill priority sizes="(min-width: 1024px) 42vw, 100vw" className="object-contain p-4" />
      </button>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              aria-label={imageLabel(index)}
              aria-current={index === activeIndex ? "true" : undefined}
              onClick={() => setActiveIndex(index)}
              className={`relative size-16 shrink-0 overflow-hidden rounded-md border bg-surface-subtle ${index === activeIndex ? "border-accent" : "border-border"}`}
            >
              <Image src={image} alt="" fill sizes="64px" className="object-contain p-1" />
            </button>
          ))}
        </div>
      )}

      <Dialog.Root open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[60] bg-background/90 backdrop-blur-sm" />
          <Dialog.Content
            aria-describedby={undefined}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight") moveImage(1);
              if (event.key === "ArrowLeft") moveImage(-1);
            }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 outline-none"
          >
            <Dialog.Title className="sr-only">{t("product.openImage")}</Dialog.Title>
            <button type="button" aria-label={t("common.close")} onClick={() => setLightboxOpen(false)} className="absolute right-4 top-4 z-10 inline-flex size-11 items-center justify-center rounded-md bg-surface text-primary">
              <X aria-hidden="true" className="size-5" />
            </button>
            {images.length > 1 && (
              <>
                <button type="button" aria-label={t("product.previousImage")} onClick={() => moveImage(-1)} className="absolute left-3 top-1/2 z-10 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-md bg-surface text-primary sm:left-6">
                  <ArrowLeft aria-hidden="true" className="size-5" />
                </button>
                <button type="button" aria-label={t("product.nextImage")} onClick={() => moveImage(1)} className="absolute right-3 top-1/2 z-10 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-md bg-surface text-primary sm:right-6">
                  <ArrowRight aria-hidden="true" className="size-5" />
                </button>
              </>
            )}
            <div className="relative h-full max-h-[90dvh] w-full max-w-5xl">
              <Image src={activeImage} alt={`${iem.brand} ${iem.name}`} fill sizes="100vw" className="object-contain" />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}