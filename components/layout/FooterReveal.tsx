"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";
import { revealEase, revealInitial, revealAnimate } from "@/lib/motion";

export function FooterReveal({
  children,
  className = "",
  index = 0,
  style,
}: {
  children: ReactNode;
  className?: string;
  index?: number;
  style?: CSSProperties;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      style={style}
      initial={reduceMotion ? false : revealInitial}
      whileInView={revealAnimate}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, delay: reduceMotion ? 0 : index * 0.08, ease: revealEase }}
    >
      {children}
    </motion.div>
  );
}