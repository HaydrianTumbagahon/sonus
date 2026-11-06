import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
  children?: ReactNode;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  actionLabel,
  actionHref,
  className = "",
  children,
}: SectionHeadingProps) {
  const titleContent = (
    <h2 className="mt-3 max-w-[12ch] text-[clamp(2.5rem,6vw,6rem)] uppercase leading-[0.9] tracking-[-0.04em] text-primary [transform:skewX(-12deg)] [font-family:var(--font-anton),var(--font-family-sans)]" style={{ textShadow: "4px 4px 0 color-mix(in srgb, var(--accent) 58%, transparent)" }}>
      {title}
    </h2>
  );

  return (
    <div className={`max-w-3xl ${className}`}>
      {eyebrow ? (
        <p className="origin-left -rotate-3 text-base text-secondary [font-family:var(--font-caveat),var(--font-family-sans)] sm:text-2xl">
          {eyebrow}
        </p>
      ) : null}
      {titleContent}
      {description ? <p className="mt-4 max-w-xl text-base leading-7 text-secondary">{description}</p> : null}
      {children}
      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="group mt-7 inline-flex items-center gap-3 rounded-full bg-accent px-4 py-2 text-sm font-medium text-background transition-transform duration-200 active:scale-95 hover:bg-accent-hover focus-visible:outline-offset-4"
        >
          <span>{actionLabel}</span>
          <span className="flex size-8 items-center justify-center rounded-full bg-[color:var(--background)] text-[var(--text-primary)]">
            <ArrowRight aria-hidden="true" className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </Link>
      ) : null}
    </div>
  );
}
