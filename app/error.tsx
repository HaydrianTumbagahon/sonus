"use client";

import { PageBand } from "@/components/layout/PageBand";
import { useLanguage } from "@/components/providers/LanguageProvider";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useLanguage();

  return (
    <>
      <PageBand size="compact" outlineWord="ERROR">
        <h1 className="origin-left text-[clamp(2rem,5vw,4rem)] font-normal uppercase leading-[0.9] text-primary [font-family:var(--font-anton),var(--font-family-sans)] [transform:skewX(-12deg)] [text-shadow:4px_4px_0_color-mix(in_srgb,var(--brand-text)_60%,transparent)]">
          {t("showroomUi.errorTitle")}
        </h1>
      </PageBand>
      <div role="alert" className="mx-auto flex min-h-[50svh] max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-secondary">{error.message || t("showroomUi.errorDescription")}</p>
        <button type="button" onClick={reset} className="min-h-11 rounded-md bg-brand px-5 text-sm font-medium text-on-brand">
          {t("showroomUi.tryAgain")}
        </button>
      </div>
    </>
  );
}