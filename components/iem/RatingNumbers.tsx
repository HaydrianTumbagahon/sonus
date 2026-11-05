"use client";

import { useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { formatRating } from "@/lib/format";

const ratingFields = ["build", "value", "sound"] as const;

export function AnimatedRatingNumber({
  value,
  delay = 0,
  enabled = true,
  valueClassName = "text-xl text-primary",
}: {
  value?: number;
  delay?: number;
  enabled?: boolean;
  valueClassName?: string;
}) {
  const { t } = useLanguage();
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const played = useRef(false);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const valid = typeof value === "number" && Number.isFinite(value);
  const target = valid ? Math.round(Math.min(10, Math.max(0, value)) * 10) / 10 : 0;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!enabled || !inView || !valid || played.current) return;
    played.current = true;
    if (reduceMotion) {
      setDisplayValue(target);
      return;
    }

    let frame = 0;
    const start = performance.now() + delay;
    const tick = (now: number) => {
      if (now < start) {
        frame = requestAnimationFrame(tick);
        return;
      }
      const progress = Math.min(1, (now - start) / 800);
      const eased = 1 - (1 - progress) ** 3;
      setDisplayValue(Math.round(target * eased * 10) / 10);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [delay, enabled, inView, reduceMotion, target, valid]);

  if (!valid) return <span className="font-mono text-sm text-secondary">{t("common.notAvailable")}</span>;

  return (
    <span ref={ref} className="inline-flex items-baseline gap-1 font-mono">
      <span className={`font-mono font-medium ${valueClassName}`}>{formatRating(displayValue)}</span>
      <span className="text-xs font-normal text-tertiary">/10</span>
    </span>
  );
}

export function RatingSummary({
  ratings,
  enabled = true,
}: {
  ratings?: Record<string, number>;
  enabled?: boolean;
}) {
  const { t } = useLanguage();
  const values = ratingFields.map((field) => ratings?.[field]);
  const hasAllRatings = values.every((value): value is number => typeof value === "number" && Number.isFinite(value));
  const overall = hasAllRatings ? values.reduce((sum, value) => sum + value, 0) / ratingFields.length : undefined;

  return (
    <>
      <dl className="grid grid-cols-1 gap-x-4 gap-y-3 min-[420px]:grid-cols-3">
        {ratingFields.map((field, index) => (
          <div key={field} className="min-w-0 space-y-1">
            <dt className="truncate text-sm text-secondary">{t(`rating.${field}`)}</dt>
            <dd><AnimatedRatingNumber value={ratings?.[field]} delay={index * 100} enabled={enabled} /></dd>
          </div>
        ))}
      </dl>
      <dl className="border-t border-border pt-3">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-sm text-secondary">{t("rating.overall")}</dt>
          <dd><AnimatedRatingNumber value={overall} delay={ratingFields.length * 100} enabled={enabled} valueClassName="text-2xl text-accent" /></dd>
        </div>
      </dl>
    </>
  );
}