"use client";

import type Fuse from "fuse.js";
import type { FuseResult } from "fuse.js";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BookOpen, Headphones, Search as SearchIcon, X } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useAppStore } from "@/lib/store";
import type { Brand, BrandStatus, IEM } from "@/types/iem";
import type { GlossaryCategory, GlossaryTerm } from "@/data/glossary";

const recentSearchKey = "sonus-search-recent";
const recentSearchLimit = 6;
const popularTermSlugs = ["dynamic-driver", "sub-bass", "soundstage"];

type SearchKind = "iem" | "brand" | "glossary";

type SearchDocument = {
  id: string;
  kind: SearchKind;
  title: string;
  href: string;
  brand?: string;
  brandSlug?: string;
  driverType?: string;
  driverConfiguration?: string;
  tags?: string[];
  materials?: string[];
  slug?: string;
  keywords?: string;
  image?: string;
  priceUSD?: number;
  status?: BrandStatus;
  iemCount?: number;
  category?: GlossaryCategory;
  definition?: string;
  explanation?: string;
};

type MatchRange = readonly [number, number];

const categoryTranslation: Record<GlossaryCategory, string> = {
  "Hardware & Design": "glossary.categoryHardware",
  "Sound Frequencies & Tuning": "glossary.categorySound",
  "Audio Quality & Performance": "glossary.categoryQuality",
};

function readRecentSearches(): string[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(recentSearchKey) ?? "[]");
    if (!Array.isArray(stored)) return [];
    return [...new Set(stored
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim().slice(0, 100))
      .filter(Boolean))].slice(0, recentSearchLimit);
  } catch {
    return [];
  }
}

function makeSearchDocuments(iems: IEM[], brands: Brand[], terms: GlossaryTerm[]): SearchDocument[] {
  return [
    ...iems.map((iem) => ({
      id: `iem:${iem.slug}`,
      kind: "iem" as const,
      title: iem.name,
      href: `/iem/${encodeURIComponent(iem.slug)}`,
      brand: iem.brand,
      brandSlug: iem.brandSlug,
      driverType: iem.driverType,
      driverConfiguration: iem.driverConfiguration,
      tags: iem.tags,
      materials: Array.isArray(iem.materials)
        ? iem.materials
        : iem.materials
          ? Object.values(iem.materials)
          : undefined,
      image: iem.images.hero,
      priceUSD: iem.priceUSD,
    })),
    ...brands.map((brand) => ({
      id: `brand:${brand.slug}`,
      kind: "brand" as const,
      title: brand.name,
      href: `/brand/${encodeURIComponent(brand.slug)}`,
      slug: brand.slug,
      keywords: brand.slug,
      image: brand.logo,
      status: brand.status,
      iemCount: brand.iemCount,
    })),
    ...terms.map((term) => ({
      id: `glossary:${term.slug}`,
      kind: "glossary" as const,
      title: term.term,
      href: `/learn/${encodeURIComponent(term.slug)}`,
      slug: term.slug,
      category: term.category,
      definition: term.shortDefinition,
      explanation: term.explanation,
      keywords: term.related.join(" "),
    })),
  ];
}

function matchRanges(result: FuseResult<SearchDocument> | undefined, key: string): readonly MatchRange[] | undefined {
  return result?.matches?.find((match) => match.key === key)?.indices;
}

function HighlightedText({ text, ranges }: { text: string; ranges?: readonly MatchRange[] }) {
  if (!ranges?.length) return <>{text}</>;

  const parts: ReactNode[] = [];
  let cursor = 0;
  for (const [start, end] of [...ranges].sort((left, right) => left[0] - right[0])) {
    if (start < cursor || start >= text.length) continue;
    if (start > cursor) parts.push(text.slice(cursor, start));
    parts.push(
      <mark key={`${start}-${end}`} className="rounded-sm bg-accent-muted text-primary">
        {text.slice(start, end + 1)}
      </mark>,
    );
    cursor = end + 1;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <>{parts}</>;
}

export function GlobalSearch() {
  const router = useRouter();
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const open = useAppStore((state) => state.searchOpen);
  const setSearchOpen = useAppStore((state) => state.setSearchOpen);
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchIndex, setSearchIndex] = useState<Fuse<SearchDocument> | null>(null);
  const [popularDocuments, setPopularDocuments] = useState<SearchDocument[]>([]);
  const [indexLoading, setIndexLoading] = useState(false);
  const [indexFailed, setIndexFailed] = useState(false);
  const indexStarted = useRef(false);
  const recentLoaded = useRef(false);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }

    if (!recentLoaded.current) {
      recentLoaded.current = true;
      setRecentSearches(readRecentSearches());
    }
    if (indexStarted.current) return;
    indexStarted.current = true;
    setIndexLoading(true);

    void Promise.all([
      import("fuse.js"),
      import("@/lib/data"),
    ]).then(([fuseModule, dataModule]) => {
      const { getAllBrands, getAllIEMs, getAllGlossaryTerms } = dataModule;
      const documents = makeSearchDocuments(getAllIEMs(), getAllBrands(), getAllGlossaryTerms());
      const FuseConstructor = fuseModule.default;
      setSearchIndex(new FuseConstructor(documents, {
        keys: [
          { name: "title", weight: 0.4 },
          { name: "brand", weight: 0.15 },
          { name: "driverType", weight: 0.12 },
          { name: "driverConfiguration", weight: 0.1 },
          { name: "tags", weight: 0.06 },
          { name: "materials", weight: 0.04 },
          { name: "slug", weight: 0.05 },
          { name: "category", weight: 0.04 },
          { name: "definition", weight: 0.02 },
          { name: "explanation", weight: 0.01 },
          { name: "keywords", weight: 0.01 },
        ],
        includeMatches: true,
        ignoreLocation: true,
        threshold: 0.34,
      }));

      const iems = getAllIEMs().slice().sort(
        (left, right) => (right.ratings?.overall ?? 0) - (left.ratings?.overall ?? 0),
      );
      const popularIems = documents.filter((document) =>
        document.kind === "iem" && iems.slice(0, 3).some((iem) => document.id === `iem:${iem.slug}`),
      );
      const popularBrands = documents.filter((document) =>
        document.kind === "brand" && document.status === "live",
      ).slice(0, 2);
      const popularTerms = popularTermSlugs
        .map((slug) => documents.find((document) => document.kind === "glossary" && document.slug === slug))
        .filter((document): document is SearchDocument => document !== undefined);
      setPopularDocuments([...popularIems, ...popularBrands, ...popularTerms]);
    }).catch(() => {
      setIndexFailed(true);
    }).finally(() => {
      setIndexLoading(false);
    });
  }, [open]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target;
      const isEditing = target instanceof HTMLElement && (
        target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
      );

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      } else if (event.key === "/" && !isEditing && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [setSearchOpen]);

  const trimmedQuery = query.trim();
  const results = searchIndex && trimmedQuery
    ? searchIndex.search(trimmedQuery, { limit: 30 })
    : [];
  const groupedResults: Record<SearchKind, FuseResult<SearchDocument>[]> = {
    iem: results.filter((result) => result.item.kind === "iem"),
    brand: results.filter((result) => result.item.kind === "brand"),
    glossary: results.filter((result) => result.item.kind === "glossary"),
  };

  const saveRecentSearch = (search: string) => {
    const value = search.trim().slice(0, 100);
    if (!value) return;
    const next = [value, ...recentSearches.filter((item) => item.toLocaleLowerCase() !== value.toLocaleLowerCase())]
      .slice(0, recentSearchLimit);
    setRecentSearches(next);
    try {
      localStorage.setItem(recentSearchKey, JSON.stringify(next));
    } catch {
      // Storage can be disabled by the browser; search still works for this session.
    }
  };

  const selectDocument = (document: SearchDocument) => {
    saveRecentSearch(trimmedQuery || document.title);
    setSearchOpen(false);
    router.push(document.href);
  };

  const renderDocument = (document: SearchDocument, result?: FuseResult<SearchDocument>) => (
    <CommandItem
      key={document.id}
      value={document.id}
      onSelect={() => selectDocument(document)}
      className="min-h-14 gap-3 px-3 py-2.5"
    >
      <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-border bg-surface-subtle text-secondary">
        {document.image ? (
          <Image src={document.image} alt="" fill sizes="40px" className="object-contain p-1" />
        ) : document.kind === "glossary" ? (
          <BookOpen aria-hidden="true" className="size-4" />
        ) : (
          <Headphones aria-hidden="true" className="size-4" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-primary">
          <HighlightedText text={document.title} ranges={matchRanges(result, "title")} />
        </span>
        {document.kind === "iem" && (
          <span className="block truncate text-xs text-secondary">
            <HighlightedText text={document.brand ?? ""} ranges={matchRanges(result, "brand")} />
          </span>
        )}
        {document.kind === "brand" && (
          <span className="block truncate text-xs text-secondary">
            {document.status === "coming-soon"
              ? t("common.comingSoon")
              : `${document.iemCount ?? 0} ${t("showroom.brandIemCount")}`}
          </span>
        )}
        {document.kind === "glossary" && document.category && (
          <span className="block truncate text-xs text-secondary">
            <HighlightedText
              text={t(categoryTranslation[document.category])}
              ranges={matchRanges(result, "category")}
            />
          </span>
        )}
      </span>
      {document.kind === "iem" && (
        <span className="shrink-0 font-mono text-xs text-secondary">
          {typeof document.priceUSD === "number" ? formatPrice(document.priceUSD) : t("common.priceUnavailable")}
        </span>
      )}
    </CommandItem>
  );

  const groupHeading: Record<SearchKind, string> = {
    iem: t("search.groups.iems"),
    brand: t("search.groups.brands"),
    glossary: t("search.groups.glossary"),
  };

  return (
    <Dialog open={open} onOpenChange={setSearchOpen}>
      <DialogContent
        showCloseButton={false}
        className="inset-0 left-0 top-0 h-dvh w-full max-w-none translate-x-0 translate-y-0 gap-0 rounded-none p-0 md:inset-auto md:left-1/2 md:top-[10vh] md:h-auto md:max-h-[80dvh] md:w-[min(44rem,calc(100vw-2rem))] md:-translate-x-1/2 md:translate-y-0 md:rounded-xl"
      >
        <DialogTitle className="sr-only">{t("search.title")}</DialogTitle>
        <DialogDescription className="sr-only">{t("search.description")}</DialogDescription>
        <Command shouldFilter={false} loop className="size-full min-h-0 rounded-none! p-0 md:rounded-xl!">
          <div className="flex min-h-16 items-center gap-2 border-b border-border px-3 sm:px-4">
            <CommandInput
              autoFocus
              aria-label={t("search.placeholder")}
              maxLength={100}
              value={query}
              onValueChange={setQuery}
              placeholder={t("search.placeholder")}
              className="h-11 text-base text-primary placeholder:text-tertiary"
            />
            <button
              type="button"
              aria-label={t("search.close")}
              onClick={() => setSearchOpen(false)}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-sm text-secondary transition-colors hover:bg-surface-subtle hover:text-primary"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>
          <CommandList aria-label={t("search.ariaResults")} className="max-h-none min-h-0 flex-1 p-2 pb-[env(safe-area-inset-bottom)]">
            {indexLoading && <p role="status" className="px-3 py-6 text-sm text-secondary">{t("search.loading")}</p>}
            {indexFailed && <CommandEmpty>{t("search.loadError")}</CommandEmpty>}
            {!indexLoading && !indexFailed && trimmedQuery && results.length === 0 && (
              <CommandEmpty>{t("search.noResults")}</CommandEmpty>
            )}
            {!indexLoading && !indexFailed && trimmedQuery && (Object.keys(groupedResults) as SearchKind[]).map((kind) => (
              groupedResults[kind].length > 0 && (
                <CommandGroup key={kind} heading={groupHeading[kind]}>
                  {groupedResults[kind].map((result) => renderDocument(result.item, result))}
                </CommandGroup>
              )
            ))}
            {!indexLoading && !indexFailed && !trimmedQuery && recentSearches.length > 0 && (
              <CommandGroup heading={t("search.recent")}>
                {recentSearches.map((search) => (
                  <CommandItem
                    key={search}
                    value={`recent:${search}`}
                    onSelect={() => setQuery(search)}
                    className="min-h-12 gap-3 px-3"
                  >
                    <SearchIcon aria-hidden="true" className="size-4 text-secondary" />
                    <span className="truncate">{search}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {!indexLoading && !indexFailed && !trimmedQuery && (
              (["iem", "brand", "glossary"] as SearchKind[]).map((kind) => {
                const documents = popularDocuments.filter((document) => document.kind === kind);
                if (documents.length === 0) return null;
                return (
                  <CommandGroup key={`popular-${kind}`} heading={`${t("search.popular")} ${groupHeading[kind]}`}>
                    {documents.map((document) => renderDocument(document))}
                  </CommandGroup>
                );
              })
            )}
          </CommandList>
          <div className="hidden min-h-10 items-center border-t border-border px-4 text-xs text-tertiary sm:flex">
            {t("search.keyboardHint")}
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}