"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Moon, Sun, X } from "lucide-react";
import { Drawer } from "vaul";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useAppStore } from "@/lib/store";

const languageOptions = [
  { value: "en", label: "EN" },
  { value: "jp", label: "JP" },
  { value: "cn", label: "CN" },
] as const;

const upcomingCurrencies = ["EUR", "JPY", "CNY"] as const;

function useDesktopLayout() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  return isDesktop;
}

function SegmentButton({
  active,
  children,
  disabled = false,
  onClick,
  label,
}: {
  active?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`flex min-h-11 flex-1 flex-col items-center justify-center rounded-md px-3 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${active ? "bg-accent text-background" : "text-secondary hover:bg-surface-subtle hover:text-primary"}`}
    >
      {children}
    </button>
  );
}

export function SettingsContent() {
  const { lang, setLang, t } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-7">
      <section aria-labelledby="settings-language" className="space-y-3">
        <h3 id="settings-language" className="text-sm font-medium text-primary">
          {t("settings.language")}
        </h3>
        <div role="group" aria-label={t("settings.language")} className="flex gap-1 rounded-lg border border-border bg-surface-subtle p-1">
          {languageOptions.map((option) => (
            <SegmentButton
              key={option.value}
              label={option.label}
              active={lang === option.value}
              onClick={() => setLang(option.value)}
            >
              {option.label}
            </SegmentButton>
          ))}
        </div>
      </section>

      <section aria-labelledby="settings-currency" className="space-y-3">
        <h3 id="settings-currency" className="text-sm font-medium text-primary">
          {t("settings.currency")}
        </h3>
        <div role="group" aria-label={t("settings.currency")} className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-surface-subtle p-1 sm:grid-cols-4">
          <SegmentButton
            label="USD"
            active={currency === "USD"}
            onClick={() => setCurrency("USD")}
          >
            USD
          </SegmentButton>
          {upcomingCurrencies.map((code) => (
            <SegmentButton
              key={code}
              label={`${code}, ${t("common.comingSoon")}`}
              disabled
            >
              <span>{code}</span>
              <span className="text-[10px] opacity-80">{t("common.comingSoon")}</span>
            </SegmentButton>
          ))}
        </div>
      </section>

      <section aria-labelledby="settings-theme" className="space-y-3">
        <h3 id="settings-theme" className="text-sm font-medium text-primary">
          {t("settings.theme")}
        </h3>
        <div role="group" aria-label={t("settings.theme")} className="flex gap-1 rounded-lg border border-border bg-surface-subtle p-1">
          <SegmentButton
            label={t("settings.light")}
            active={theme === "light"}
            onClick={() => setTheme("light")}
          >
            <span className="flex items-center gap-2"><Sun aria-hidden="true" className="size-4" />{t("settings.light")}</span>
          </SegmentButton>
          <SegmentButton
            label={t("settings.dark")}
            active={theme === "dark"}
            onClick={() => setTheme("dark")}
          >
            <span className="flex items-center gap-2"><Moon aria-hidden="true" className="size-4" />{t("settings.dark")}</span>
          </SegmentButton>
        </div>
      </section>
    </div>
  );
}

export function SettingsPanel() {
  const open = useAppStore((state) => state.settingsOpen);
  const setOpen = useAppStore((state) => state.setSettingsOpen);
  const isDesktop = useDesktopLayout();
  const { t } = useLanguage();

  if (isDesktop) {
    return (
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-background/55 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out" />
          <Dialog.Content className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto border-l border-border bg-background p-6 shadow-lg outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right">
            <div className="mb-8 flex items-center justify-between gap-4">
              <Dialog.Title className="text-xl font-semibold text-primary">
                {t("settings.title")}
              </Dialog.Title>
              <Dialog.Description className="sr-only">{t("settings.appearance")}</Dialog.Description>
              <Dialog.Close asChild>
                <button type="button" aria-label={t("common.close")} className="inline-flex size-11 items-center justify-center rounded-md text-secondary hover:bg-surface-subtle hover:text-primary">
                  <X aria-hidden="true" className="size-5" />
                </button>
              </Dialog.Close>
            </div>
            <SettingsContent />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  return (
    <Drawer.Root open={open} onOpenChange={setOpen} shouldScaleBackground={false}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-background/55 backdrop-blur-sm" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[90dvh] overflow-y-auto rounded-t-xl border-t border-border bg-background px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5 outline-none">
          <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-border" />
          <Drawer.Title className="mb-7 text-xl font-semibold text-primary">
            {t("settings.title")}
          </Drawer.Title>
          <Drawer.Description className="sr-only">{t("settings.appearance")}</Drawer.Description>
          <SettingsContent />
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}