"use client";

import styles from "./Header.module.css";

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
  <img src="/logo.svg" alt="Logo" className={styles.logoImg} />
</div>

      <nav className={styles.nav}>
        <a href="#hero" className={styles.navLink}>
          Main
        </a>
        <a href="#try" className={styles.navLink}>
          Try Model
        </a>
        <a href="#about" className={styles.navLink}>
          About
        </a>
        <a href="#faq" className={styles.navLink}>
          FAQ
        </a>
      </nav>

      <button type="button" className={styles.langBtn}>
        RU / EN
      </button>
    </header>
  );
}
