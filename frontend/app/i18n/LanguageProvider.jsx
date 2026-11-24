"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { translations } from "./translations";

const LanguageContext = createContext({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState("en");

  // читаем сохранённый язык уже после загрузки, чтобы не ломать гидратацию
  useEffect(() => {
    let saved = null;
    try {
      saved = localStorage.getItem("lang");
    } catch {}
    if (saved === "ru" || saved === "en") {
      setLangState(saved);
    } else if (navigator.language?.toLowerCase().startsWith("ru")) {
      setLangState("ru");
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l) => {
    setLangState(l);
    try {
      localStorage.setItem("lang", l);
    } catch {}
  }, []);

  const t = useCallback(
    (key) => translations[lang]?.[key] ?? translations.en[key] ?? key,
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}