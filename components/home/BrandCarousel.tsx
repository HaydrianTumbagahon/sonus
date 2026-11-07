"use client";

import Image from "next/image";
import { motion, useAnimationFrame, useMotionValue, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { Brand } from "@/types/iem";

type Sizes = { viewport: number; set: number };
type DragSession = {
  pointerId: number;
  captureTarget: HTMLElement;
  startX: number;
  lastX: number;
  lastTime: number;
  velocity: number;
  moved: boolean;
};

const brandOrder = [
  "7hz",
  "dunu",
  "fiio",
  "kinera",
  "kiwi-ears",
  "kz",
  "moondrop",
  "simgot",
  "tanchjim",
  "tangzu",
  "truthear",
] as const;

function wrapOffset(offset: number, width: number): number {
  if (width <= 0) return offset;
  const wrapped = ((offset % width) + width) % width;
  return wrapped === 0 ? 0 : wrapped - width;
}

function brandMonogram(name: string): string {
  return name.split(/[\s-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export function BrandCarousel({ brands }: { brands: Brand[] }) {
  const { t } = useLanguage();
  const reduceMotion = useReducedMotion();
  const orderedBrands = brands.filter((brand) => brand.status === "live").sort((left, right) => {
    const leftIndex = brandOrder.indexOf(left.slug as (typeof brandOrder)[number]);
    const rightIndex = brandOrder.indexOf(right.slug as (typeof brandOrder)[number]);
    return (leftIndex < 0 ? brandOrder.length : leftIndex) - (rightIndex < 0 ? brandOrder.length : rightIndex);
  });
  const viewportRef = useRef<HTMLDivElement>(null);
  const firstSetRef = useRef<HTMLDivElement>(null);
  const offset = useMotionValue(0);
  const setWidthRef = useRef(0);
  const dragRef = useRef<DragSession | null>(null);
  const inertiaRef = useRef(0);
  const focusedRef = useRef(false);
  const inViewportRef = useRef(false);
  const documentHiddenRef = useRef(true);
  const suppressClickRef = useRef(false);
  const suppressTimerRef = useRef<number | null>(null);
  const speedRef = useRef({ value: 0, from: 0, target: 0, startedAt: 0 });
  const [sizes, setSizes] = useState<Sizes>({ viewport: 0, set: 0 });
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const viewport = viewportRef.current;
    const firstSet = firstSetRef.current;
    if (!viewport || !firstSet) return;

    const measure = () => {
      const viewportWidth = viewport.clientWidth;
      const setWidth = firstSet.getBoundingClientRect().width;
      if (setWidth > 0) {
        offset.set(setWidthRef.current === 0 ? -setWidth : wrapOffset(offset.get(), setWidth));
        setWidthRef.current = setWidth;
      }
      setSizes({ viewport: viewportWidth, set: setWidth });
    };

    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }

    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(firstSet);
    return () => observer.disconnect();
  }, [brands.length, offset]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    if (typeof IntersectionObserver === "undefined") {
      inViewportRef.current = true;
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      inViewportRef.current = Boolean(entry?.isIntersecting);
    }, { threshold: 0 });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const updateVisibility = () => { documentHiddenRef.current = document.hidden; };
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(() => () => {
    if (suppressTimerRef.current !== null) window.clearTimeout(suppressTimerRef.current);
  }, []);

  useAnimationFrame((time, delta) => {
    const draggingNow = dragRef.current !== null;
    const hasInertia = !reduceMotion && Math.abs(inertiaRef.current) > 1;
    const paused = reduceMotion || focusedRef.current || draggingNow || !inViewportRef.current || documentHiddenRef.current || hasInertia;
    const targetSpeed = paused ? 0 : 40;
    const speed = speedRef.current;

    if (speed.target !== targetSpeed) {
      speed.from = speed.value;
      speed.target = targetSpeed;
      speed.startedAt = time;
    }

    const progress = Math.min(1, Math.max(0, (time - speed.startedAt) / 400));
    const eased = 1 - (1 - progress) ** 3;
    speed.value = speed.from + (speed.target - speed.from) * eased;

    const width = setWidthRef.current;
    if (width <= 0 || draggingNow) return;

    if (hasInertia) {
      const velocity = inertiaRef.current;
      offset.set(wrapOffset(offset.get() + velocity * delta / 1000, width));
      inertiaRef.current = velocity * Math.exp(-delta / 520);
      if (Math.abs(inertiaRef.current) <= 1) inertiaRef.current = 0;
      return;
    }

    offset.set(wrapOffset(offset.get() - speed.value * delta / 1000, width));
  });

  const copyCount = sizes.set > 0
    ? Math.max(2, Math.ceil((sizes.viewport * 2) / sizes.set), Math.ceil(sizes.viewport / sizes.set) + 1)
    : 2;

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current || (event.pointerType === "mouse" && event.button !== 0)) return;
    const link = event.target instanceof Element
      ? event.target.closest<HTMLElement>("[data-brand-carousel-link]")
      : null;
    const captureTarget = link ?? event.currentTarget;
    captureTarget.setPointerCapture(event.pointerId);
    inertiaRef.current = 0;
    dragRef.current = {
      pointerId: event.pointerId,
      captureTarget,
      startX: event.clientX,
      lastX: event.clientX,
      lastTime: event.timeStamp,
      velocity: 0,
      moved: false,
    };
    setDragging(true);
  };

  const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.lastX;
    const elapsed = Math.max(1, event.timeStamp - drag.lastTime);
    const instantaneousVelocity = (dx / elapsed) * 1000;
    drag.velocity = Math.max(-1800, Math.min(1800, drag.velocity * 0.65 + instantaneousVelocity * 0.35));
    drag.lastX = event.clientX;
    drag.lastTime = event.timeStamp;
    if (Math.abs(event.clientX - drag.startX) > 6) drag.moved = true;
    offset.set(wrapOffset(offset.get() + dx, setWidthRef.current));
  };

  const finishDrag = (event: ReactPointerEvent<HTMLDivElement>, useInertia: boolean) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const finalDelta = event.clientX - drag.lastX;
    if (useInertia && finalDelta !== 0) {
      const elapsed = Math.max(1, event.timeStamp - drag.lastTime);
      const instantaneousVelocity = (finalDelta / elapsed) * 1000;
      drag.velocity = Math.max(-1800, Math.min(1800, drag.velocity * 0.65 + instantaneousVelocity * 0.35));
      offset.set(wrapOffset(offset.get() + finalDelta, setWidthRef.current));
    }
    if (Math.abs(event.clientX - drag.startX) > 6) drag.moved = true;
    dragRef.current = null;
    setDragging(false);
    inertiaRef.current = useInertia && drag.moved && !reduceMotion ? drag.velocity : 0;

    if (drag.moved) {
      suppressClickRef.current = true;
      viewportRef.current?.querySelectorAll<HTMLAnchorElement>("[data-brand-carousel-link]").forEach((link) => link.setAttribute("data-no-transition", ""));
      if (suppressTimerRef.current !== null) window.clearTimeout(suppressTimerRef.current);
      suppressTimerRef.current = window.setTimeout(() => {
        suppressClickRef.current = false;
        viewportRef.current?.querySelectorAll<HTMLAnchorElement>("[data-brand-carousel-link]").forEach((link) => link.removeAttribute("data-no-transition"));
        suppressTimerRef.current = null;
      }, 500);
    }

    if (drag.captureTarget.hasPointerCapture(event.pointerId)) {
      drag.captureTarget.releasePointerCapture(event.pointerId);
    }
  };

  const suppressDraggedClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!suppressClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClickRef.current = false;
    event.currentTarget.querySelectorAll<HTMLAnchorElement>("[data-brand-carousel-link]").forEach((link) => link.removeAttribute("data-no-transition"));
    if (suppressTimerRef.current !== null) window.clearTimeout(suppressTimerRef.current);
    suppressTimerRef.current = null;
  };

  return (
    <div
      ref={viewportRef}
      role="region"
      aria-roledescription={t("home.brandCarouselRole")}
      aria-label={t("home.brandCarousel")}
      tabIndex={reduceMotion ? 0 : undefined}
      onFocusCapture={() => { focusedRef.current = true; }}
      onBlurCapture={(event) => {
        if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) {
          focusedRef.current = false;
        }
      }}
      onPointerDown={startDrag}
      onPointerMove={moveDrag}
      onPointerUp={(event) => finishDrag(event, true)}
      onPointerCancel={(event) => finishDrag(event, false)}
      onClickCapture={suppressDraggedClick}
      className={`brand-carousel-mask w-full ${reduceMotion ? "overflow-x-auto" : "overflow-hidden"} ${reduceMotion ? "" : dragging ? "cursor-grabbing" : "cursor-grab"}`}
    >
      <motion.div style={{ x: offset }} className="flex w-max touch-pan-y select-none items-center">
        {Array.from({ length: copyCount }, (_, setIndex) => {
          const duplicate = setIndex > 0;
          return (
            <div
              key={setIndex}
              ref={setIndex === 0 ? firstSetRef : undefined}
              aria-hidden={duplicate || undefined}
              className="flex shrink-0 items-center gap-6"
            >
              {orderedBrands.map((brand) => {
                const comingSoon = brand.status === "coming-soon";
                return (
                  <motion.a
                    key={`${setIndex}-${brand.slug}`}
                    data-brand-carousel-link
                    href={`/brand/${encodeURIComponent(brand.slug)}`}
                    aria-label={t("home.viewBrandIems").replace("{brand}", brand.name)}
                    tabIndex={duplicate ? -1 : undefined}
                    draggable={false}
                    whileHover={reduceMotion ? undefined : { borderColor: "var(--brand-text)" }}
                    whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className={`relative flex size-[104px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-logo-tile transition-colors focus-visible:outline-offset-2 md:size-[128px] ${comingSoon ? "opacity-60" : ""}`}
                  >
                    {brand.logo ? (
                      <motion.span
                        aria-hidden="true"
                        whileHover={reduceMotion ? undefined : { scale: 1.06 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="relative h-[60%] w-[60%]"
                      >
                        <Image
                          src={brand.logo}
                          alt=""
                          fill
                          sizes="128px"
                          draggable={false}
                          className="pointer-events-none object-contain"
                        />
                      </motion.span>
                    ) : (
                      <span className="flex flex-col items-center gap-1">
                        <motion.span
                          aria-hidden="true"
                          whileHover={reduceMotion ? undefined : { scale: 1.06 }}
                          transition={{ duration: 0.18, ease: "easeOut" }}
                          className="font-display text-lg font-normal text-primary"
                        >
                          {brandMonogram(brand.name)}
                        </motion.span>
                      </span>
                    )}
                    {comingSoon && (
                      <span aria-hidden="true" className="absolute bottom-2 rounded-full border border-border bg-background px-1.5 py-0.5 text-[9px] leading-none text-secondary">
                        {t("common.soon")}
                      </span>
                    )}
                  </motion.a>
                );
              })}
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}