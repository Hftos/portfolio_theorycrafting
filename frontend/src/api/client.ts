// The only file that talks to the backend.

import type {
  BacktestRequest,
  BacktestResponse,
  CompareRequest,
  CompareResponse,
  Preset,
  Security,
} from '../types/api'

export class ApiError extends Error {}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
  } catch {
    throw new ApiError('Could not reach the backend. Is uvicorn running?')
  }

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response))
  }
  return response.json() as Promise<T>
}

// FastAPI sends errors two ways:
//   400/503: { "detail": "No price data for: NOPE" }
//   422:     { "detail": [ { "loc": [...], "msg": "..." }, ... ] }
async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json()
    if (typeof body.detail === 'string') return body.detail
    if (Array.isArray(body.detail)) {
      return body.detail.map((e: { msg: string }) => e.msg).join('; ')
    }
  } catch {
    // body wasn't JSON; fall through
  }
  // A server error with no FastAPI message means the request never reached FastAPI.
  // In development that's usually the Vite proxy reporting that the backend is down.
  if (response.status >= 500) {
    return 'Could not reach the backend. Is uvicorn running?'
  }
  return `Request failed (HTTP ${response.status})`
}

export function getSecurities(): Promise<Security[]> {
  return request<Security[]>('/api/securities')
}

export function runBacktest(req: BacktestRequest): Promise<BacktestResponse> {
  return request<BacktestResponse>('/api/backtest', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

export function getPresets(): Promise<Preset[]> {
  return request<Preset[]>('/api/presets')
}

export function runCompare(req: CompareRequest): Promise<CompareResponse> {
  return request<CompareResponse>('/api/compare', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}