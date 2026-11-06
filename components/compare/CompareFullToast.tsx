"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useAppStore } from "@/lib/store";

export function CompareFullToast() {
  const { t } = useLanguage();
  const reduceMotion = useReducedMotion();
  const open = useAppStore((state) => state.compareFullToast);
  const dismiss = useAppStore((state) => state.dismissCompareFullToast);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(dismiss, 3500);
    return () => window.clearTimeout(timer);
  }, [dismiss, open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
          transition={{ duration: reduceMotion ? 0.12 : 0.2 }}
          className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] left-1/2 z-[90] -translate-x-1/2 rounded-full bg-[var(--text-primary)] px-4 py-3 text-center text-sm text-[var(--background)] shadow-lg"
        >
          {t("compare.fullToast")}
        </motion.div>
      )}
    </AnimatePresence>
  );
}