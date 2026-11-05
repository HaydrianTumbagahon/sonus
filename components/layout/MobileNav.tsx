"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { BookOpen, GitCompareArrows, Headphones, House } from "lucide-react";
import { useState, type PointerEvent } from "react";
import { useAppStore } from "@/lib/store";
import { useLanguage } from "@/components/providers/LanguageProvider";

const navigation = [
  { href: "/", key: "nav.home", Icon: House },
  { href: "/learn", key: "nav.learn", Icon: BookOpen },
  { href: "/showroom", key: "nav.showroom", Icon: Headphones },
  { href: "/compare", key: "nav.compare", Icon: GitCompareArrows },
] as const;

type Ripple = { x: number; y: number; id: number };

function makeRipple(event: PointerEvent<HTMLAnchorElement>): Ripple {
  const bounds = event.currentTarget.getBoundingClientRect();
  return { x: event.clientX - bounds.left, y: event.clientY - bounds.top, id: Date.now() };
}

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const compareCount = useAppStore((state) => state.compareList.length);
  const reduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState<string | null>(null);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : href === "/learn" ? pathname.startsWith(href) : pathname === href;

  return (
    <nav
      aria-label={t("nav.home")}
      className="pointer-events-none fixed inset-x-0 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-3 md:hidden"
    >
      <ul onPointerLeave={() => setHovered(null)} className="pointer-events-auto grid min-h-[3.75rem] w-full max-w-[25rem] grid-cols-4 items-center gap-1 rounded-full border border-border/80 bg-background/85 p-1.5 shadow-lg backdrop-blur-xl">
        {navigation.map(({ href, key, Icon }) => {
          const active = isActive(href);
          const highlighted = hovered === href || (hovered === null && active);
          return (
            <li key={href} className="relative min-w-0">
              <DockLink
                href={href}
                label={t(key)}
                Icon={Icon}
                active={active}
                highlighted={highlighted}
                compareCount={href === "/compare" ? compareCount : 0}
                onHover={setHovered}
                reduceMotion={Boolean(reduceMotion)}
              />
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function DockLink({
  href,
  label,
  Icon,
  active,
  highlighted,
  compareCount,
  onHover,
  reduceMotion,
}: {
  href: string;
  label: string;
  Icon: (typeof navigation)[number]["Icon"];
  active: boolean;
  highlighted: boolean;
  compareCount: number;
  onHover: (href: string | null) => void;
  reduceMotion: boolean;
}) {
  const [ripple, setRipple] = useState<Ripple | null>(null);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      onPointerEnter={() => onHover(href)}
      onPointerLeave={() => onHover(null)}
      onPointerDown={(event) => {
        if (!reduceMotion) setRipple(makeRipple(event));
      }}
      className={`relative flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-full px-1 text-[10px] font-medium focus-visible:outline-offset-2 ${active ? "text-primary" : "text-secondary"}`}
    >
      {highlighted && (
        <motion.span
          layoutId="sonus-mobile-dock-highlight"
          aria-hidden="true"
          className={`absolute inset-0 rounded-full ${active ? "bg-accent-muted/75" : "bg-surface-subtle"}`}
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
        />
      )}
      <motion.span whileTap={reduceMotion ? undefined : { scale: 0.94 }} className="relative z-10 flex min-w-0 flex-col items-center justify-center gap-1">
        <span className="relative inline-flex">
          <Icon aria-hidden="true" className="size-[1.125rem]" />
          {compareCount > 0 && (
            <motion.span
              key={compareCount}
              aria-label={`${label} ${compareCount}`}
              initial={reduceMotion ? false : { scale: 0.6 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 540, damping: 25 }}
              className="absolute -right-2 -top-2 inline-flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] leading-4 text-background"
            >
              {compareCount}
            </motion.span>
          )}
        </span>
        <span className="max-w-full truncate">{label}</span>
      </motion.span>
      {ripple && (
        <motion.span
          key={ripple.id}
          aria-hidden="true"
          className="pointer-events-none absolute size-8 rounded-full bg-accent/20"
          style={{ left: ripple.x, top: ripple.y, translateX: "-50%", translateY: "-50%" }}
          initial={{ scale: 0, opacity: 0.8 }}
          animate={{ scale: 2.8, opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.48, ease: "easeOut" }}
          onAnimationComplete={() => setRipple(null)}
        />
      )}
    </Link>
  );
}