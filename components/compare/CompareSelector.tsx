"use client";

import Fuse from "fuse.js";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { Drawer } from "vaul";
import { useMemo, useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { compareColor } from "@/components/compare/colors";
import type { IEM } from "@/types/iem";

type Props = {
  allIems: IEM[];
  selectedIems: IEM[];
  onAdd: (slug: string) => void;
  onRemove: (slug: string) => void;
};

function SearchSelect({
  allIems,
  selectedIems,
  onAdd,
  onRemove,
  id,
}: Props & { id: string }) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const fuse = useMemo(() => new Fuse(allIems, {
    keys: ["name", "brand", "driverType", "tags", "materials"],
    threshold: 0.35,
    ignoreLocation: true,
  }), [allIems]);
  const results = query.trim()
    ? fuse.search(query.trim()).map((result) => result.item)
    : allIems;
  const selectedSlugs = new Set(selectedIems.map((item) => item.slug));
  const atLimit = selectedIems.length >= 6;
  const selectLabel = t("compare.selectIems").replace("{count}", String(selectedIems.length));

  return (
    <div className="space-y-3">
      <label htmlFor={`${id}-search`} className="sr-only">{t("compare.searchPlaceholder")}</label>
      <input
        id={`${id}-search`}
        type="search"
        role="combobox"
        aria-expanded={results.length > 0}
        aria-controls={`${id}-options`}
        aria-autocomplete="list"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t("compare.searchPlaceholder")}
        className="min-h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-primary placeholder:text-tertiary focus-visible:border-accent"
      />
      <ul id={`${id}-options`} role="listbox" aria-label={selectLabel} className="max-h-80 space-y-1 overflow-y-auto">
        {results.length > 0 ? results.map((iem) => {
          const selected = selectedSlugs.has(iem.slug);
          const disabled = atLimit && !selected;
          return (
            <li key={iem.slug} role="none">
              <button
                type="button"
                role="option"
                aria-selected={selected}
                aria-label={`${t(selected ? "compare.remove" : "compare.add")}: ${iem.brand} ${iem.name}`}
                disabled={disabled}
                onClick={() => selected ? onRemove(iem.slug) : onAdd(iem.slug)}
                className="flex min-h-14 w-full items-center gap-3 rounded-md px-2 text-left hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-subtle text-xs font-semibold text-secondary">
                  {iem.images.hero ? <Image src={iem.images.hero} alt="" fill sizes="40px" className="object-contain p-1" /> : iem.brand.slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs text-secondary">{iem.brand}</span>
                  <span className="block truncate text-sm font-medium text-primary">{iem.name}</span>
                </span>
                {selected && <Check aria-hidden="true" className="size-4 shrink-0 text-accent" />}
              </button>
            </li>
          );
        }) : (
          <li className="px-2 py-4 text-sm text-secondary">{t("compare.noResults")}</li>
        )}
      </ul>
      {atLimit && <p role="status" className="text-xs text-secondary">{t("compare.limitReached")}</p>}
    </div>
  );
}

export function CompareSelector({ allIems, selectedIems, onAdd, onRemove }: Props) {
  const { t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const selectLabel = t("compare.selectIems").replace("{count}", String(selectedIems.length));

  return (
    <div className="space-y-4">
      <div className="hidden space-y-3 md:block">
        <h2 className="text-sm font-semibold text-primary">{selectLabel}</h2>
        <SearchSelect id="compare-desktop" allIems={allIems} selectedIems={selectedIems} onAdd={onAdd} onRemove={onRemove} />
      </div>

      <Drawer.Root open={mobileOpen} onOpenChange={setMobileOpen} shouldScaleBackground={false}>
        <Drawer.Trigger asChild>
          <button type="button" className="inline-flex min-h-12 w-full items-center justify-between rounded-md border border-border bg-surface px-4 text-sm font-medium text-primary md:hidden">
            <span>{selectLabel}</span>
            <span className="text-secondary">{t("compare.title")}</span>
          </button>
        </Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-background/55 backdrop-blur-sm md:hidden" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[88dvh] overflow-y-auto rounded-t-xl border-t border-border bg-background px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5 outline-none md:hidden">
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-border" />
            <Drawer.Title className="mb-5 text-lg font-semibold text-primary">{selectLabel}</Drawer.Title>
            <Drawer.Description className="sr-only">{t("compare.searchPlaceholder")}</Drawer.Description>
            <SearchSelect id="compare-mobile" allIems={allIems} selectedIems={selectedIems} onAdd={onAdd} onRemove={onRemove} />
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {selectedIems.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          <AnimatePresence initial={false}>
            {selectedIems.map((iem, index) => (
              <motion.li
                layout
                key={iem.slug}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                className="inline-flex min-h-10 max-w-full items-center gap-2 rounded-full border border-border bg-surface px-3 text-xs text-primary"
              >
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: compareColor(index) }} />
                <span className="truncate">{iem.brand} {iem.name}</span>
                <button type="button" aria-label={`${t("compare.remove")}: ${iem.name}`} onClick={() => onRemove(iem.slug)} className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-secondary hover:bg-surface-subtle hover:text-primary">
                  <X aria-hidden="true" className="size-3.5" />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}