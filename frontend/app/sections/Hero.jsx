"use client";

import WordCloud from "../components/WordCloud";
import styles from "./Hero.module.css";
import { useLang } from "../i18n/LanguageProvider";

export default function Hero() {
  const { t } = useLang();

  return (
    <div className={styles.root}>
      <WordCloud />

      <h1 className={styles.title}>X‑Ray Detection</h1>

      <p className={styles.subtitle}>Understand the unseens</p>

      <a href="#try" className={styles.cta}>
        <span className={styles.subsubtitle}>{t("hero.cta")}</span>
      </a>

      <p className={styles.disclaimer}>{t("hero.disclaimer")}</p>
    </div>
  );
}