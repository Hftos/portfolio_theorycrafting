"""Creates the web app and plugs in the routes. No finance logic lives here.

Run from the project root:
    uvicorn backend.main:app --reload
Then open http://localhost:8000/docs
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import portfolio, presets, securities

app = FastAPI(title="Portfolio Theorycrafter API", version="0.1.0")

# The React dev server runs on a different port (5173), and browsers block
# cross-port requests unless the API explicitly allows them.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(portfolio.router, prefix="/api", tags=["portfolio"])
app.include_router(securities.router, prefix="/api", tags=["securities"])
app.include_router(presets.router, prefix="/api", tags=["presets"])


@app.get("/api/health", tags=["health"])
def health() -> dict:
    return {"status": "ok"}