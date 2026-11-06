import { motion } from "framer-motion";
import type { CSSProperties } from "react";

type BlobBackdropProps = {
  className?: string;
  position?: { x?: string | number; y?: string | number };
  size?: number | string;
  rotation?: number;
  opacity?: number;
  accentColor?: "accent" | "accent-hover";
  delay?: number;
};

export function BlobBackdrop({
  className = "",
  position = { x: "0%", y: "0%" },
  size = 340,
  rotation = 0,
  opacity = 0.7,
  accentColor = "accent",
  delay = 0,
}: BlobBackdropProps) {
  const fill = accentColor === "accent" ? "var(--accent)" : "var(--accent-hover)";
  const style: CSSProperties = {
    width: typeof size === "number" ? `${size}px` : size,
    height: typeof size === "number" ? `${size}px` : size,
    left: typeof position.x === "number" ? `${position.x}px` : position.x,
    top: typeof position.y === "number" ? `${position.y}px` : position.y,
    transform: `rotate(${rotation}deg)`,
    opacity,
  };

  return (
    <motion.div
      aria-hidden="true"
      className={`pointer-events-none absolute ${className}`}
      style={style}
      animate={{ x: [0, 14, -10, 0], y: [0, -12, 6, 0], rotate: [rotation, rotation + 8, rotation - 6, rotation] }}
      transition={{ duration: 12, ease: "easeInOut", delay, repeat: Infinity, repeatType: "mirror" }}
    >
      <svg viewBox="0 0 420 420" preserveAspectRatio="none" className="h-full w-full" aria-hidden="true">
        <path
          d="M88 62C118 20 173 2 233 19c71 20 127 70 147 132 23 72 4 161-70 206-62 38-149 46-220 3-64-39-110-126-95-201 8-36 41-78 88-95 15-6 31-13 46-20 18-9 11-8 23-25 10-14 36-20 49-29Z"
          fill={fill}
        />
      </svg>
    </motion.div>
  );
}
