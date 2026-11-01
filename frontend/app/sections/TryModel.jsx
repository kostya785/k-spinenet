"use client";

import { useState } from "react";
import styles from "./TryModel.module.css";
import { GALLERY_PATHS } from "../javascript/tryModelGallery";
import { API_URL, asset } from "../../lib/config";
import dicomParser from "dicom-parser";
import Link from "next/link";

const BLOCK_PERSONAL = process.env.NEXT_PUBLIC_BLOCK_PERSONAL_DATA === "1";
const NOTICE_TEXT =
  "This file contains patient identifiers (name or birth date). It was not uploaded. Please anonymize it or choose an image from the gallery.";

// Проверка тегов DICOM прямо в браузере: файл с данными пациента не уходит на сервер
function hasPersonalData(buffer) {
  try {
    const ds = dicomParser.parseDicom(new Uint8Array(buffer));
    const name = (ds.string("x00100010") || "").trim();
    const anon = /anon|unknown|removed|de-?identified|none/i.test(name) || /\d/.test(name);
    if (name && !anon) return true;
    return ["x00100030", "x00101040", "x00102154", "x00101001"].some(
      (t) => (ds.string(t) || "").trim()
    );
  } catch {
    return false;
  }
}

export default function TryModel() {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [userUpload, setUserUpload] = useState(false);

  // Состояния для Fullscreen / Modal Zoom
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  async function handleUpload(e) {
    const input = e.target;
    const uploaded = input.files?.[0];
    if (!uploaded) return;

    setNotice("");
    const isDcm = uploaded.name.toLowerCase().endsWith(".dcm");
    if (isDcm && BLOCK_PERSONAL) {
      const buf = await uploaded.arrayBuffer();
      if (hasPersonalData(buf)) {
        input.value = "";
        setFile(null);
        setPreview(null);
        setResult(null);
        setNotice(NOTICE_TEXT);
        return;
      }
    }
    setFile(uploaded);
    setUserUpload(true);
    setAgreed(false);
    if (!isDcm) {
      setPreview(URL.createObjectURL(uploaded));
    } else {
      setPreview(null);
    }
    setResult(null);
  }

  async function handleGallerySelect(src) {
    setUserUpload(false);
    setNotice("");
    setPreview(src);
    setResult(null);

    const response = await fetch(asset(src));
    const blob = await response.blob();
    const galleryFile = new File([blob], "gallery.jpg", { type: blob.type });

    setFile(galleryFile);
  }

  async function handleDetect() {
    if (!file) return;

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_URL}/predict`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.error === "personal_data") {
        setNotice(NOTICE_TEXT);
        setLoading(false);
        return;
      }

      if (data.image_url) {
        setPreview(data.image_url);
      }

      setResult(data);
    } catch (err) {
      console.error(err);
      alert("Ошибка при запросе к модели");
    }

    setLoading(false);
  }

  const openModal = () => {
    setZoomLevel(1);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.3, 3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.3, 0.7));

  const needConsent = BLOCK_PERSONAL && userUpload;
  const canDetect = Boolean(file) && !loading && (!needConsent || agreed);

  return (
    <div className={styles.root}>
      <h2 className={styles.title}>Try the Model</h2>

      <label className={styles.uploadLabel}>
        <input
          type="file"
          accept="image/*,.dcm"
          onChange={handleUpload}
          className={styles.hiddenInput}
        />
        <span className={styles.uploadHint}>Click to upload X‑ray or DICOM</span>
      </label>

      {BLOCK_PERSONAL && (
        <p style={{ fontSize: "14px", color: "#555", maxWidth: "500px", textAlign: "center", margin: "0 0 10px" }}>
          Do not upload images that contain personal data. Files with patient identifiers are rejected.
        </p>
      )}
      {notice && (
        <p role="alert" style={{ fontSize: "14px", color: "#b3261e", maxWidth: "500px", textAlign: "center", margin: "0 0 10px" }}>
          {notice}
        </p>
      )}

      <div className={styles.gallerySticky}>
        <p className={styles.galleryHint}>or choose from our gallery</p>

        <div className={styles.galleryRow}>
          {GALLERY_PATHS.map((src, i) => (
            <img
              key={i}
              src={asset(src)}
              alt=""
              onClick={() => handleGallerySelect(src)}
              className={`${styles.thumb} ${
                preview === src ? styles.thumbSelected : ""
              }`}
            />
          ))}
        </div>
      </div>

      {/* Компактный превью блока */}
      {preview && (
        <div className={styles.previewWrap} style={{ textAlign: "center" }}>
          <div
            onClick={openModal}
            style={{
              cursor: "zoom-in",
              display: "inline-block",
              position: "relative",
            }}
            title="Нажмите, чтобы развернуть и рассмотреть детали"
          >
            <img
              key={preview}
              src={asset(preview)}
              alt="preview"
              className={styles.previewImg}
              style={{ maxHeight: "500px", objectFit: "contain" }}
            />
            <span
              style={{
                position: "absolute",
                bottom: "10px",
                right: "10px",
                background: "rgba(0,0,0,0.7)",
                color: "#fff",
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "12px",
              }}
            >
              🔍 Клик для зума
            </span>
          </div>
        </div>
      )}

      {needConsent && (
        <label
          style={{ display: "flex", gap: "8px", alignItems: "flex-start", maxWidth: "500px", margin: "0 0 16px", fontSize: "14px", color: "#333", cursor: "pointer" }}
        >
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            style={{ marginTop: "3px" }}
          />
          <span>
            I confirm that this image contains no personal data and I have read the{" "}
            <Link href="/privacy/" style={{ textDecoration: "underline" }}>
              Privacy Policy
            </Link>
            .
          </span>
        </label>
      )}
      <button
        type="button"
        onClick={handleDetect}
        disabled={!canDetect}
        className={`${styles.detectBtn} ${
          canDetect ? styles.detectBtnActive : styles.detectBtnDisabled
        }`}
      >
        {loading ? "Detecting..." : "Detect"}
      </button>

      {result && (
        <div className={styles.resultCard}>
          <h3 className={styles.resultTitle}>Result</h3>

          {result.detections?.length > 0 ? (
            result.detections.map((det, i) => (
              <p key={i} className={styles.resultLine}>
                Class: <b>{det.class}</b> | Confidence: <b>{(det.confidence * 100).toFixed(1)}%</b>
              </p>
            ))
          ) : (
            <p className={styles.resultLine}>No objects detected</p>
          )}
        </div>
      )}

      {/* Модальное окно для детального просмотра и Зума */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Панель управления зумом */}
          <div
            style={{
              position: "absolute",
              top: "20px",
              display: "flex",
              gap: "10px",
              zIndex: 10000,
            }}
          >
            <button
              onClick={handleZoomIn}
              style={{
                padding: "8px 16px",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              ➕ Zoom In
            </button>
            <button
              onClick={handleZoomOut}
              style={{
                padding: "8px 16px",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              ➖ Zoom Out
            </button>
            <button
              onClick={closeModal}
              style={{
                padding: "8px 16px",
                fontSize: "16px",
                cursor: "pointer",
                background: "#ff4d4d",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
              }}
            >
              ❌ Закрыть
            </button>
          </div>

          {/* Область с изображением */}
          <div
            style={{
              overflow: "auto",
              maxWidth: "90vw",
              maxHeight: "85vh",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <img
              src={asset(preview)}
              alt="Detailed View"
              style={{
                transform: `scale(${zoomLevel})`,
                transition: "transform 0.2s ease",
                maxHeight: "80vh",
                objectFit: "contain",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}