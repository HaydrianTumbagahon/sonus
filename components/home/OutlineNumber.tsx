import type { HTMLAttributes } from "react";

type OutlineNumberProps = HTMLAttributes<HTMLSpanElement> & {
  value: string | number;
};

export function OutlineNumber({ value, className = "", ...props }: OutlineNumberProps) {
  return (
    <span
      {...props}
      className={`block select-none text-[clamp(3rem,8vw,7rem)] uppercase leading-none text-transparent [font-family:var(--font-anton),var(--font-family-sans)] [Webkit-text-stroke:2px_var(--accent-muted)] [text-shadow:0_0_22px_color-mix(in_srgb,var(--accent-muted)_35%,transparent)] ${className}`}
      style={{ opacity: 0.5 }}
    >
      {value}
    </span>
  );
}
