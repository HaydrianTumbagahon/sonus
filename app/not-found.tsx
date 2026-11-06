"use client";

import Link from "next/link";
import { PageBand } from "@/components/layout/PageBand";
import { useLanguage } from "@/components/providers/LanguageProvider";

export default function NotFound() {
  const { t } = useLanguage();
  return (
    <>
      <PageBand size="compact" outlineWord="404">
        <p className="font-mono text-sm text-secondary">404</p>
        <h1 className="origin-left text-[clamp(2rem,5vw,4rem)] font-normal uppercase leading-[0.9] text-primary [font-family:var(--font-anton),var(--font-family-sans)] [transform:skewX(-12deg)] [text-shadow:4px_4px_0_color-mix(in_srgb,var(--brand-text)_60%,transparent)]">
          {t("showroomUi.errorTitle")}
        </h1>
      </PageBand>
      <div className="flex min-h-[50svh] flex-col items-center justify-center px-6 text-center">
      <p className="mt-2 max-w-md text-[var(--text-secondary)]">
        {t("showroomUi.errorDescription")}
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex h-12 items-center rounded-full bg-[var(--brand)] px-6 text-sm font-medium text-[var(--on-brand)]"
      >
        {t("nav.home")}
      </Link>
      </div>
    </>
  );
}