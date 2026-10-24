// Адрес бэкенда и префикс для статики (GitHub Pages живёт в подпапке)
export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
).replace(/\/$/, "");

export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

// Добавляет префикс только к путям вида "/file.png"; ссылки http:, data:, blob: не трогает
export function asset(p) {
  if (typeof p !== "string") return p;
  return p.startsWith("/") && !p.startsWith("//") ? BASE_PATH + p : p;
}
