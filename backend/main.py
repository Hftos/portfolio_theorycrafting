from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import portfolio, securities

app= FastAPI(title="Portfolio Theorycrafter API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://localhost5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(portfolio.router, prefix="/api", tags=["portfolio"])
app.include_router(securities.router, prefix="/api", tags=["securities"])

@app.get("/api/health", tags =["health"])
def health()->dict:
    return {"status": "ok"}