"""GET /api/presets: the built-in comparison portfolios, and whether their data is loaded."""

from fastapi import APIRouter, HTTPException

from ..db import DatabaseNotFound, list_securities
from ..presets import PRESETS
from ..schemas import Preset

router = APIRouter()


@router.get("/presets", response_model=list[Preset])
def presets() -> list[dict]:
    try:
        securities = {s["ticker"]: s for s in list_securities()}
    except DatabaseNotFound as e:
        raise HTTPException(status_code=503, detail=str(e))

    out = []
    for p in PRESETS:
        tickers = list(p["holdings"])
        missing = [t for t in tickers if t not in securities]
        # The preset can start once its youngest fund has data.
        first_date = None if missing else max(securities[t]["first_date"] for t in tickers)
        out.append({
            "id": p["id"],
            "name": p["name"],
            "description": p["description"],
            "holdings": [{"ticker": t, "weight": w} for t, w in p["holdings"].items()],
            "available": not missing,
            "missing": missing,
            "first_date": first_date,
        })
    return out