import React, { createContext, useContext, useMemo, useState } from "react";
import { getLang as getStoredLang, setLang as setStoredLang, t as rawT } from "@/lib/i18n";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(getStoredLang());

  const setLang = (next) => {
    setStoredLang(next);
    setLangState(next);
  };

  const value = useMemo(() => ({ lang, setLang }), [lang]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used inside <LanguageProvider />");
  return ctx;
}

// translator that re-renders when lang changes
export function useT() {
  const { lang } = useLang();
  return useMemo(() => (key) => rawT(key), [lang]);
}