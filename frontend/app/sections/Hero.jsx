import WordCloud from "../components/WordCloud";
import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <div className={styles.root}>
      <WordCloud />

      <h1 className={styles.title}>X‑Ray Detection</h1>

      <p className={styles.subtitle}>Understand the unseens</p>

      <button type="button" className={styles.cta}>
       <p className={styles.subsubtitle} >Try Model →</p>
      </button>

      <p className={styles.disclaimer}>
        This tool does not provide medical diagnosis. Consult a physician.
      </p>
    </div>
  );
}
