"use client";

import { useEffect, useRef } from "react";
import styles from "./FAQ.module.css";
import { useLang } from "../i18n/LanguageProvider";

export default function FAQPage() {
  const { t } = useLang();

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>{t("faq.title")}</h2>

      <div className={styles.list}>
        <FAQItem question={t("faq.q1")} answer={t("faq.a1")} />
        <FAQItem question={t("faq.q2")} answer={t("faq.a2")} />
        <FAQItem question={t("faq.q3")} answer={t("faq.a3")} />
        <FAQItem question={t("faq.q4")} answer={t("faq.a4")} />
      </div>
    </section>
  );
}

function FAQItem({ question, answer }) {
  const itemRef = useRef(null);
  const contentRef = useRef(null);

  // если ответ открыт и язык сменился, пересчитываем высоту под новый текст
  useEffect(() => {
    const item = itemRef.current;
    const content = contentRef.current;
    if (item && content && item.getAttribute("data-open") === "true") {
      content.style.maxHeight = `${content.scrollHeight}px`;
    }
  }, [answer]);

  function toggle() {
    const item = itemRef.current;
    const content = contentRef.current;
    if (!item || !content) return;

    const isOpen = item.getAttribute("data-open") === "true";

    if (isOpen) {
      item.setAttribute("data-open", "false");
      content.style.maxHeight = "0px";
    } else {
      item.setAttribute("data-open", "true");
      content.style.maxHeight = `${content.scrollHeight}px`;
    }
  }

  return (
    <div ref={itemRef} className={styles.item} data-open="false">
      <button type="button" onClick={toggle} className={styles.questionBtn}>
        {question}
      </button>

      <div ref={contentRef} className={styles.answer}>
        <p className={styles.answerText}>{answer}</p>
      </div>
    </div>
  );
}