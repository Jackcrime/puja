"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import id from "@/lib/i18n/id.json";
import en from "@/lib/i18n/en.json";

type Lang = "id" | "en";
type Translations = typeof id;

const translations: Record<Lang, Translations> = { id, en };

function getNestedValue(obj: any, path: string): any {
  const result = path.split(".").reduce((o, k) => o?.[k], obj);
  return result ?? path;
}

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => any;
}

export const I18nContext = createContext<I18nContextType>({
  lang: "id",
  setLang: () => {},
  t: (k) => k,
});

export function useI18n() {
  return useContext(I18nContext);
}

export function useI18nProvider() {
  const [lang, setLangState] = useState<Lang>("id");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("gkpb_lang") as Lang;
      if (saved === "id" || saved === "en") setLangState(saved);
    } catch {}
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem("gkpb_lang", l); } catch {}
  }, []);

  const t = useCallback((key: string): any => getNestedValue(translations[lang], key), [lang]);

  return { lang, setLang, t };
}