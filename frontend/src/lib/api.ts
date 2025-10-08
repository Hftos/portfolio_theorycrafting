// frontend/src/lib/api.ts
export const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

export async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let text = "";
    try {
      text = await res.text();
    } catch {}
    // ⬇️ backticks (template literal), not quotes
    throw new Error(`Request failed: ${res.status} ${text}`);
  }

  return res.json() as Promise<T>;
}
