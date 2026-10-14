"use client";

import { useEffect, useRef } from "react";
import { COLORS, WORDS } from "../javascript/wordCloudData";
import styles from "./WordCloud.module.css";

export default function WordCloud() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const spans = container.querySelectorAll(".wc-word");

    const screenWidth = window.innerWidth;

    const baseFont =
      screenWidth < 500 ? 32
      : screenWidth < 900 ? 42
      : screenWidth < 1400 ? 48
      : 54;

    const speedFactor =
      screenWidth < 600 ? 0.12
      : screenWidth < 1200 ? 0.18
      : 0.25;

    spans.forEach((span) => {
      span.style.left = `${Math.random() * 90}%`;
      span.style.top = `${Math.random() * 90}%`;

      span.style.fontSize = `${baseFont + Math.random() * 40}px`;

      const dx = (Math.random() - 0.5) * speedFactor;
      const dy = (Math.random() - 0.5) * speedFactor;

      let x = parseFloat(span.style.left);
      let y = parseFloat(span.style.top);

      function breathing() {
        const scale = 1 + Math.sin(Date.now() / 1500 + Math.random()) * 0.12;
        span.style.transform = `scale(${scale})`;
        requestAnimationFrame(breathing);
      }
      breathing();

      function fading() {
        const newOpacity = 0.75 + Math.random() * 0.25;
        span.style.opacity = String(newOpacity);
        setTimeout(fading, 2000 + Math.random() * 2000);
      }
      fading();

      function animate() {
        x += dx;
        y += dy;

        if (x < 0) x = 100;
        if (x > 100) x = 0;
        if (y < 0) y = 100;
        if (y > 100) y = 0;

        span.style.left = `${x}%`;
        span.style.top = `${y}%`;

        requestAnimationFrame(animate);
      }
      animate();
    });
  }, []);

  return (
    <div ref={containerRef} className={styles.container}>
      {WORDS.map((word, i) => (
        <span
          key={i}
          className={`wc-word ${styles.word}`}
          style={{
            color: COLORS[i % COLORS.length],
          }}
        >
          {word}
        </span>
      ))}
    </div>
  );
}
