"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Toaster } from "sonner";
import { I18nContext, useI18nProvider } from "@/lib/hooks/useI18n";
import { DateProvider } from "@/lib/context/DateContext";

function I18nProvider({ children }: { children: React.ReactNode }) {
  const value = useI18nProvider();
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <I18nProvider>
        <DateProvider>
          {children}
          <Toaster position="bottom-right" richColors closeButton />
        </DateProvider>
      </I18nProvider>
    </NextThemesProvider>
  );
}