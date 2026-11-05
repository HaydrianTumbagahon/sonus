"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { htmlLanguage, translate, type Language } from "@/lib/i18n";

type LanguageContextValue = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function persistLanguage(language: Language) {
  localStorage.setItem("sonus-lang", language);
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `sonus-lang=${language}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
  document.documentElement.lang = htmlLanguage[language];
}

export function LanguageProvider({
  children,
  initialLang,
}: {
  children: React.ReactNode;
  initialLang: Language;
}) {
  const [lang, setLangState] = useState(initialLang);

  useEffect(() => {
    persistLanguage(lang);
  }, [lang]);

  const setLang = (nextLanguage: Language) => {
    setLangState(nextLanguage);
    persistLanguage(nextLanguage);
  };

  const t = (key: string) => translate(lang, key);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }

  return context;
}