"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";

const rates = { USD: 1 } as const;
export type Currency = keyof typeof rates;

const numberLocales = {
  en: "en-US",
  jp: "ja-JP",
  cn: "zh-CN",
} as const;

type CurrencyContextValue = {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (priceUSD: number) => string;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function persistCurrency(currency: Currency) {
  localStorage.setItem("sonus-currency", currency);
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `sonus-currency=${currency}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
}

export function CurrencyProvider({
  children,
  initialCurrency,
}: {
  children: React.ReactNode;
  initialCurrency: Currency;
}) {
  const [currency, setCurrencyState] = useState(initialCurrency);
  const { lang } = useLanguage();

  useEffect(() => {
    persistCurrency(currency);
  }, [currency]);

  const setCurrency = (nextCurrency: Currency) => {
    setCurrencyState(nextCurrency);
    persistCurrency(nextCurrency);
  };

  const formatPrice = (priceUSD: number) =>
    new Intl.NumberFormat(numberLocales[lang], {
      style: "currency",
      currency,
    }).format(priceUSD * rates[currency]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }

  return context;
}