"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { scrollToTarget } from "@/lib/scroll";

type LenisControls = {
  start: () => void;
  resize: () => void;
  scrollTo: (target: number, options: { immediate: true; force: true }) => void;
};

export function ScrollReset() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    const previousRestoration = history.scrollRestoration;
    history.scrollRestoration = "manual";

    const reset = () => {
      const lenis = (window as Window & { lenis?: LenisControls }).lenis;
      lenis?.start();

      if (window.location.hash) {
        let hash = window.location.hash.slice(1);
        try {
          hash = decodeURIComponent(hash);
        } catch {
          // Keep the encoded hash if it is not valid URI data.
        }
        const element = document.getElementById(hash);
        if (element instanceof HTMLElement) {
          scrollToTarget(element);
        }
      } else {
        lenis?.scrollTo(0, { immediate: true, force: true });
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        lenis?.resize();
      }
    };

    reset();
    const frame = window.requestAnimationFrame(reset);

    return () => {
      window.cancelAnimationFrame(frame);
      history.scrollRestoration = previousRestoration;
    };
  }, [pathname]);

  useLayoutEffect(() => {
    history.scrollRestoration = "manual";
    return () => {
      history.scrollRestoration = "auto";
    };
  }, []);

  return null;
}
