function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

export function getApiBaseUrl(): string {
  const raw =
    (import.meta as any).env?.VITE_API_URL ??
    (import.meta as any).env?.VITE_API_BASE_URL ??
    "";

  const base = normalizeBaseUrl(String(raw || ""));
  if (!base) return "http://localhost:8000";
  return base;
}

export function toAbsoluteApiUrl(pathOrUrl: string): string {
  const raw = String(pathOrUrl || "").trim();
  if (!raw) return raw;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  const base = getApiBaseUrl();
  if (raw.startsWith("/")) return `${base}${raw}`;
  return `${base}/${raw}`;
}

