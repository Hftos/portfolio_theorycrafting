"""The tickers the pipeline loads with --catalog.

They come from the curated catalog in backend/catalog.py, so the picker and the
database always agree on what should be available. To add a security, add it to
the catalog; it's picked up here automatically.

At 2 Tiingo requests per ticker (prices + name), a full catalog load is far more than
the free plan's 50 requests an hour. The loader is resumable: run it again (or use
--wait) and it continues where it stopped.
"""

from backend.catalog import all_tickers

CORE_TICKERS = all_tickers()