"use client";

import { useRef } from "react";
import styles from "./FAQ.module.css";

export default function FAQPage() {
  return (
    <section className={styles.section}>
      <h2 className={styles.title}>FAQ</h2>

      <div className={styles.list}>
        <FAQItem
          question="How model is working?"
          answer="The model analyzes an X-ray image, identifies vertebral segments and determines their coordinates with high accuracy."
        />
        <FAQItem
          question="What pictures are supported?"
          answer="Standard frontal and sagittal images are supported, including all sections of the spine."
        />
        <FAQItem
          question="Is registration required?"
          answer="No, the demo version is available without registration. API access requires a key."
        />
        <FAQItem
          question="What percentage of accuracy?"
          answer="Accuracy depends on the image type, but on average exceeds 90% on the validation set."
        />
      </div>
    </section>
  );
}

function FAQItem({ question, answer }) {
  const itemRef = useRef(null);
  const contentRef = useRef(null);

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
