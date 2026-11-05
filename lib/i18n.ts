import en from "@/messages/en.json";
import jp from "@/messages/jp.json";
import cn from "@/messages/cn.json";

export type Language = "en" | "jp" | "cn";

export const htmlLanguage: Record<Language, string> = {
  en: "en",
  jp: "ja",
  cn: "zh-CN",
};

const dictionaries: Record<Language, Record<string, unknown>> = { en, jp, cn };

function getPath(source: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((value, segment) => {
    if (typeof value !== "object" || value === null) {
      return undefined;
    }

    return (value as Record<string, unknown>)[segment];
  }, source);
}

export function translate(language: Language, key: string): string {
  const translated = getPath(dictionaries[language], key);
  if (typeof translated === "string") {
    return translated;
  }

  const fallback = getPath(dictionaries.en, key);
  return typeof fallback === "string" ? fallback : key;
}