"use client";

import Link from "next/link";
import styles from "./Header.module.css";

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <img src="/logo.svg" alt="Logo" className={styles.logoImg} />
      </div>

      <nav className={styles.nav}>
        <Link href="/#hero" className={styles.navLink}>
          Main
        </Link>
        <Link href="/#try" className={styles.navLink}>
          Try Model
        </Link>
        <Link href="/catalog" className={styles.navLink}>
          Catalog
        </Link>
        <Link href="/#about" className={styles.navLink}>
          About
        </Link>
        <Link href="/#faq" className={styles.navLink}>
          FAQ
        </Link>
      </nav>

      <button type="button" className={styles.langBtn}>
        RU / EN
      </button>
    </header>
  );
}
