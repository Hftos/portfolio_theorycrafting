from fastapi import APIRouter, HTTPException

from ..db import DatabaseNotFound, list_securities
from ..schemas import Security

router = APIRouter()

@router.get("/securities", response_model=list[Security])
def securities() -> list[dict]:
    try:
        return list_securities()
    except DatabaseNotFound as e:
        raise HTTPException(status_code=503, detail=str(e))