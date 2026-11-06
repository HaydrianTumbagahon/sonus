import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
  children?: ReactNode;
  eyebrowClassName?: string;
  titleClassName?: string;
  titleStyle?: CSSProperties;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  actionLabel,
  actionHref,
  className = "",
  children,
  eyebrowClassName = "",
  titleClassName = "",
  titleStyle,
}: SectionHeadingProps) {
  const titleContent = (
    <h2
      className={`${eyebrow ? "mt-3" : ""} max-w-[12ch] text-[clamp(2.5rem,6vw,6rem)] uppercase leading-[0.9] tracking-[-0.04em] text-primary [transform:skewX(-12deg)] [font-family:var(--font-anton),var(--font-family-sans)] ${titleClassName}`}
      style={titleStyle ?? { textShadow: "4px 4px 0 color-mix(in srgb, var(--brand-text) 60%, transparent)" }}
    >
      {title}
    </h2>
  );

  return (
    <div className={`max-w-3xl ${className}`}>
      {eyebrow ? (
        <p className={`origin-left -rotate-3 text-base text-secondary [font-family:var(--font-caveat),var(--font-family-sans)] sm:text-2xl ${eyebrowClassName}`}>
          {eyebrow}
        </p>
      ) : null}
      {titleContent}
      {description ? <p className="mt-4 max-w-xl text-base leading-7 text-secondary">{description}</p> : null}
      {children}
      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="group mt-7 inline-flex min-h-11 items-center gap-3 rounded-full bg-brand px-4 py-2 text-sm text-on-brand transition-[background-color,transform] duration-200 active:scale-96 hover:bg-brand-hover focus-visible:outline-offset-4"
        >
          <span>{actionLabel}</span>
          <ArrowRight aria-hidden="true" className="size-[18px] shrink-0 transition-transform duration-200 group-hover:translate-x-[3px]" strokeWidth={2} />
        </Link>
      ) : null}
    </div>
  );
}
