"use client";

import { SettingsContent } from "@/components/layout/SettingsPanel";
import { useLanguage } from "@/components/providers/LanguageProvider";

export default function SettingsPage() {
  const { t } = useLanguage();

  return <div className="mx-auto max-w-2xl space-y-6 px-6 py-10">
    <h1 className="text-2xl font-semibold text-primary">{t("settings.title")}</h1>
    <SettingsContent />
  </div>;
}