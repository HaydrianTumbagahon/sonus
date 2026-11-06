type WaveVariant = "learn" | "showroom" | "compare" | "footer" | "sectionA" | "sectionB" | "sectionC";

const paths: Record<WaveVariant, { viewBox: string; lines: { d: string; stroke: string; opacity: number }[] }> = {
  learn: {
    viewBox: "0 0 1440 240",
    lines: [
      { d: "M0 120 C 200 40, 380 40, 560 110 S 920 200, 1100 120 S 1340 50, 1440 90", stroke: "var(--brand-text)", opacity: 0.55 },
      { d: "M0 150 C 220 210, 420 200, 600 140 S 960 40, 1160 110 S 1380 190, 1440 160", stroke: "var(--brand)", opacity: 0.9 },
      { d: "M0 90 C 180 120, 360 190, 560 160 S 900 60, 1120 80 S 1360 140, 1440 120", stroke: "var(--brand-text)", opacity: 0.35 },
      { d: "M0 180 C 260 120, 440 60, 700 100 S 1100 190, 1440 70", stroke: "var(--brand)", opacity: 0.6 },
      { d: "M0 60 C 240 100, 480 150, 720 120 S 1160 40, 1440 130", stroke: "var(--brand-text)", opacity: 0.25 },
    ],
  },
  showroom: {
    viewBox: "0 0 1440 240",
    lines: [
      { d: "M0 70 C 240 160, 480 190, 720 110 S 1180 20, 1440 100", stroke: "var(--brand-text)", opacity: 0.55 },
      { d: "M0 130 C 200 60, 460 30, 700 90 S 1120 210, 1440 140", stroke: "var(--brand)", opacity: 0.9 },
      { d: "M0 190 C 300 130, 560 120, 800 170 S 1240 220, 1440 150", stroke: "var(--brand-text)", opacity: 0.35 },
      { d: "M0 40 C 320 80, 520 140, 760 70 S 1200 60, 1440 30", stroke: "var(--brand)", opacity: 0.6 },
    ],
  },
  compare: {
    viewBox: "0 0 1440 240",
    lines: [
      { d: "M0 100 C 240 20, 480 20, 720 100 S 1200 180, 1440 100", stroke: "var(--brand-text)", opacity: 0.55 },
      { d: "M0 140 C 240 220, 480 220, 720 140 S 1200 60, 1440 140", stroke: "var(--brand)", opacity: 0.9 },
      { d: "M0 120 C 360 120, 540 40, 900 120 S 1260 200, 1440 170", stroke: "var(--brand-text)", opacity: 0.35 },
      { d: "M0 200 C 300 160, 600 190, 900 150 S 1250 90, 1440 60", stroke: "var(--brand)", opacity: 0.6 },
      { d: "M0 50 C 300 90, 560 70, 860 60 S 1260 100, 1440 80", stroke: "var(--brand-text)", opacity: 0.25 },
    ],
  },
  footer: {
    viewBox: "0 0 1440 400",
    lines: [
      { d: "M-40 380 C 300 340, 520 120, 860 150 S 1280 60, 1500 -20", stroke: "var(--on-brand)", opacity: 0.35 },
      { d: "M-40 320 C 280 300, 560 200, 840 220 S 1260 120, 1500 40", stroke: "var(--on-brand)", opacity: 0.25 },
      { d: "M-40 260 C 320 280, 600 80, 900 90 S 1300 140, 1500 100", stroke: "var(--on-brand)", opacity: 0.18 },
      { d: "M-40 400 C 360 360, 640 280, 980 260 S 1340 200, 1500 160", stroke: "var(--on-brand)", opacity: 0.12 },
    ],
  },
  sectionA: {
    viewBox: "0 0 1440 600",
    lines: [
      { d: "M0 120 C 260 40, 520 60, 760 160 S 1200 300, 1440 200", stroke: "var(--brand-text)", opacity: 0.55 * 0.45 },
      { d: "M0 260 C 240 340, 520 380, 800 300 S 1220 140, 1440 220", stroke: "var(--brand)", opacity: 0.9 * 0.45 },
      { d: "M0 420 C 300 360, 560 330, 840 400 S 1260 520, 1440 450", stroke: "var(--brand-text)", opacity: 0.35 * 0.45 },
    ],
  },
  sectionB: {
    viewBox: "0 0 1440 600",
    lines: [
      { d: "M0 300 C 180 180, 360 180, 540 300 S 900 420, 1080 300 S 1320 200, 1440 260", stroke: "var(--brand-text)", opacity: 0.55 * 0.45 },
      { d: "M0 380 C 200 280, 380 290, 560 380 S 920 500, 1100 390 S 1340 300, 1440 340", stroke: "var(--brand)", opacity: 0.9 * 0.45 },
      { d: "M0 200 C 220 120, 400 130, 600 210 S 960 300, 1140 210 S 1360 130, 1440 170", stroke: "var(--brand-text)", opacity: 0.35 * 0.45 },
      { d: "M0 470 C 220 400, 420 410, 620 470 S 980 560, 1160 480 S 1360 420, 1440 450", stroke: "var(--brand)", opacity: 0.6 * 0.45 },
    ],
  },
  sectionC: {
    viewBox: "0 0 1440 600",
    lines: [
      { d: "M0 500 C 300 460, 500 260, 800 240 S 1240 120, 1440 60", stroke: "var(--brand-text)", opacity: 0.55 * 0.45 },
      { d: "M0 560 C 340 520, 560 340, 860 330 S 1260 220, 1440 160", stroke: "var(--brand)", opacity: 0.9 * 0.45 },
      { d: "M0 420 C 280 380, 520 200, 820 160 S 1240 60, 1440 -10", stroke: "var(--brand-text)", opacity: 0.35 * 0.45 },
    ],
  },
};

export function WaveLines({ variant, className = "" }: { variant: WaveVariant; className?: string }) {
  const { viewBox, lines } = paths[variant];
  const sectionVariant = variant.startsWith("section");

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="none"
      viewBox={viewBox}
      className={`absolute inset-0 h-full w-full pointer-events-none ${className}`}
      fill="none"
    >
      {lines.map((line, index) => (
        <path
          key={index}
          d={line.d}
          stroke={line.stroke}
          opacity={line.opacity}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          strokeWidth={sectionVariant ? 1.2 : 1.5}
        />
      ))}
    </svg>
  );
}
