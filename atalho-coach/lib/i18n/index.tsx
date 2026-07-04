"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { dictionaries, Dictionary, Locale } from "./dictionaries";

const STORAGE_KEY = "atalho-coach:locale";

interface I18nValue {
  locale: Locale;
  t: Dictionary;
  setLocale: (l: Locale) => void;
}

const I18nContext = createContext<I18nValue>({
  locale: "pt",
  t: dictionaries.pt,
  setLocale: () => {},
});

function detectLocale(): Locale {
  if (typeof navigator === "undefined") return "pt";
  const lang = navigator.language.toLowerCase();
  if (lang.startsWith("pt")) return "pt";
  if (lang.startsWith("es")) return "es";
  return "en";
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("pt");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    setLocaleState(saved && dictionaries[saved] ? saved : detectLocale());
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
  };

  return (
    <I18nContext.Provider value={{ locale, t: dictionaries[locale], setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
