"use client";

import { SunMoon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();

  return (
    <Button
      type="button"
      variant="outline"
      aria-label={t("common.toggleTheme")}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <SunMoon aria-hidden="true" />
      {t("common.toggleTheme")}
    </Button>
  );
}