"use client";

import { useEffect, useState } from "react";
import styles from "./catalog.module.css";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const REGIONS = [
  ["cervical", "Cervical"],
  ["thoracic", "Thoracic"],
  ["lumbar", "Lumbar"],
  ["sacrum", "Sacrum"],
  ["pelvis", "Pelvis"],
  ["femoral", "Femoral heads"],
];
const range = (p, a, b) =>
  Array.from({ length: b - a + 1 }, (_, i) => `${p}${a + i}`);
const CLASSES = [
  ...range("C", 2, 7),
  ...range("Th", 1, 12),
  ...range("L", 1, 5),
  "S1",
  "PB",
  "FH",
];
const SORTS = [
  ["newest", "Newest first"],
  ["confidence", "Highest confidence"],
  ["count", "Most structures"],
];
const DEFAULTS = {
  regions: [],
  mode: "contains",
  classes: [],
  min_conf: 0,
  min_count: 0,
  sort: "newest",
  page: 1,
};

function regionOf(name) {
  if (/^C\d/.test(name)) return "Cervical";
  if (/^Th\d/.test(name)) return "Thoracic";
  if (/^L\d/.test(name)) return "Lumbar";
  if (name === "S1") return "Sacrum";
  if (name === "PB") return "Pelvis";
  if (name === "FH") return "Femoral";
  return null;
}

function buildQuery(f) {
  const p = new URLSearchParams();
  if (f.regions.length) p.set("regions", f.regions.join(","));
  if (f.regions.length && f.mode === "only") p.set("mode", "only");
  if (f.classes.length) p.set("classes", f.classes.join(","));
  if (f.min_conf > 0) p.set("min_conf", String(f.min_conf));
  if (f.min_count > 0) p.set("min_count", String(f.min_count));
  if (f.sort !== "newest") p.set("sort", f.sort);
  if (f.page > 1) p.set("page", String(f.page));
  return p.toString();
}

const toggle = (list, v) =>
  list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

const badgeClass = (c) =>
  c >= 0.7 ? styles.badgeGood : c >= 0.5 ? styles.badgeMid : styles.badgeLow;

export default function CatalogPage() {
  const [f, setF] = useState(DEFAULTS);
  const [ready, setReady] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);
  const [open, setOpen] = useState(null);
  const [confirm, setConfirm] = useState(false);

  // Читаем фильтры из адресной строки (ссылку с фильтрами можно отправить)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const list = (k) => (p.get(k) || "").split(",").filter(Boolean);
    setF({
      regions: list("regions").filter((r) => REGIONS.some(([k]) => k === r)),
      mode: p.get("mode") === "only" ? "only" : "contains",
      classes: list("classes").filter((c) => CLASSES.includes(c)),
      min_conf: Math.min(1, Math.max(0, parseFloat(p.get("min_conf")) || 0)),
      min_count: Math.max(0, parseInt(p.get("min_count"), 10) || 0),
      sort: SORTS.some(([k]) => k === p.get("sort")) ? p.get("sort") : "newest",
      page: Math.max(1, parseInt(p.get("page"), 10) || 1),
    });
    setReady(true);
  }, []);

  // Запрос к серверу с задержкой 300 мс и обновлением адресной строки
  useEffect(() => {
    if (!ready) return;
    const qs = buildQuery(f);
    window.history.replaceState(
      null,
      "",
      qs ? `?${qs}` : window.location.pathname
    );
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/api/catalog?${qs}`, {
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error("bad response");
        setData(await res.json());
        setError(false);
      } catch (e) {
        if (e.name !== "AbortError") setError(true);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [f, ready, reload]);

  const update = (patch) => setF((prev) => ({ ...prev, page: 1, ...patch }));
  const setPage = (n) => setF((prev) => ({ ...prev, page: n }));

  async function openImage(id) {
    setConfirm(false);
    try {
      const res = await fetch(`${API}/api/catalog/${id}`);
      if (res.ok) setOpen(await res.json());
    } catch {
      setError(true);
    }
  }

  async function removeImage() {
    await fetch(`${API}/api/catalog/${open.id}`, { method: "DELETE" });
    setOpen(null);
    setConfirm(false);
    setReload((n) => n + 1);
  }

  const items = data?.items || [];
  const filtered =
    f.regions.length > 0 ||
    f.classes.length > 0 ||
    f.min_conf > 0 ||
    f.min_count > 0;

  return (
    <div className={styles.root}>
      <h1 className={styles.title}>Catalog</h1>

      <div className={styles.layout}>
        {/* ---------- Фильтры ---------- */}
        <aside className={styles.filters}>
          <h2 className={styles.filterTitle}>Region</h2>
          <div className={styles.chips}>
            {REGIONS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`${styles.chip} ${
                  f.regions.includes(key) ? styles.chipOn : ""
                }`}
                onClick={() => update({ regions: toggle(f.regions, key) })}
              >
                {label}
              </button>
            ))}
          </div>

          <div className={styles.segment}>
            {[
              ["contains", "Contains"],
              ["only", "Only"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`${styles.segBtn} ${
                  f.mode === key ? styles.segOn : ""
                }`}
                onClick={() => update({ mode: key })}
              >
                {label}
              </button>
            ))}
          </div>

          <h2 className={styles.filterTitle}>Specific structures</h2>
          <div className={styles.grid}>
            {CLASSES.map((c) => (
              <button
                key={c}
                type="button"
                className={`${styles.cell} ${
                  f.classes.includes(c) ? styles.chipOn : ""
                }`}
                onClick={() => update({ classes: toggle(f.classes, c) })}
              >
                {c}
              </button>
            ))}
          </div>

          <h2 className={styles.filterTitle}>
            Minimum model confidence
            <span className={styles.value}>
              {Math.round(f.min_conf * 100)}%
            </span>
          </h2>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={Math.round(f.min_conf * 100)}
            onChange={(e) => update({ min_conf: Number(e.target.value) / 100 })}
            className={styles.slider}
          />

          <h2 className={styles.filterTitle}>
            Minimum structures found
            <span className={styles.value}>{f.min_count}</span>
          </h2>
          <input
            type="range"
            min="0"
            max="26"
            step="1"
            value={f.min_count}
            onChange={(e) => update({ min_count: Number(e.target.value) })}
            className={styles.slider}
          />

          <div className={styles.filterFoot}>
            <span className={styles.count}>
              {data ? `${data.total} images` : "…"}
            </span>
            <button
              type="button"
              className={styles.reset}
              onClick={() => setF({ ...DEFAULTS, sort: f.sort })}
              disabled={!filtered}
            >
              Reset filters
            </button>
          </div>
        </aside>

        {/* ---------- Результаты ---------- */}
        <section>
          <div className={styles.toolbar}>
            <span className={styles.hint}>
              Confidence is the model&apos;s own score, not image quality.
            </span>
            <select
              className={styles.select}
              value={f.sort}
              onChange={(e) => update({ sort: e.target.value })}
            >
              {SORTS.map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {error ? (
            <div className={styles.empty}>
              Cannot reach the server. Is the backend running?
            </div>
          ) : loading && !data ? (
            <div className={styles.cards}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={`${styles.card} ${styles.skeleton}`} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className={styles.empty}>No images match these filters</div>
          ) : (
            <div
              className={styles.cards}
              style={{ opacity: loading ? 0.6 : 1 }}
            >
              {items.map((it) => {
                const regions = [...new Set(it.classes.map(regionOf))].filter(
                  Boolean
                );
                return (
                  <button
                    key={it.id}
                    type="button"
                    className={styles.card}
                    onClick={() => openImage(it.id)}
                  >
                    <div className={styles.thumbWrap}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`${API}${it.thumb_url}`}
                        alt=""
                        className={styles.thumb}
                      />
                    </div>
                    <div className={styles.cardBody}>
                      <div className={styles.cardTop}>
                        <span className={styles.name}>{it.original_name}</span>
                        <span
                          className={`${styles.badge} ${badgeClass(
                            it.mean_conf
                          )}`}
                        >
                          {Math.round(it.mean_conf * 100)}%
                        </span>
                      </div>
                      <div className={styles.meta}>
                        {new Date(it.uploaded_at).toLocaleDateString()} ·{" "}
                        {it.num_detections} structures
                      </div>
                      <div className={styles.tags}>
                        {regions.map((r) => (
                          <span key={r} className={styles.tag}>
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {data && data.pages > 1 && (
            <div className={styles.pager}>
              <button
                type="button"
                className={styles.pageBtn}
                disabled={data.page <= 1}
                onClick={() => setPage(data.page - 1)}
              >
                ←
              </button>
              <span className={styles.pageInfo}>
                {data.page} / {data.pages}
              </span>
              <button
                type="button"
                className={styles.pageBtn}
                disabled={data.page >= data.pages}
                onClick={() => setPage(data.page + 1)}
              >
                →
              </button>
            </div>
          )}
        </section>
      </div>

      {/* ---------- Окно просмотра ---------- */}
      {open && (
        <div className={styles.overlay} onClick={() => setOpen(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalImg}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${API}${open.preview_url}`} alt="Annotated X-ray" />
            </div>
            <div className={styles.modalSide}>
              <h3 className={styles.modalTitle}>{open.original_name}</h3>
              <div className={styles.list}>
                {open.detections.map((d, i) => (
                  <p key={i} className={styles.listLine}>
                    <b>{d.class}</b> · {(d.confidence * 100).toFixed(1)}%
                  </p>
                ))}
              </div>
              <div className={styles.modalFoot}>
                {confirm ? (
                  <>
                    <button
                      type="button"
                      className={styles.danger}
                      onClick={removeImage}
                    >
                      Yes, delete
                    </button>
                    <button
                      type="button"
                      className={styles.ghost}
                      onClick={() => setConfirm(false)}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className={styles.ghost}
                      onClick={() => setConfirm(true)}
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      className={styles.close}
                      onClick={() => setOpen(null)}
                    >
                      Close
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
