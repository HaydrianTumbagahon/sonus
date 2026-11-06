import type { Metadata } from "next";
import { Anton, Caveat, Geist, Geist_Mono, Noto_Sans_JP, Noto_Sans_SC } from "next/font/google";
import { cookies } from "next/headers";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { SettingsPanel } from "@/components/layout/SettingsPanel";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { CurrencyProvider, type Currency } from "@/components/providers/CurrencyProvider";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { htmlLanguage, type Language } from "@/lib/i18n";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
});

const notoSansSC = Noto_Sans_SC({
  variable: "--font-noto-sans-sc",
  subsets: ["latin"],
});

const anton = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-caveat",
  weight: "700",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sonus",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : "http://localhost:3000"),
  ),
};

export default async function RootLayout({ children }: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get("sonus-lang")?.value;
  const lang: Language = langCookie === "jp" || langCookie === "cn" ? langCookie : "en";
  const currencyCookie = cookieStore.get("sonus-currency")?.value;
  const currency: Currency = currencyCookie === "USD" ? currencyCookie : "USD";
  const themeCookie = cookieStore.get("sonus-theme")?.value;
  const theme = themeCookie === "light" ? "light" : "dark";

  return (
    <html
      lang={htmlLanguage[lang]}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${notoSansJP.variable} ${notoSansSC.variable} ${anton.variable} ${caveat.variable} ${theme}`}
    >
      <body>
        <LanguageProvider initialLang={lang}>
          <CurrencyProvider initialCurrency={currency}>
            <ThemeProvider initialTheme={theme}>
              <TooltipProvider>
                <div className="min-h-dvh">
                  <Header />
                  <GlobalSearch />
                  <main className="min-h-[40vh] pt-[var(--header-offset)] pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
                    {children}
                  </main>
                  <Footer />
                  <MobileNav />
                  <ScrollToTop />
                  <SettingsPanel />
                </div>
              </TooltipProvider>
            </ThemeProvider>
          </CurrencyProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
