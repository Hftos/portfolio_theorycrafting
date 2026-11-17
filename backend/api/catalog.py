"""GET /api/catalog: the beginner picker's columns, each security marked loaded or not."""

from fastapi import APIRouter, HTTPException

from ..catalog import CATALOG, CATEGORIES
from ..db import DatabaseNotFound, list_securities
from ..schemas import CatalogCategory

router = APIRouter()


@router.get("/catalog", response_model=list[CatalogCategory])
def catalog() -> list[dict]:
    # --- What's actually in the database: names and start dates come from here ---
    try:
        loaded = {s["ticker"]: s for s in list_securities()}
    except DatabaseNotFound as e:
        raise HTTPException(status_code=503, detail=str(e))

    # --- Walk the catalog column by column, group by group, adding the data details ---
    out = []
    for category in CATEGORIES:
        groups = []
        for group_name, items in CATALOG[category["id"]].items():
            securities = []
            for ticker, description in items:
                info = loaded.get(ticker)
                securities.append({
                    "ticker": ticker,
                    "description": description,
                    "name": info["name"] if info else None,
                    "first_date": info["first_date"] if info else None,
                    # Not loaded yet: the picker shows it, but it can't be chosen until the pipeline fetches it.
                    "available": info is not None,
                })
            groups.append({"name": group_name, "securities": securities})
        out.append({**category, "groups": groups})
    return out