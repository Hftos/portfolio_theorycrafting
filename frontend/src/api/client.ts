import type { BacktestRequest, BacktestResponse, Security } from "../types/api"

export class ApiError extends Error{}

async function request<T>(path: string, option?: RequestInit): Promise<T>{
    let response: Response
    try{
        response= await fetch(path,{
            headers:{'Content-Type': 'application/json'},
            ...option,
        })
    } catch {
        throw new ApiError('Could not reach the backend. Check uvicorn.')
    }

    if (!response.ok){
        throw new ApiError(await readErrorMessage(response))
    }
    return response.json() as Promise<T>
}

async function readErrorMessage(response: Response): Promise<string>{
    try{
        const body = await response.json()
        if (typeof body.detail === 'string') return body.detail
        if(Array.isArray(body.detail)){
            return body.detail.map((e:{msg:string})=>e.msg).join(';')
        }
    } catch {

    }
    return 'Request failed (HTTP ${response.status})'
}

export function getSecurities(): Promise<Security[]>{
    return request<Security[]>('/api/securities')
}

export function runBacktest(req: BacktestRequest): Promise<BacktestResponse>{
    return request<BacktestResponse>('/api/response',{
        method: 'POST',
        body: JSON.stringify(req)
    }
    )
}