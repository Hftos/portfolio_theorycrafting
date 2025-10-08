export const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

export async function postJSON<T>(path: string, body: unknown): Promise<T>{
    const res=  await fetch('${API_BASE}${path}',{
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Request failed: ${res.status}');
    return res.json() as Promise<T>;
}