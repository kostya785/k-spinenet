"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./Header.module.css";
import { asset } from "../../lib/config";

export default function Header() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

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
        <Link href="/#hero" className={styles.navLink} onClick={close}>Main</Link>
        <Link href="/#try" className={styles.navLink} onClick={close}>Try Model</Link>
        <Link href="/catalog" className={styles.navLink} onClick={close}>Catalog</Link>
        <Link href="/#about" className={styles.navLink} onClick={close}>About</Link>
        <Link href="/#faq" className={styles.navLink} onClick={close}>FAQ</Link>
        <Link href="/privacy/" className={styles.navLink} onClick={close}>Privacy</Link>
      </nav>

      <button type="button" className={styles.langBtn}>
        RU / EN
      </button>
    </header>
  );
}