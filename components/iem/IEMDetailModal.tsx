"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, GitCompareArrows, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { FrequencyGraph, type FrequencyGraphSeries } from "@/components/iem/FrequencyGraph";
import { RatingSummary } from "@/components/iem/RatingNumbers";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useAppStore } from "@/lib/store";
import { getIEMTier } from "@/lib/tiers";
import type { IEM } from "@/types/iem";

type Props = {
  iem: IEM;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
};

type LenisControls = { stop: () => void; start: () => void };
type LenisWindow = Window & { lenis?: LenisControls };

const materialFields = ["shell", "faceplate", "nozzle", "cable", "connector"] as const;

function displayValue(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return undefined;
}

function recordValue(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

export function IEMDetailModal({ iem, open, onOpenChange, triggerRef }: Props) {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const compareList = useAppStore((state) => state.compareList);
  const toggleCompare = useAppStore((state) => state.toggleCompare);
  const reduceMotion = useReducedMotion();
  const popupRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const closeTimer = useRef<number | null>(null);
  const closing = useRef(false);
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [present, setPresent] = useState(open);
  const [contentVisible, setContentVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showZones, setShowZones] = useState(true);
  const [transformOrigin, setTransformOrigin] = useState("center center");

  const closePopup = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    setContentVisible(false);
    closeTimer.current = window.setTimeout(() => {
      closing.current = false;
      onOpenChange(false);
    }, reduceMotion ? 0 : 180);
  }, [onOpenChange, reduceMotion]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) setPresent(true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    closing.current = false;
    setContentVisible(false);
    setSelectedImage(0);
    const timer = window.setTimeout(() => setContentVisible(true), reduceMotion ? 120 : 720);
    return () => window.clearTimeout(timer);
  }, [open, iem.slug, reduceMotion]);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !popupRef.current) return;
    const trigger = triggerRef.current.getBoundingClientRect();
    const panel = popupRef.current;
    const panelLeft = (window.innerWidth - panel.offsetWidth) / 2;
    const panelTop = (window.innerHeight - panel.offsetHeight) / 2;
    setTransformOrigin(`${trigger.left + trigger.width / 2 - panelLeft}px ${trigger.top + trigger.height / 2 - panelTop}px`);
  }, [open, present, triggerRef]);

  useEffect(() => {
    if (!present || !mounted) return;
    const triggerElement = triggerRef.current;
    previousActiveElement.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    const body = document.body;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const currentPadding = Number.parseFloat(window.getComputedStyle(body).paddingRight) || 0;
    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) body.style.paddingRight = `${currentPadding + scrollbarWidth}px`;

    const lenis = (window as LenisWindow).lenis;
    lenis?.stop();

    const focusFrame = window.requestAnimationFrame(() => {
      popupRef.current?.querySelector<HTMLElement>("[data-modal-close]")?.focus();
    });
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePopup();
        return;
      }
      if (event.key !== "Tab" || !popupRef.current) return;
      const focusable = [...popupRef.current.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])",
      )].filter((element) => element.getClientRects().length > 0);
      if (focusable.length === 0) {
        event.preventDefault();
        popupRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!popupRef.current.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === popupRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
      lenis?.start();
      requestAnimationFrame(() => (triggerElement ?? previousActiveElement.current)?.focus());
    };
  }, [present, mounted, triggerRef, closePopup]);

  useEffect(() => () => {
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
  }, []);

  const images = [iem.images.hero, ...iem.images.gallery].filter((image): image is string => Boolean(image));
  const selectedIemImage = images[selectedImage];
  const inCompare = compareList.includes(iem.slug);
  const compareAtLimit = compareList.length >= 6 && !inCompare;
  const price = typeof iem.priceUSD === "number" ? formatPrice(iem.priceUSD) : t("common.priceUnavailable");
  const build = { ...recordValue(iem.materials), ...recordValue(iem.build) };
  const accessories = stringList(iem.inTheBox ?? iem.accessories);
  const pros = stringList(iem.pros);
  const cons = stringList(iem.cons);
  const tags = stringList(iem.tags);
  const tier = getIEMTier(iem);
  const graphSeries: FrequencyGraphSeries[] = iem.frDataL?.length || iem.frDataR?.length
    ? [
        ...(iem.frDataL?.length ? [{ id: `${iem.slug}-left`, normalizationId: iem.slug, channel: "left" as const, label: `${iem.brand} ${iem.name} (${t("showroomUi.left")})`, color: "var(--graph-1)", data: iem.frDataL }] : []),
        ...(iem.frDataR?.length ? [{ id: `${iem.slug}-right`, normalizationId: iem.slug, channel: "right" as const, label: `${iem.brand} ${iem.name} (${t("showroomUi.right")})`, color: "var(--graph-1)", data: iem.frDataR }] : []),
      ]
    : iem.frData?.length
      ? [{ id: iem.slug, label: `${iem.brand} ${iem.name}`, color: "var(--graph-1)", data: iem.frData }]
      : [];

  const details = (
    <div className="flex min-w-0 flex-col gap-8 p-4 sm:p-6 lg:p-8">
      <div className="grid min-w-0 gap-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-8">
        <div className="min-w-0 space-y-4">
          <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-surface-subtle">
          {selectedIemImage ? (
            <Image src={selectedIemImage} alt={`${iem.brand} ${iem.name}`} fill sizes="(min-width: 1024px) 36vw, 100vw" className="object-contain p-5" />
          ) : (
            <div className="flex size-full items-center justify-center text-sm text-secondary">{t("product.noImage")}</div>
          )}
          </div>
          {images.length > 1 && (
            <ul aria-label={t("product.openImage")} className="flex gap-2 overflow-x-auto pb-1">
              {images.map((image, index) => (
                <li key={image} className="shrink-0">
                  <button
                    type="button"
                    aria-label={t("product.showImage").replace("{index}", String(index + 1))}
                    aria-pressed={selectedImage === index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative size-14 overflow-hidden rounded-sm border bg-surface-subtle ${selectedImage === index ? "border-accent" : "border-border"}`}
                  >
                    <Image src={image} alt="" fill sizes="56px" className="object-contain p-1" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: contentVisible ? 1 : 0 }}
            transition={{ duration: reduceMotion ? 0.12 : 0.18, ease: "easeOut" }}
            className="space-y-5"
          >
            <header className="space-y-2">
              <p className="text-sm font-medium text-secondary">{iem.brand}</p>
              <h2 className="text-2xl font-semibold text-primary sm:text-3xl">{iem.name}</h2>
              <div className="flex flex-wrap items-center gap-2 text-sm text-secondary">
                {iem.driverType && <span>{iem.driverType}</span>}
                {iem.driverConfiguration && <span className="rounded-sm bg-surface-subtle px-2 py-1">{iem.driverConfiguration}</span>}
                {tier && <span className="rounded-sm bg-accent-muted px-2 py-1 text-primary">{t(`showroomUi.tier${tier[0].toUpperCase()}${tier.slice(1)}`)}</span>}
              </div>
              <p className="font-mono text-xl font-medium text-primary">{price}</p>
              {displayValue(iem.releaseDate) && <p className="text-xs text-secondary">{t("showroomMeta.releaseDate")}: {displayValue(iem.releaseDate)}</p>}
            </header>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={compareAtLimit}
                aria-pressed={inCompare}
                onClick={() => toggleCompare(iem.slug)}
                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-sm px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${inCompare ? "border border-border bg-surface-subtle text-primary" : "bg-accent text-background hover:bg-accent-hover"}`}
              >
                {inCompare ? <Check aria-hidden="true" className="size-4" /> : <GitCompareArrows aria-hidden="true" className="size-4" />}
                {t(inCompare ? "product.removeFromCompare" : "product.addToCompare")}
              </button>
              <Link href={`/iem/${encodeURIComponent(iem.slug)}`} onClick={closePopup} className="inline-flex min-h-11 items-center rounded-sm border border-border px-4 text-sm font-medium text-primary hover:bg-surface-subtle">
                {t("showroomUi.fullPage")}
              </Link>
            </div>
          </motion.div>
        </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: contentVisible ? 1 : 0 }}
        transition={{ duration: reduceMotion ? 0.12 : 0.18, ease: "easeOut" }}
        className="min-w-0 space-y-6"
      >
        <section aria-labelledby={`specs-${iem.slug}`} className="space-y-3">
          <h3 id={`specs-${iem.slug}`} className="text-sm font-semibold text-primary">{t("product.technicalSpecs")}</h3>
          <dl className="divide-y divide-border border-y border-border">
            {([
              ["impedance", iem.impedance],
              ["sensitivity", iem.sensitivity],
              ["frequencyResponse", iem.frequencyResponse],
              ["weight", iem.weight],
              ["connector", iem.connector],
            ] as const).map(([field, value]) => {
              const text = displayValue(value);
              return text ? (
                <div key={field} className="grid grid-cols-[minmax(7rem,0.7fr)_1fr] gap-3 py-2.5 text-sm">
                  <dt className="text-secondary">{t(`spec.${field}`)}</dt>
                  <dd className="break-words font-mono text-primary">{text}</dd>
                </div>
              ) : null;
            })}
            {materialFields.map((field) => {
              const text = displayValue(build[field]);
              return text ? (
                <div key={field} className="grid grid-cols-[minmax(7rem,0.7fr)_1fr] gap-3 py-2.5 text-sm">
                  <dt className="text-secondary">{t(`product.${field}`)}</dt>
                  <dd className="break-words text-primary">{text}</dd>
                </div>
              ) : null;
            })}
            {Object.entries(iem.specs ?? {}).map(([field, value]) => (
              <div key={field} className="grid grid-cols-[minmax(7rem,0.7fr)_1fr] gap-3 py-2.5 text-sm">
                <dt className="text-secondary">{t(`spec.${field}`)}</dt>
                <dd className="break-words font-mono text-primary">{String(value)}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby={`ratings-${iem.slug}`} className="space-y-3">
          <h3 id={`ratings-${iem.slug}`} className="text-sm font-semibold text-primary">{t("rating.title")}</h3>
          <RatingSummary ratings={iem.ratings} enabled={contentVisible} />
        </section>

        {tags.length > 0 && (
          <section aria-label={t("showroomMeta.tags")} className="space-y-2">
            <h3 className="text-sm font-semibold text-primary">{t("showroomMeta.tags")}</h3>
            <ul className="flex flex-wrap gap-2">{tags.map((tag) => <li key={tag} className="rounded-sm bg-surface-subtle px-2.5 py-1.5 text-xs text-secondary">{tag}</li>)}</ul>
          </section>
        )}
        {displayValue(iem.releaseDate) && (
          <p className="text-xs text-secondary">{t("showroomMeta.releaseDate")}: {displayValue(iem.releaseDate)}</p>
        )}

        {accessories.length > 0 && (
          <section aria-labelledby={`accessories-${iem.slug}`} className="space-y-2">
            <h3 id={`accessories-${iem.slug}`} className="text-sm font-semibold text-primary">{t("product.whatsInTheBox")}</h3>
            <ul className="flex flex-wrap gap-2">
              {accessories.map((item, index) => <li key={`${item}-${index}`} className="rounded-sm bg-surface-subtle px-2.5 py-1.5 text-xs text-secondary">{item}</li>)}
            </ul>
          </section>
        )}

        {(pros.length > 0 || cons.length > 0) && (
          <div className="grid gap-4 sm:grid-cols-2">
            {[{ key: "pros", items: pros }, { key: "cons", items: cons }].map(({ key, items }) => (
              <section key={key} aria-labelledby={`${key}-${iem.slug}`} className="space-y-2">
                <h3 id={`${key}-${iem.slug}`} className="text-sm font-semibold text-primary">{t(`product.${key}`)}</h3>
                <ul className="list-inside list-disc space-y-1 text-sm text-secondary">
                  {items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
                </ul>
              </section>
            ))}
          </div>
        )}

        {(iem.personalInsight || iem.description) && (
          <section aria-labelledby={`insight-${iem.slug}`} className="space-y-2">
            <h3 id={`insight-${iem.slug}`} className="text-sm font-semibold text-primary">{t("product.personalInsight")}</h3>
            <p className="text-sm leading-6 text-secondary">{iem.personalInsight ?? iem.description}</p>
          </section>
        )}

      </motion.div>
      </div>

      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: contentVisible ? 1 : 0 }}
        transition={{ duration: reduceMotion ? 0.12 : 0.18, ease: "easeOut" }}
        aria-labelledby={`graph-${iem.slug}`}
        className="min-h-[280px] w-full space-y-3 border-t border-border pt-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 id={`graph-${iem.slug}`} className="text-sm font-semibold text-primary">{t("product.frequencyResponse")}</h3>
          {graphSeries.length > 0 && (
            <button type="button" role="switch" aria-checked={showZones} aria-label={t("graphModes.zones")} onClick={() => setShowZones((current) => !current)} className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-border px-3 text-xs text-primary hover:bg-surface-subtle">
              <span className={`size-3 rounded-full ${showZones ? "bg-accent" : "bg-border"}`} />
              {t("graphModes.zones")}
            </button>
          )}
        </div>
        {graphSeries.length > 0
          ? <FrequencyGraph series={graphSeries} showZones={showZones} animationTrigger={contentVisible} height={300} measuredBy={iem.measuredBy || undefined} measuredOn={iem.measuredOn} />
          : <p className="rounded-sm border border-dashed border-border px-4 py-6 text-center text-sm text-secondary">{t("product.noFrequencyData")}</p>}
      </motion.section>
    </div>
  );

  return mounted ? createPortal(
    <>
      <AnimatePresence initial={false}>
        {open && (
          <motion.button
            key={`backdrop-${iem.slug}`}
            type="button"
            aria-label={t("showroomUi.closeDetails")}
            onClick={closePopup}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.12 : 0.24, ease: "easeOut" }}
            className="fixed inset-0 z-[60] cursor-default bg-background/60 backdrop-blur-[12px]"
          />
        )}
      </AnimatePresence>

      {present && (
        <div className="pointer-events-none fixed inset-0 z-[61] flex items-center justify-center p-2 sm:p-4">
          <AnimatePresence initial={false} onExitComplete={() => setPresent(false)}>
            {open && (
              <motion.div
                key={`popup-${iem.slug}`}
                ref={popupRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                onAnimationComplete={() => {
                  if (open) setContentVisible(true);
                }}
                initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.92 }}
                transition={{ duration: reduceMotion ? 0.12 : 0.28, ease: "easeOut" }}
                style={{ transformOrigin }}
                className="pointer-events-auto flex h-[90dvh] w-[calc(100vw-16px)] flex-col overflow-hidden rounded-xl border border-border bg-surface text-primary shadow-xl outline-none sm:h-[min(88vh,820px)] sm:w-[min(94vw,1000px)]"
              >
                <h2 id={titleId} className="sr-only">{`${iem.brand} ${iem.name}`}</h2>
                <button
                  type="button"
                  data-modal-close
                  aria-label={t("showroomUi.closeDetails")}
                  onClick={closePopup}
                  className="absolute right-2 top-2 z-20 inline-flex size-11 items-center justify-center rounded-full text-secondary transition-colors hover:text-primary focus-visible:outline-offset-2"
                >
                  <X aria-hidden="true" className="size-5" />
                </button>
                <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                  {details}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </>,
    document.body,
  ) : null;
}