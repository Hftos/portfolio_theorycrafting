import os
from pathlib import Path
from dotenv import load_dotenv

PROJECT_ROOT= Path(__file__).resolve().parent.parent

load_dotenv(PROJECT_ROOT / ".env")

TIINGO_API_TOKEN = os.getenv("TIINGO_API_TOKEN", "")
DB_PATH = PROJECT_ROOT / os.getenv("DB_PATH", "data/market.duckdb")
DEFAULT_START_DATE = os.getenv("DEFAULT_START_DATE", "1990-01-01")