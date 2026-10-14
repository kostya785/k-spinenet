"use client";

import styles from "./Footer.module.css";
import { FaTelegram, FaInstagram, FaGithub, FaEnvelope, FaPinterest } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.credit}>
          built by <b>Konstantinopol</b>
        </div>

        <div className={styles.links}>
          <a href="https://t.me/konstantinopolskie_rasskazy" target="_blank" rel="noopener noreferrer" className={styles.link} aria-label="Telegram">
            <FaTelegram />
          </a>

          <a href="https://www.instagram.com/kostyan_manukyan?stkn=MWE0a2p3eWEzMjM1Zg%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" className={styles.link} aria-label="Instagram">
            <FaInstagram />
          </a>

          <a href="https://github.com/kostya785" target="_blank" rel="noopener noreferrer" className={styles.link} aria-label="GitHub">
            <FaGithub />
          </a>

          <a href="mailto:kma785kma@gmail.com" className={styles.link} aria-label="Email">
            <FaEnvelope />
          </a>

          <a href="https://pin.it/6vV5bask9" target="_blank" rel="noopener noreferrer" className={styles.link} aria-label="Pinterest">
  <FaPinterest />
</a>
        </div>
      </div>
    </footer>
  );
}