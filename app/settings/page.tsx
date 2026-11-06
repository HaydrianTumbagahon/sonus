"use client";

import { SettingsContent } from "@/components/layout/SettingsPanel";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { PageBand } from "@/components/layout/PageBand";

export default function SettingsPage() {
  const { t } = useLanguage();

  return <>
    <PageBand size="compact" outlineWord="SETTINGS">
      <h1 className="origin-left text-[clamp(2rem,5vw,4rem)] font-normal uppercase leading-[0.9] text-primary [font-family:var(--font-anton),var(--font-family-sans)] [transform:skewX(-12deg)] [text-shadow:4px_4px_0_color-mix(in_srgb,var(--brand-text)_60%,transparent)]">{t("settings.title")}</h1>
    </PageBand>
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-10">
      <SettingsContent />
    </div>
  </>;
}