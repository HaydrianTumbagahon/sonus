"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";

export default function ShowroomError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useLanguage();

  return (
    <div role="alert" className="mx-auto flex min-h-[50dvh] max-w-3xl flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <h1 className="text-2xl font-semibold text-primary">{t("showroomUi.errorTitle")}</h1>
      <p className="max-w-xl text-sm leading-6 text-secondary">{t("showroomUi.errorDescription")}</p>
      <button type="button" onClick={reset} className="inline-flex min-h-11 items-center rounded-sm bg-accent px-4 text-sm font-medium text-background hover:bg-accent-hover">
        {t("showroomUi.tryAgain")}
      </button>
    </div>
  );
}