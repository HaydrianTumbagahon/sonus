"use client";

import { useEffect } from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";

type Theme = "light" | "dark";

function persistTheme(theme: string) {
  if (theme !== "light" && theme !== "dark") {
    return;
  }

  localStorage.setItem("sonus-theme", theme);
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `sonus-theme=${theme}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
}

function ThemeCookieSync() {
  const { theme } = useTheme();

  useEffect(() => {
    if (theme) {
      persistTheme(theme);
    }
  }, [theme]);

  return null;
}

export function ThemeProvider({
  children,
  initialTheme,
}: {
  children: React.ReactNode;
  initialTheme: Theme;
}) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={initialTheme}
      enableSystem={false}
      disableTransitionOnChange
      storageKey="sonus-theme"
    >
      <ThemeCookieSync />
      {children}
    </NextThemesProvider>
  );
}