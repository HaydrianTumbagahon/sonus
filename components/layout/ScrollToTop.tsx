"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { scrollToTarget } from "@/lib/scroll";

export function ScrollToTop() {
  const { t } = useLanguage();
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => setVisible(window.scrollY > 400);
    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.button
          key="scroll-to-top"
          type="button"
          aria-label={t("scroll.toTop")}
          onClick={() => scrollToTarget(0)}
          initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.82 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.82 }}
          transition={{ duration: reduceMotion ? 0.12 : 0.2, ease: "easeOut" }}
          whileTap={reduceMotion ? undefined : { scale: 0.92 }}
          className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-4 z-40 inline-flex size-12 items-center justify-center rounded-full border border-border bg-surface text-accent shadow-md transition-colors hover:bg-surface-subtle focus-visible:outline-offset-4 md:bottom-6 md:right-6"
        >
          <motion.span whileHover={reduceMotion ? undefined : { y: -2 }} transition={{ duration: 0.16, ease: "easeOut" }}>
            <ArrowUp aria-hidden="true" className="size-5" />
          </motion.span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}