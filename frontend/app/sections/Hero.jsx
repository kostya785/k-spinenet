import WordCloud from "../components/WordCloud";
import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <div className={styles.root}>
      <WordCloud />

      <h1 className={styles.title}>X‑Ray Detection</h1>

      <p className={styles.subtitle}>Understand the unseens</p>

      <a href="#try" className={styles.cta}>
        <span className={styles.subsubtitle}>Try Model →</span>
      </a>

      <p className={styles.disclaimer}>
        This tool does not provide medical diagnosis. Consult a physician.
      </p>
    </div>
  );
}