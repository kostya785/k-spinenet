"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./Header.module.css";
import { asset } from "../../lib/config";
import { useLang } from "../i18n/LanguageProvider";

export default function Header() {
  const [open, setOpen] = useState(false);
  const { lang, setLang, t } = useLang();

  const close = () => setOpen(false);
  const toggleLang = () => setLang(lang === "ru" ? "en" : "ru");

  const langLabel = (
    <>
      <span className={lang === "ru" ? styles.langActive : ""}>RU</span>
      {" / "}
      <span className={lang === "en" ? styles.langActive : ""}>EN</span>
    </>
  );

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <Link href="/#hero" onClick={close}>
          <img src={asset("/logo.svg")} alt="Logo" className={styles.logoImg} />
        </Link>
      </div>

      <button
        type="button"
        className={styles.burger}
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span />
        <span />
        <span />
      </button>

      <nav className={`${styles.nav} ${open ? styles.navOpen : ""}`}>
        <Link href="/#hero" className={styles.navLink} onClick={close}>{t("nav.main")}</Link>
        <Link href="/#try" className={styles.navLink} onClick={close}>{t("nav.try")}</Link>
        <Link href="/catalog" className={styles.navLink} onClick={close}>{t("nav.catalog")}</Link>
        <Link href="/#about" className={styles.navLink} onClick={close}>{t("nav.about")}</Link>
        <Link href="/#faq" className={styles.navLink} onClick={close}>{t("nav.faq")}</Link>
        <Link href="/privacy/" className={styles.navLink} onClick={close}>{t("nav.privacy")}</Link>

        <button type="button" className={styles.navLang} onClick={toggleLang}>
          {langLabel}
        </button>
      </nav>

      <button type="button" className={styles.langBtn} onClick={toggleLang}>
        {langLabel}
      </button>
    </header>
  );
}