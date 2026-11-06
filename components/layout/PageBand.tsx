import type { ReactNode } from "react";

type PageBandProps = {
  children: ReactNode;
  outlineWord?: string;
  size?: "default" | "compact";
  tone?: "brand" | "plain";
};

export function PageBand({ children, outlineWord, size = "default", tone = "plain" }: PageBandProps) {
  const compact = size === "compact";
  const brandTone = tone === "brand";

  if (brandTone) {
    return (
      <section
        className="relative isolate w-full"
        style={{
          background: "var(--brand)",
          border: 0,
          boxShadow: "none",
          margin: 0,
        }}
      >
        <div className="relative isolate w-full overflow-hidden bg-brand">
          {outlineWord ? (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-4 z-0 select-none whitespace-nowrap sm:left-6"
              style={{
                fontFamily: "var(--font-anton), var(--font-geist-sans), sans-serif",
                fontWeight: 400,
                fontSize: "clamp(96px, 18vw, 220px)",
                color: "transparent",
                WebkitTextStroke: "2px color-mix(in srgb, var(--on-brand) 35%, transparent)",
                textTransform: "uppercase",
                lineHeight: 1,
                bottom: "-0.18em",
                opacity: 0.7,
              }}
            >
              {outlineWord}
            </span>
          ) : null}

          <div
            className="relative z-10 mx-auto w-full max-w-[1280px] px-4 sm:px-6"
            style={{
              paddingTop: "calc(var(--header-offset) + 8px)",
              paddingBottom: compact ? "20px" : "32px",
            }}
          >
            {children}
          </div>
        </div>

        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 1440 100"
          preserveAspectRatio="none"
          className="pointer-events-none absolute left-0 right-0 z-[2] block w-full"
          shapeRendering="geometricPrecision"
          style={{
            top: "calc(100% - 2px)",
            height: "var(--wave-h)",
            fill: "var(--brand)",
            overflow: "visible",
            transform: "translateZ(0)",
            backfaceVisibility: "hidden",
          }}
        >
          <path d="M0 -4H1440V30C1200 90 960 100 720 60S240 -10 0 40Z" />
        </svg>
      </section>
    );
  }

  return (
    <section
      className="relative isolate w-full overflow-hidden"
      style={{
        background: "var(--background)",
        border: 0,
        boxShadow: "none",
        margin: 0,
      }}
    >
      {outlineWord ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-6 left-4 -z-10 select-none whitespace-nowrap leading-none opacity-60"
          style={{
            fontFamily: "var(--font-anton), var(--font-geist-sans), sans-serif",
            fontSize: compact ? "clamp(72px, 14vw, 140px)" : "clamp(96px, 18vw, 220px)",
            color: "transparent",
            WebkitTextStroke: "2px var(--brand-outline)",
            textTransform: "uppercase",
          }}
        >
          {outlineWord}
        </span>
      ) : null}

      <div
        className="relative mx-auto w-full max-w-[1280px] px-4 sm:px-6"
        style={{
          paddingTop: "calc(var(--header-offset) + 8px)",
          paddingBottom: compact ? "20px" : "32px",
        }}
      >
        {children}
      </div>

      <svg
        aria-hidden="true"
        viewBox="0 0 1440 40"
        preserveAspectRatio="none"
        className="block h-6 w-full sm:h-8"
        style={{ marginTop: "-1px" }}
      >
        <path
          d="M0 0C240 40 480 40 720 20S1200 -10 1440 20V40H0Z"
          fill="var(--background)"
        />
      </svg>
    </section>
  );
}