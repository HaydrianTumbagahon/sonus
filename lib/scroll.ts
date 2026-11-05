import { gsap } from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

gsap.registerPlugin(ScrollToPlugin);

type LenisControls = { stop: () => void; start: () => void };
type LenisWindow = Window & { lenis?: LenisControls };
type ScrollOptions = { offset?: number };

let activeTween: gsap.core.Tween | null = null;
let activeCleanup: (() => void) | null = null;
let activeLenis: LenisControls | null = null;

function cancelActiveScroll() {
  const tween = activeTween;
  const cleanup = activeCleanup;
  const lenis = activeLenis;
  activeTween = null;
  activeCleanup = null;
  activeLenis = null;
  cleanup?.();
  tween?.kill();
  lenis?.start();
}

export function scrollToTarget(target: number | HTMLElement, options: ScrollOptions = {}): void {
  if (typeof window === "undefined") return;
  cancelActiveScroll();

  const headerOffset = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-offset")) || 0;
  const targetOffset = options.offset ?? headerOffset + 16;
  const targetY = typeof target === "number"
    ? target
    : target.getBoundingClientRect().top + window.scrollY - targetOffset;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reducedMotion) {
    window.scrollTo(0, Math.max(0, targetY));
    return;
  }

  const lenis = (window as LenisWindow).lenis ?? null;
  lenis?.stop();
  activeLenis = lenis;

  let finished = false;
  let tweenRef: gsap.core.Tween | null = null;
  const cleanup = () => {
    window.removeEventListener("wheel", cancelOnUserInput, true);
    window.removeEventListener("touchstart", cancelOnUserInput, true);
  };
  const finish = () => {
    if (finished) return;
    finished = true;
    cleanup();
    if (activeTween === tweenRef) {
      activeTween = null;
      activeCleanup = null;
      activeLenis = null;
      lenis?.start();
    }
  };
  const cancelOnUserInput = () => {
    if (activeTween === tweenRef) cancelActiveScroll();
  };

  window.addEventListener("wheel", cancelOnUserInput, { capture: true, passive: true });
  window.addEventListener("touchstart", cancelOnUserInput, { capture: true, passive: true });
  activeCleanup = cleanup;

  const distance = Math.abs(targetY - window.scrollY);
  const duration = Math.min(1.8, Math.max(0.9, 0.9 + (distance / 3500) * 0.9));
  const tween = gsap.to(window, {
    duration,
    ease: "back.inOut(1.4)",
    scrollTo: { y: Math.max(0, targetY), autoKill: false },
    onComplete: finish,
    onInterrupt: finish,
  });
  tweenRef = tween;
  activeTween = tween;
}