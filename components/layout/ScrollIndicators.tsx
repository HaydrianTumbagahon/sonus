"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";

export function ScrollIndicators() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const springProgress = useSpring(scrollYProgress, {
    stiffness: 160,
    damping: 24,
    mass: 0.2,
  });

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 right-0 top-0 z-[45] h-[3px] bg-border/40"
    >
      <motion.div
        className="h-full origin-left bg-brand-text"
        style={{ scaleX: reduceMotion ? scrollYProgress : springProgress }}
      />
    </motion.div>
  );
}
