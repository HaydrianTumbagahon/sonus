"use client";

import { animate, type AnimationPlaybackControls } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { blurAmount, enterDuration, exitDuration, introDelay, introStagger, riseAmount, transitionEase } from "@/lib/motion";
import { setPageReady } from "@/lib/transition";

gsap.registerPlugin(ScrollTrigger);

type LenisControls = {
  start: () => void;
  resize: () => void;
  scrollTo?: (target: number, options: { immediate: true; force: true }) => void;
};

type LenisWindow = Window & { lenis?: LenisControls };
type IntroStyle = { opacity: string; targetOpacity: number };

function clearAnimatedStyles(element: HTMLElement) {
  element.style.filter = "";
  element.style.transform = "";
  element.style.willChange = "";
}

function firstGridRow(element: HTMLElement): boolean {
  const parent = element.parentElement;
  if (!parent || getComputedStyle(parent).display !== "grid") return true;
  const markedChildren = Array.from(parent.children).filter(
    (child): child is HTMLElement => child instanceof HTMLElement && child.hasAttribute("data-intro"),
  );
  const firstTop = markedChildren[0]?.getBoundingClientRect().top;
  return firstTop === undefined || Math.abs(element.getBoundingClientRect().top - firstTop) < 2;
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const routerRef = useRef(router);
  const pathnameRef = useRef(pathname);
  const firstLoadRef = useRef(true);
  const leavingRef = useRef(false);
  const transitionIdRef = useRef(0);
  const exitAnimationRef = useRef<AnimationPlaybackControls | null>(null);
  const enterAnimationRef = useRef<AnimationPlaybackControls | null>(null);
  const introAnimationsRef = useRef<AnimationPlaybackControls[]>([]);
  const introStylesRef = useRef(new Map<HTMLElement, IntroStyle>());
  const readyTimerRef = useRef<number | null>(null);
  const safetyTimerRef = useRef<number | null>(null);

  routerRef.current = router;
  pathnameRef.current = pathname;

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const enteredPath = pathname;
    const transitionId = ++transitionIdRef.current;

    if (safetyTimerRef.current !== null) window.clearTimeout(safetyTimerRef.current);
    safetyTimerRef.current = null;
    leavingRef.current = false;
    exitAnimationRef.current?.stop();
    introAnimationsRef.current.forEach((animation) => animation.stop());
    introAnimationsRef.current = [];
    introStylesRef.current.forEach((style, element) => {
      element.style.opacity = style.opacity;
      element.style.filter = "";
      element.style.transform = "";
    });
    introStylesRef.current.clear();

    setPageReady(false);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const firstLoad = firstLoadRef.current;
    firstLoadRef.current = false;
    const duration = reducedMotion ? 0.15 : firstLoad ? 0.4 : enterDuration;
    const useBlur = !reducedMotion && !firstLoad;

    const visibleIntroElements = reducedMotion ? [] : Array.from(wrapper.querySelectorAll<HTMLElement>("[data-intro]"))
      .filter((element) => {
        const bounds = element.getBoundingClientRect();
        return bounds.bottom > 0 && bounds.top < window.innerHeight && bounds.right > 0 && bounds.left < window.innerWidth && firstGridRow(element);
      });
    visibleIntroElements.forEach((element) => {
      const style = {
        opacity: element.style.opacity,
        targetOpacity: Number.parseFloat(getComputedStyle(element).opacity) || 1,
      };
      introStylesRef.current.set(element, style);
      element.style.opacity = "0";
    });

    wrapper.style.minHeight = "";
    wrapper.style.opacity = "0";
    wrapper.style.filter = useBlur ? `blur(${blurAmount}px)` : "";
    wrapper.style.transform = useBlur ? `translate3d(0, ${riseAmount}px, 0)` : "";
    wrapper.style.willChange = "opacity, filter, transform";

    const markReady = () => {
      if (transitionIdRef.current !== transitionId || pathnameRef.current !== enteredPath || leavingRef.current) return;
      setPageReady(true);
      if (reducedMotion) return;
      visibleIntroElements.forEach((element, index) => {
        const delay = Math.min(introDelay + index * introStagger, 0.9);
        const originalStyle = introStylesRef.current.get(element);
        const animation = animate(
          element,
          {
            opacity: [0, originalStyle?.targetOpacity ?? 1],
            transform: ["translate3d(0, 18px, 0)", "translate3d(0, 0, 0)"],
            filter: ["blur(6px)", "blur(0px)"],
          },
          { duration: 0.6, delay, ease: transitionEase },
        );
        introAnimationsRef.current.push(animation);
        animation.then(() => {
          if (transitionIdRef.current !== transitionId || pathnameRef.current !== enteredPath || leavingRef.current) return;
          element.style.opacity = originalStyle?.opacity ?? "";
          element.style.filter = "";
          element.style.transform = "";
          introStylesRef.current.delete(element);
        });
      });
    };

    readyTimerRef.current = window.setTimeout(markReady, duration * 550);
    const completeEnter = () => {
      if (transitionIdRef.current !== transitionId || pathnameRef.current !== enteredPath || leavingRef.current) return;
      if (readyTimerRef.current !== null) {
        window.clearTimeout(readyTimerRef.current);
        readyTimerRef.current = null;
      }
      clearAnimatedStyles(wrapper);
      wrapper.style.opacity = "";
      wrapper.style.minHeight = "";
      firstLoadRef.current = false;
      if (document.documentElement.dataset.pageReady !== "true") markReady();
      ScrollTrigger.refresh();
      const lenis = (window as LenisWindow).lenis;
      lenis?.resize();
      lenis?.start();
    };

    enterAnimationRef.current = animate(
      wrapper,
      {
        opacity: 1,
        ...(useBlur ? { filter: "blur(0px)", transform: "translate3d(0, 0, 0)" } : {}),
      },
      { duration, ease: transitionEase, onComplete: completeEnter },
    );

    return () => {
      if (transitionIdRef.current === transitionId) transitionIdRef.current += 1;
      if (pathnameRef.current !== enteredPath) firstLoadRef.current = false;
      if (readyTimerRef.current !== null) window.clearTimeout(readyTimerRef.current);
      readyTimerRef.current = null;
      enterAnimationRef.current?.stop();
      enterAnimationRef.current = null;
      introAnimationsRef.current.forEach((animation) => animation.stop());
      introAnimationsRef.current = [];
      introStylesRef.current.forEach((style, element) => {
        element.style.opacity = style.opacity;
        element.style.filter = "";
        element.style.transform = "";
      });
      introStylesRef.current.clear();
    };
  }, [pathname]);

  useLayoutEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented || leavingRef.current || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;

      const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.target.toLowerCase() === "_blank" || anchor.hasAttribute("download") || anchor.closest("[data-no-transition]")) return;

      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.pathname === pathnameRef.current) return;

      event.preventDefault();
      leavingRef.current = true;
      firstLoadRef.current = false;
      transitionIdRef.current += 1;
      setPageReady(false);
      if (readyTimerRef.current !== null) window.clearTimeout(readyTimerRef.current);
      readyTimerRef.current = null;
      introAnimationsRef.current.forEach((animation) => animation.stop());
      introAnimationsRef.current = [];

      const wrapper = wrapperRef.current;
      if (!wrapper) {
        routerRef.current.push(`${destination.pathname}${destination.search}${destination.hash}`);
        return;
      }

      wrapper.style.minHeight = `${wrapper.getBoundingClientRect().height}px`;
      wrapper.style.willChange = "opacity, filter, transform";
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const duration = reducedMotion ? 0.15 : exitDuration;
      let navigationStarted = false;
      const navigate = () => {
        if (navigationStarted) return;
        navigationStarted = true;
        if (safetyTimerRef.current !== null) window.clearTimeout(safetyTimerRef.current);
        safetyTimerRef.current = null;
        const lenis = (window as LenisWindow).lenis;
        lenis?.scrollTo?.(0, { immediate: true, force: true });
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        routerRef.current.push(`${destination.pathname}${destination.search}${destination.hash}`);
      };

      safetyTimerRef.current = window.setTimeout(navigate, 1200);
      const completeExit = () => navigate();
      exitAnimationRef.current = animate(
        wrapper,
        {
          opacity: 0,
          ...(reducedMotion ? {} : { filter: `blur(${blurAmount}px)`, transform: "translate3d(0, -8px, 0)" }),
        },
        { duration, ease: transitionEase, onComplete: completeExit },
      );
    };

    document.addEventListener("click", onDocumentClick, true);
    return () => {
      document.removeEventListener("click", onDocumentClick, true);
      if (safetyTimerRef.current !== null) window.clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
      exitAnimationRef.current?.stop();
    };
  }, []);

  return (
    <div ref={wrapperRef} data-page-transition style={{ opacity: 0 }}>
      {children}
    </div>
  );
}