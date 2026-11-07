"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { revealAnimate, revealEase, revealInitial, revealStagger, revealTransition } from "@/lib/motion";
import { usePageReady } from "@/lib/transition";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  index?: number;
  amount?: number;
};

export function ScrollReveal({ children, className, index = 0, amount = 0.2 }: ScrollRevealProps) {
  const reduceMotion = useReducedMotion();
  const pageReady = usePageReady();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? revealAnimate : revealInitial}
      whileInView={pageReady || reduceMotion ? revealAnimate : revealInitial}
      viewport={{ once: true, amount }}
      transition={{
        ...revealTransition,
        delay: reduceMotion ? 0 : index * revealStagger,
        ease: revealEase,
      }}
    >
      {children}
    </motion.div>
  );
}
