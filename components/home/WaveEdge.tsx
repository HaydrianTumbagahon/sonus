type WaveEdgeProps = {
  position: "top" | "bottom";
  variant?: 1 | 2;
};

export function WaveEdge({ position, variant = 1 }: WaveEdgeProps) {
  const path =
    variant === 2
      ? "M0 30C300 95 600 95 840 45S1250 -5 1440 50V104H0Z"
      : "M0 55C240 0 480 0 720 38S1200 92 1440 30V104H0Z";

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 1440 100"
      preserveAspectRatio="none"
      width="100%"
      shapeRendering="geometricPrecision"
      className="pointer-events-none absolute left-0 right-0 z-[2] block"
      style={{
        height: "var(--wave-h)",
        fill: "var(--brand)",
        top: position === "top" ? "calc(var(--wave-h) * -1 + 2px)" : undefined,
        bottom: position === "bottom" ? "calc(var(--wave-h) * -1 + 2px)" : undefined,
        transform: position === "bottom" ? "scaleY(-1) translateZ(0)" : "translateZ(0)",
        overflow: "visible",
        backfaceVisibility: "hidden",
      }}
    >
      <path d={path} />
    </svg>
  );
}
