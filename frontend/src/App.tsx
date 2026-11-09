import { useEffect, useState} from 'react'

import{getSecurities} from './api/client'

import type {Security} from './types/api'

function App(){
    const[securities, setSecurities] = useState<Security[]>([])
    const [loading, setLoading] = useState(true)
    const[error,setError] = useState<string | null>(null)

    useEffect(()=>{
        getSecurities()
        .then(setSecurities)
        .catch((e: Error)=> setError(e.message))
        .finally(() => setLoading(false)
    }, [])

    return(
        <main>
            <h1>Portfolio Theorycrafter</h1>
            {loading && <p>Loading Tickers...</p>}
            {error && <p className="error">{error}</p>}

            {!loading && !!error &&(
                <>
                  <p>{securities.length} tickers availiable</p>
                  <table>
                    <thead>
                        <tr>
                            <th>Ticker</th>
                            <th>First date</th>
                            <th>Last date</th>
                            <th>Trading days</th>
                        </tr>
                    </thead>
                </table>
                <tbody>
                    {securities.map((s)=>(
                        <tr key={s.ticker}>
                            <td>{s.ticker}</td>
                            <td>{s.first_date}</td>
                            <td>{s.last_date}</td>
                            <td>{s.num_days.toLocaleString()}</td>
                        </tr>
            ))}
        </main>
    )
}