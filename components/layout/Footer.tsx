"use client";

import Link from "next/link";
import { useLanguage } from "@/components/providers/LanguageProvider";

const navigation = [
  { href: "/learn", key: "nav.learn" },
  { href: "/showroom", key: "nav.showroom" },
  { href: "/compare", key: "nav.compare" },
  { href: "/settings", key: "nav.settings" },
] as const;

export function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface px-6 py-10 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-10">
      <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-2">
        <div className="space-y-2">
          <Link href="/" className="inline-flex min-h-11 items-center text-lg font-semibold text-primary">
            Sonus
          </Link>
          <p className="text-sm font-medium text-primary">{t("footer.tagline")}</p>
          <p className="max-w-md text-sm text-secondary">{t("footer.description")}</p>
        </div>
        <nav aria-label={t("footer.about")} className="flex flex-wrap content-start gap-x-6 gap-y-2">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex min-h-11 items-center text-sm text-secondary hover:text-primary"
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>
        <div className="space-y-2 border-t border-border pt-5 text-xs text-tertiary sm:col-span-2">
          <p>{t("footer.credit")}</p>
          <p>{t("footer.copyright").replace("{year}", String(year))}</p>
        </div>
      </div>
    </footer>
  );
}