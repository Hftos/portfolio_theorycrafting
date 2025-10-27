import type { SimRequest, SimResponse } from "../types/api";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

async function postJSON<T>(endpoint: string, body: unknown): Promise<T> {
  const response = await fetch(API_BASE + endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error("HTTP " + response.status + ": " + (errorText || response.statusText));
  }

  return response.json();
}

export async function runSimulation(request: SimRequest): Promise<SimResponse> {
  return postJSON<SimResponse>("/simulate", request);
}
