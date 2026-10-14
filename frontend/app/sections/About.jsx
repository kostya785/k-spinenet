"use client";

import { useEffect, useRef, useState } from "react";
import {
  ACCURACY_CIRCLE_RADIUS,
  circleCircumference,
  strokeDashOffset,
} from "../javascript/aboutCircleMath";
import styles from "./About.module.css";

export default function About() {
  const [scrollRootEl, setScrollRootEl] = useState(null);

  return (
    <div ref={setScrollRootEl} className={styles.scrollRoot}>
      <Slide
        imageSide="left"
        title="Training Pipeline"
        text="Our model was trained on a curated dataset of about 2500 X‑rays with advanced augmentation and YOLO11s backbone."
        image={<CounterBlock />}
      />

      <Slide
        imageSide="right"
        title="Model Accuracy"
        text="The model achieves high precision on vertebra detection. The chart shows the accuracy metric."
        image={<AccuracyCircle scrollRoot={scrollRootEl} percent={95} />}
      />

<Slide
  imageSide="left"
  title="Dataset"
  text="The dataset includes frontal and lateral X-Rays of backbone with expert‑verified annotations."
  image={<DatasetGrid />}
/>

<Slide
  imageSide="right"
  title="Training Dynamics"
  text="This chart shows how the model improved during training. Loss decreases while mAP grows — a sign of stable learning."
  image={<TrainingChart />}
/>
<Slide
  imageSide="left"
  title="Model Performance Metrics"
  text="These metrics summarize the final performance of the model after 60 epochs. Precision and Recall describe detection quality, while mAP metrics reflect overall accuracy across IoU thresholds."
  image={<MetricCards />}
/>

    </div>
  );
}

function Slide({ imageSide, title, text, image }) {
  const slideClass =
    imageSide === "left" ? styles.slide : `${styles.slide} ${styles.slideReverse}`;

  return (
    <div className={slideClass}>
      <div className={styles.imageCol}>{image}</div>

      <div className={styles.textCol}>
        <h2 className={styles.slideTitle}>{title}</h2>
        <p className={styles.slideText}>{text}</p>
      </div>
    </div>
  );
}

/* ---------------------- COUNTER BLOCK ---------------------- */

function CounterBlock() {
  return (
    <div className={styles.counterWrap}>
      <Counter target={2500} duration={1200} />
      <div className={styles.counterLabel}>X-rays</div>
    </div>
  );
}

function Counter({ target = 2500, duration = 1200 }) {
  const ref = useRef(null);
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true;
          animate();
        }
      },
      { threshold: 0.4 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  function animate() {
    const start = performance.now();

    function frame(now) {
      const progress = Math.min((now - start) / duration, 1);
      const current = Math.floor(progress * target);
      setValue(current);

      if (progress < 1) requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  return (
    <div ref={ref} className={styles.counterNumber}>
      {value}
    </div>
  );
}

/* ---------------------- ACCURACY CIRCLE ---------------------- */

function AccuracyCircle({ percent = 95, scrollRoot }) {
  const [wrapEl, setWrapEl] = useState(null);
  const [inView, setInView] = useState(false);
  const [animatedPercent, setAnimatedPercent] = useState(0);

  useEffect(() => {
    if (!scrollRoot || !wrapEl) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setInView(true);
      },
      { root: scrollRoot, threshold: 0.45 }
    );
    io.observe(wrapEl);
    return () => io.disconnect();
  }, [scrollRoot, wrapEl]);

  useEffect(() => {
    if (!inView) return;

    setAnimatedPercent(0);
    const t = setTimeout(() => setAnimatedPercent(percent), 50);
    return () => clearTimeout(t);
  }, [inView, percent]);

  const circumference = circleCircumference(ACCURACY_CIRCLE_RADIUS);
  const offset = strokeDashOffset(animatedPercent, circumference);

  return (
    <div ref={setWrapEl} className={styles.accuracyWrap}>
      <svg className={styles.accuracySvg} viewBox="0 0 300 300">
        <g transform="rotate(-90 150 150)">
          <circle
            className={styles.trackCircle}
            cx="150"
            cy="150"
            r={ACCURACY_CIRCLE_RADIUS}
          />
          <circle
            className={styles.progressCircle}
            cx="150"
            cy="150"
            r={ACCURACY_CIRCLE_RADIUS}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </g>
      </svg>

      <div className={styles.accuracyLabel}>
        {Math.round(animatedPercent)}%
      </div>
    </div>
  );
}
function DatasetGrid() {
  const [active, setActive] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newActive = Array.from({ length: 25 }, () =>
        Math.random() < 0.15
      );
      setActive(newActive);
    }, 300);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.datasetGrid}>
      {Array.from({ length: 25 }).map((_, i) => (
        <div
          key={i}
          className={`${styles.datasetCell} ${
            active[i] ? styles.datasetActive : ""
          }`}
        />
      ))}
    </div>
  );
}
function TrainingChart() {
  const epochs = [
    1,2,3,4,5,6,7,8,9,10,
    11,12,13,14,15,16,17,18,19,20
  ];

  // mAP50-95 (B)
  const mAP = [
    0.38716,0.48541,0.50232,0.56995,0.55778,
    0.56921,0.57866,0.59048,0.59547,0.60216,
    0.60283,0.60485,0.60858,0.61410,0.61304,
    0.61018,0.61225,0.61504,0.61522,0.61438
  ];

  // train/box_loss
  const loss = [
    1.69368,1.21423,1.15222,1.11767,1.08817,
    1.06091,1.04442,1.03241,1.01150,1.00057,
    0.98300,0.96955,0.95026,0.94425,0.92561,
    0.91538,0.90153,0.89416,0.88686,0.87804
  ];

  // нормализация для SVG
  const maxLoss = Math.max(...loss);
  const minLoss = Math.min(...loss);
  const maxMAP = Math.max(...mAP);
  const minMAP = Math.min(...mAP);

  const normalize = (value, min, max) =>
    280 - ((value - min) / (max - min)) * 240;

  const lossPoints = loss
    .map((v, i) => `${40 + i * 30},${normalize(v, minLoss, maxLoss)}`)
    .join(" ");

  const mapPoints = mAP
    .map((v, i) => `${40 + i * 30},${normalize(v, minMAP, maxMAP)}`)
    .join(" ");

  return (
    <div className={styles.chartWrap}>
      <svg className={styles.chartSvg} viewBox="0 0 700 300">
        {/* LOSS LINE */}
        <polyline
          className={styles.lossLine}
          points={lossPoints}
        />

        {/* mAP LINE */}
        <polyline
          className={styles.mapLine}
          points={mapPoints}
        />

        {/* LOSS POINTS */}
        {loss.map((v, i) => (
          <circle
            key={"l"+i}
            cx={40 + i * 30}
            cy={normalize(v, minLoss, maxLoss)}
            r="4"
            className={styles.lossPoint}
          />
        ))}

        {/* MAP POINTS */}
        {mAP.map((v, i) => (
          <circle
            key={"m"+i}
            cx={40 + i * 30}
            cy={normalize(v, minMAP, maxMAP)}
            r="4"
            className={styles.mapPoint}
          />
        ))}
      </svg>

      <div className={styles.chartLegend}>
        <div className={styles.legendItem}>
          <span className={styles.lossDot}></span> Train Box Loss ↓
        </div>
        <div className={styles.legendItem}>
          <span className={styles.mapDot}></span> mAP50‑95 ↑
        </div>
      </div>

      <p className={styles.chartDescription}>
  <b>Train Box Loss</b> — shows how accurately the model predicts bounding box
  coordinates. Lower values indicate better localization performance.
  <br />
  <b>mAP50‑95</b> — the averaged detection accuracy across IoU thresholds from
  0.50 to 0.95. This is the primary metric for evaluating object detection
  quality: higher values indicate better overall performance.
</p>

    </div>
  );
}

function MetricCards() {
  const metrics = [
    { label: "Precision", value: 0.81594, color: "#4a90e2" },
    { label: "Recall", value: 0.87471, color: "#50c878" },
    { label: "mAP50", value: 0.87364, color: "#a78bfa" },
    { label: "mAP50‑95", value: 0.61438, color: "#ff7f50" },
  ];

  return (
    <div className={styles.metricsGrid}>
      {metrics.map((m, i) => (
        <div key={i} className={styles.metricCard}>
          <div
            className={styles.metricValue}
            style={{ color: m.color }}
          >
            {(m.value * 100).toFixed(1)}%
          </div>
          <div className={styles.metricLabel}>{m.label}</div>
        </div>
      ))}
    </div>
  );
}
