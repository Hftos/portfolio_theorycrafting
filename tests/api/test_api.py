"""API tests. Each test gets its own small temporary database, so your real data is never touched."""

import duckdb
import pandas as pd
import pytest
from fastapi.testclient import TestClient

from backend import db
from backend.main import app


@pytest.fixture
def client(tmp_path, monkeypatch):
    """A test client pointed at a throwaway database with two tickers."""
    path = tmp_path / "test.duckdb"
    con = duckdb.connect(str(path))
    con.execute("CREATE TABLE prices (ticker VARCHAR, date DATE, adj_close DOUBLE)")
    con.execute("CREATE TABLE securities (ticker VARCHAR, first_date DATE, last_date DATE, num_rows INTEGER, last_updated TIMESTAMP)")

    dates = pd.bdate_range("2020-01-01", "2021-12-31")
    stock = [100 * 1.0005 ** i for i in range(len(dates))]            # steady climb
    bond = [50 + (i % 10) * 0.1 for i in range(len(dates))]           # small wiggles
    rows = [("STOCK", d.date(), p) for d, p in zip(dates, stock)] + \
           [("BOND", d.date(), p) for d, p in zip(dates, bond)]
    con.executemany("INSERT INTO prices VALUES (?, ?, ?)", rows)
    con.execute("""
        INSERT INTO securities
        SELECT ticker, MIN(date), MAX(date), COUNT(*), now() FROM prices GROUP BY ticker
    """)
    con.close()

    monkeypatch.setattr(db, "DB_PATH", path)
    return TestClient(app)


def test_health(client):
    assert client.get("/api/health").json() == {"status": "ok"}


def test_securities_lists_tickers(client):
    data = client.get("/api/securities").json()
    assert [s["ticker"] for s in data] == ["BOND", "STOCK"]
    assert data[0]["first_date"] == "2020-01-01"


def test_backtest_happy_path(client):
    r = client.post("/api/backtest", json={
        "holdings": [{"ticker": "stock", "weight": 60}, {"ticker": "BOND", "weight": 40}],
        "rebalance": "annual",
    })
    assert r.status_code == 200
    body = r.json()
    assert body["weights"] == {"STOCK": 0.6, "BOND": 0.4}     # lowercase cleaned, weights normalized
    assert body["start_date"] == "2020-01-01"
    assert body["growth"][0]["value"] > 0
    assert len(body["growth"]) == len(body["drawdown"])
    assert set(body["metrics"]) == {"total_return", "cagr", "volatility", "sharpe_ratio", "max_drawdown"}
    assert body["correlation"]["STOCK"]["STOCK"] == pytest.approx(1.0)


def test_date_range_is_respected(client):
    r = client.post("/api/backtest", json={
        "holdings": [{"ticker": "STOCK", "weight": 1}],
        "start_date": "2021-01-01",
        "end_date": "2021-06-30",
    })
    body = r.json()
    assert body["start_date"] >= "2021-01-01"
    assert body["end_date"] <= "2021-06-30"


def test_unknown_ticker_gives_400(client):
    r = client.post("/api/backtest", json={"holdings": [{"ticker": "NOPE", "weight": 100}]})
    assert r.status_code == 400
    assert "NOPE" in r.json()["detail"]


def test_bad_input_is_rejected_before_our_code_runs(client):
    # Negative weight, unknown rebalance option, duplicate ticker: all 422 from FastAPI
    assert client.post("/api/backtest", json={"holdings": [{"ticker": "STOCK", "weight": -5}]}).status_code == 422
    assert client.post("/api/backtest", json={"holdings": [{"ticker": "STOCK", "weight": 1}], "rebalance": "daily"}).status_code == 422
    assert client.post("/api/backtest", json={"holdings": [{"ticker": "STOCK", "weight": 1}, {"ticker": "stock", "weight": 1}]}).status_code == 422


def test_missing_database_gives_clear_error(tmp_path, monkeypatch):
    monkeypatch.setattr(db, "DB_PATH", tmp_path / "does_not_exist.duckdb")
    r = TestClient(app).get("/api/securities")
    assert r.status_code == 503
    assert "pipeline.run" in r.json()["detail"]