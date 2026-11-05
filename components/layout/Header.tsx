"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Search, Settings } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { useAppStore } from "@/lib/store";
import { useLanguage } from "@/components/providers/LanguageProvider";

const navigation = [
  { href: "/learn", key: "nav.learn" },
  { href: "/showroom", key: "nav.showroom" },
  { href: "/compare", key: "nav.compare" },
] as const;

type Ripple = { x: number; y: number; id: number };

function makeRipple(event: PointerEvent<HTMLElement>): Ripple {
  const bounds = event.currentTarget.getBoundingClientRect();
  return { x: event.clientX - bounds.left, y: event.clientY - bounds.top, id: Date.now() };
}

function BrandLogo({ condensed = false }: { condensed?: boolean }) {
  const { t } = useLanguage();
  const reduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [ripple, setRipple] = useState<Ripple | null>(null);
  const letters = Array.from("Sonus");

  return (
    <Link
      href="/"
      aria-label={t("nav.home")}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onPointerDown={(event) => {
        if (!reduceMotion) setRipple(makeRipple(event));
      }}
      className="relative inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-2 text-primary focus-visible:outline-offset-2"
    >
      <motion.span whileTap={reduceMotion ? undefined : { scale: 0.94 }} className="relative z-10 inline-flex items-center gap-2 overflow-hidden rounded-full">
        <svg aria-hidden="true" viewBox="0 0 36 24" className={condensed ? "h-5 w-7" : "h-6 w-8"} fill="none">
          <motion.path
            d="M1 15.5C4.8 15.5 4.8 13.8 7.3 13.8C9.6 13.8 9.9 18.5 12.5 18.5C15.1 18.5 15.2 5.5 18.2 5.5C21.1 5.5 21.3 11 24.1 11C27 11 27 7.5 29.4 7.5C31.5 7.5 32.8 10.5 35 10.5"
            stroke="var(--graph-1)"
            strokeWidth="2"
            strokeLinecap="round"
            initial={reduceMotion ? false : { pathLength: 0.42 }}
            animate={{ pathLength: reduceMotion ? 1 : hovered ? 1 : 0.42 }}
            transition={reduceMotion ? { duration: 0.15 } : { duration: 0.55, ease: "easeInOut" }}
          />
        </svg>
        <span className={`relative inline-flex font-semibold ${condensed ? "text-sm" : "text-base"}`}>
          {letters.map((letter, index) => (
            <motion.span
              key={`${letter}-${index}`}
              animate={{ y: !reduceMotion && hovered ? -1.5 : 0 }}
              transition={{ duration: reduceMotion ? 0.12 : 0.22, delay: reduceMotion ? 0 : hovered ? index * 0.025 : (letters.length - index) * 0.012, ease: "easeOut" }}
            >
              {letter}
            </motion.span>
          ))}
        </span>
        <AnimatePresence>
          {ripple && (
            <motion.span
              key={ripple.id}
              aria-hidden="true"
              className="pointer-events-none absolute size-8 rounded-full bg-accent/20"
              style={{ left: ripple.x, top: ripple.y, translateX: "-50%", translateY: "-50%" }}
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ scale: 2.8, opacity: 0 }}
              transition={{ duration: 0.48, ease: "easeOut" }}
              onAnimationComplete={() => setRipple(null)}
            />
          )}
        </AnimatePresence>
      </motion.span>
    </Link>
  );
}

function IconAction({
  label,
  kind,
  onClick,
  condensed,
}: {
  label: string;
  kind: "search" | "settings";
  onClick: () => void;
  condensed?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const [ripple, setRipple] = useState<Ripple | null>(null);
  const Icon = kind === "search" ? Search : Settings;

  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={onClick}
      onPointerDown={(event) => {
        if (!reduceMotion) setRipple(makeRipple(event));
      }}
      whileTap={reduceMotion ? undefined : { scale: 0.94 }}
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full text-secondary transition-colors hover:bg-surface-subtle hover:text-primary focus-visible:outline-offset-2 ${condensed ? "size-9" : "size-11"}`}
    >
      <motion.span
        aria-hidden="true"
        whileHover={reduceMotion ? undefined : kind === "search" ? { scale: 1.08 } : { rotate: 90 }}
        transition={{ duration: reduceMotion ? 0 : 0.22, ease: "easeOut" }}
        className="relative z-10 inline-flex"
      >
        <Icon className="size-[1.125rem]" />
      </motion.span>
      <AnimatePresence>
        {ripple && (
          <motion.span
            key={ripple.id}
            aria-hidden="true"
            className="pointer-events-none absolute size-8 rounded-full bg-accent/20"
            style={{ left: ripple.x, top: ripple.y, translateX: "-50%", translateY: "-50%" }}
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 2.8, opacity: 0 }}
            transition={{ duration: 0.48, ease: "easeOut" }}
            onAnimationComplete={() => setRipple(null)}
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function IslandNavLink({
  href,
  label,
  active,
  highlighted,
  onHover,
  compareCount,
  condensed,
}: {
  href: string;
  label: string;
  active: boolean;
  highlighted: boolean;
  onHover: (href: string | null) => void;
  compareCount?: number;
  condensed: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [ripple, setRipple] = useState<Ripple | null>(null);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      onPointerEnter={() => onHover(href)}
      onPointerLeave={() => { onHover(null); setOffset({ x: 0, y: 0 }); }}
      onPointerMove={(event) => {
        if (reduceMotion || event.pointerType !== "mouse") return;
        const bounds = event.currentTarget.getBoundingClientRect();
        setOffset({ x: Math.max(-4, Math.min(4, (event.clientX - (bounds.left + bounds.width / 2)) * 0.08)), y: Math.max(-4, Math.min(4, (event.clientY - (bounds.top + bounds.height / 2)) * 0.08)) });
      }}
      onPointerDown={(event) => {
        if (!reduceMotion) setRipple(makeRipple(event));
      }}
      className={`relative inline-flex min-h-11 items-center justify-center rounded-full px-3 focus-visible:outline-offset-2 ${condensed ? "text-[13px]" : "text-sm"} ${active || highlighted ? "text-primary" : "text-secondary hover:text-primary"}`}
    >
      {highlighted && (
        <motion.span
          layoutId="sonus-desktop-nav-highlight"
          aria-hidden="true"
          className={`absolute inset-0 rounded-full ${active ? "bg-accent-muted/75" : "bg-surface-subtle"}`}
          transition={{ type: "spring", stiffness: 430, damping: 34 }}
        />
      )}
      <motion.span
        animate={{ x: offset.x, y: offset.y }}
        whileTap={reduceMotion ? undefined : { scale: 0.94 }}
        transition={{ type: "spring", stiffness: 420, damping: 28, mass: 0.35 }}
        className="relative z-10 inline-flex items-center gap-1.5 overflow-hidden rounded-full"
      >
        <span>{label}</span>
        {typeof compareCount === "number" && compareCount > 0 && (
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={compareCount}
              aria-label={`${label} ${compareCount}`}
              initial={reduceMotion ? false : { scale: 0.65 }}
              animate={{ scale: 1 }}
              exit={reduceMotion ? undefined : { scale: 0.65 }}
              transition={{ type: "spring", stiffness: 560, damping: 25 }}
              className="inline-flex min-w-5 items-center justify-center rounded-full bg-accent-muted px-1.5 text-[10px] font-semibold leading-4 text-primary"
            >
              {compareCount}
            </motion.span>
          </AnimatePresence>
        )}
        {active && <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />}
        <AnimatePresence>
          {ripple && (
            <motion.span
              key={ripple.id}
              aria-hidden="true"
              className="pointer-events-none absolute size-8 rounded-full bg-accent/20"
              style={{ left: ripple.x, top: ripple.y, translateX: "-50%", translateY: "-50%" }}
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ scale: 2.8, opacity: 0 }}
              transition={{ duration: 0.48, ease: "easeOut" }}
              onAnimationComplete={() => setRipple(null)}
            />
          )}
        </AnimatePresence>
      </motion.span>
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const compareCount = useAppStore((state) => state.compareList.length);
  const setSearchOpen = useAppStore((state) => state.setSearchOpen);
  const setSettingsOpen = useAppStore((state) => state.setSettingsOpen);
  const searchOpen = useAppStore((state) => state.searchOpen);
  const settingsOpen = useAppStore((state) => state.settingsOpen);
  const reduceMotion = useReducedMotion();
  const previousScroll = useRef({ y: 0, at: 0 });
  const headerRef = useRef<HTMLElement>(null);
  const tabRef = useRef<HTMLButtonElement>(null);
  const pointerInside = useRef(false);
  const standbyRef = useRef(false);
  const mobileRef = useRef(false);
  const touchStartY = useRef<number | null>(null);
  const inactivityTimer = useRef<number | null>(null);
  const revealTimer = useRef<number | null>(null);
  const actionsRef = useRef<{ collapse: (force?: boolean) => void; collapseOnScroll: () => void; expand: () => void; schedule: (delay: number) => void }>({
    collapse: () => {},
    collapseOnScroll: () => {},
    expand: () => {},
    schedule: () => {},
  });
  const [condensed, setCondensed] = useState(false);
  const [standby, setStandby] = useState(false);
  const [linksVisible, setLinksVisible] = useState(true);
  const [revealFromStandby, setRevealFromStandby] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [tabHovered, setTabHovered] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  standbyRef.current = standby;
  mobileRef.current = isMobile;

  const clearTimer = (timer: { current: number | null }) => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const clearTimers = () => {
    clearTimer(inactivityTimer);
    clearTimer(revealTimer);
  };

  const isProtected = () =>
    pointerInside.current ||
    Boolean(headerRef.current?.contains(document.activeElement)) ||
    searchOpen ||
    settingsOpen;

  const expandHeader = () => {
    clearTimers();
    if (!standbyRef.current) {
      setLinksVisible(true);
      return;
    }
    const tabHadFocus = document.activeElement === tabRef.current;
    setRevealFromStandby(true);
    setStandby(false);
    setLinksVisible(false);
    revealTimer.current = window.setTimeout(() => {
      setLinksVisible(true);
      if (tabHadFocus) {
        headerRef.current?.querySelector<HTMLElement>('nav a[aria-current="page"]')?.focus();
      }
    }, reduceMotion ? 0 : 240);
  };

  const collapseHeader = (force = false) => {
    clearTimer(inactivityTimer);
    if (standbyRef.current || window.scrollY <= 1 || searchOpen || settingsOpen || (!force && isProtected())) return;
    setLinksVisible(false);
    setRevealFromStandby(false);
    setStandby(true);
  };

  const collapseOnScroll = () => {
    if (headerRef.current?.contains(document.activeElement)) return;
    collapseHeader(true);
  };

  const scheduleCollapse = (delay: number) => {
    clearTimer(inactivityTimer);
    inactivityTimer.current = window.setTimeout(() => actionsRef.current.collapse(), delay);
  };

  actionsRef.current = { collapse: collapseHeader, collapseOnScroll, expand: expandHeader, schedule: scheduleCollapse };

  useEffect(() => {
    void useAppStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateViewport = () => {
      const mobile = mediaQuery.matches;
      mobileRef.current = mobile;
      setIsMobile(mobile);
      if (!headerRef.current?.matches(":hover")) {
        actionsRef.current.schedule(mobile ? 4000 : 1500);
      }
    };

    const handleScroll = () => {
      const currentY = window.scrollY;
      const currentAt = performance.now();
      const deltaY = currentY - previousScroll.current.y;
      setCondensed(currentY > 80);
      if (currentY <= 1 && standbyRef.current) actionsRef.current.expand();
      else if (currentY > 80 && deltaY > 0) actionsRef.current.collapseOnScroll();

      previousScroll.current = { y: currentY, at: currentAt };
    };

    const handleOutsidePointer = (event: globalThis.PointerEvent) => {
      if (!mediaQuery.matches || !headerRef.current || headerRef.current.contains(event.target as Node)) return;
      window.setTimeout(() => actionsRef.current.collapse(), 0);
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (!mediaQuery.matches || window.scrollY > 1 || event.touches.length !== 1) return;
      touchStartY.current = event.touches[0].clientY;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!mediaQuery.matches || !standbyRef.current || touchStartY.current === null || event.touches.length !== 1) return;
      if (event.touches[0].clientY - touchStartY.current >= 40) {
        touchStartY.current = null;
        actionsRef.current.expand();
      }
    };

    const clearTouch = () => { touchStartY.current = null; };

    updateViewport();
    previousScroll.current = { y: window.scrollY, at: performance.now() };
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("pointerdown", handleOutsidePointer, true);
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", clearTouch, { passive: true });
    document.addEventListener("touchcancel", clearTouch, { passive: true });
    mediaQuery.addEventListener("change", updateViewport);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("pointerdown", handleOutsidePointer, true);
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", clearTouch);
      document.removeEventListener("touchcancel", clearTouch);
      mediaQuery.removeEventListener("change", updateViewport);
      for (const timer of [inactivityTimer, revealTimer]) {
        if (timer.current !== null) {
          window.clearTimeout(timer.current);
          timer.current = null;
        }
      }
    };
  }, []);

  useEffect(() => {
    if (searchOpen || settingsOpen) actionsRef.current.expand();
    else if (!standbyRef.current) actionsRef.current.schedule(mobileRef.current ? 4000 : 1500);
  }, [searchOpen, settingsOpen]);

  const activeHref = navigation.find(({ href }) => href === "/learn" ? pathname.startsWith(href) : pathname === href)?.href ?? null;

  return (
    <header
      ref={headerRef}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") {
          pointerInside.current = true;
          clearTimer(inactivityTimer);
          setLinksVisible(true);
        } else if (mobileRef.current) {
          scheduleCollapse(4000);
        }
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") pointerInside.current = false;
        scheduleCollapse(mobileRef.current ? 4000 : 1500);
      }}
      onPointerDown={() => {
        if (mobileRef.current) scheduleCollapse(4000);
      }}
      onFocusCapture={() => {
        clearTimer(inactivityTimer);
        if (!standbyRef.current) setLinksVisible(true);
      }}
      onBlurCapture={(event) => {
        if (!headerRef.current?.contains(event.relatedTarget as Node | null)) {
          scheduleCollapse(mobileRef.current ? 4000 : 1500);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !standbyRef.current && headerRef.current?.contains(document.activeElement) && !searchOpen && !settingsOpen) {
          event.preventDefault();
          collapseHeader(true);
          window.setTimeout(() => tabRef.current?.focus(), reduceMotion ? 0 : 520);
        }
      }}
      className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center px-3"
    >
      <motion.div
        initial={reduceMotion ? { opacity: 0, y: 0, scale: 1 } : { opacity: 0, y: -12, scale: 0.98 }}
        animate={reduceMotion
          ? { opacity: standby ? 0 : 1, y: 0, scaleX: 1, scaleY: 1 }
          : standby
            ? { opacity: 0, scaleX: 0.3, scaleY: 0.18, y: -14, borderRadius: "28px 28px 999px 999px" }
            : { opacity: 1, scaleX: 1, scaleY: 1, y: 0, borderRadius: "9999px" }}
        transition={reduceMotion
          ? { duration: 0.14, ease: "easeOut" }
          : standby
            ? { duration: 0.18, ease: [0.4, 0, 0.2, 1] }
            : revealFromStandby
              ? { type: "spring", stiffness: 380, damping: 14, mass: 0.9 }
              : { type: "spring", stiffness: 360, damping: 32 }}
        onAnimationComplete={() => {
          if (!standby && revealFromStandby) setRevealFromStandby(false);
        }}
        style={{ transformOrigin: "top center", borderRadius: reduceMotion ? (standby ? "28px 28px 999px 999px" : "9999px") : undefined }}
        aria-hidden={standby || !linksVisible}
        inert={standby || !linksVisible}
        className={`pointer-events-auto mt-3 flex items-center rounded-full border border-border/80 bg-background/80 shadow-lg backdrop-blur-xl sm:mt-4 ${condensed ? "gap-1 px-2 py-1.5" : "gap-2 px-2.5 py-2"}`}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: linksVisible ? 1 : 0 }}
          transition={{ duration: reduceMotion ? 0.12 : 0.12, delay: linksVisible && revealFromStandby && !reduceMotion ? 0.14 : 0 }}
          className={`flex items-center ${linksVisible ? "" : "pointer-events-none"}`}
        >
          <div className="hidden items-center gap-0.5 md:flex">
            <BrandLogo condensed={condensed} />
            <nav aria-label={t("nav.home")} onPointerLeave={() => setHovered(null)} className="flex items-center gap-0.5">
              {navigation.map((item, index) => {
                const active = activeHref === item.href;
                const highlighted = hovered === item.href || (hovered === null && active);
                return (
                  <motion.div
                    key={item.href}
                    initial={false}
                    animate={{ opacity: linksVisible ? 1 : 0, y: linksVisible ? 0 : -3 }}
                    transition={{ duration: reduceMotion ? 0.12 : 0.14, delay: linksVisible && revealFromStandby && !reduceMotion ? 0.14 + index * 0.035 : 0 }}
                  >
                    <IslandNavLink
                      href={item.href}
                      label={t(item.key)}
                      active={active}
                      highlighted={highlighted}
                      onHover={setHovered}
                      compareCount={item.href === "/compare" ? compareCount : undefined}
                      condensed={condensed}
                    />
                  </motion.div>
                );
              })}
            </nav>
            <span aria-hidden="true" className="mx-1 h-6 w-px bg-border" />
            <IconAction label={t("common.search")} kind="search" condensed={condensed} onClick={() => setSearchOpen(true)} />
            <IconAction label={t("common.openSettings")} kind="settings" condensed={condensed} onClick={() => setSettingsOpen(true)} />
          </div>

          <div className="flex items-center gap-1 md:hidden">
            <BrandLogo condensed />
            <IconAction label={t("common.search")} kind="search" condensed onClick={() => setSearchOpen(true)} />
            <IconAction label={t("common.openSettings")} kind="settings" condensed onClick={() => setSettingsOpen(true)} />
          </div>
        </motion.div>
      </motion.div>

      <motion.button
        ref={tabRef}
        type="button"
        aria-label={t("header.showNavigation")}
        aria-expanded={!standby}
        aria-hidden={!standby}
        tabIndex={standby ? 0 : -1}
        onPointerEnter={(event) => {
          setTabHovered(true);
          if (event.pointerType === "mouse" && standbyRef.current) actionsRef.current.expand();
        }}
        onPointerLeave={() => setTabHovered(false)}
        onClick={expandHeader}
        animate={{ opacity: standby ? 1 : 0, scale: reduceMotion ? 1 : standby ? 1 : 0.75 }}
        transition={{ duration: reduceMotion ? 0.12 : standby ? 0.16 : 0.12, ease: "easeOut" }}
        style={{ pointerEvents: standby ? "auto" : "none", transformOrigin: "top center" }}
        className="absolute left-1/2 top-0 inline-flex min-h-11 w-16 -translate-x-1/2 items-start justify-center focus-visible:outline-offset-2"
      >
        <span aria-hidden="true" className="absolute left-1/2 top-0 flex h-7 w-14 -translate-x-1/2 items-center justify-center rounded-b-full border-x border-b border-t-0 border-border/80 bg-background/80 shadow-lg backdrop-blur-xl">
          <motion.span
            animate={reduceMotion || tabHovered ? { y: 0 } : { y: [0, 2, 0] }}
            transition={reduceMotion || tabHovered ? { duration: 0.15 } : { duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="size-4 text-secondary" />
          </motion.span>
        </span>
      </motion.button>
    </header>
  );
}