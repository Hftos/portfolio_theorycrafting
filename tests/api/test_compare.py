"""Tests for POST /api/compare and GET /api/presets, on a small throwaway database."""

import duckdb
import pandas as pd
import pytest
from fastapi.testclient import TestClient

from backend import db
from backend.main import app


@pytest.fixture
def client(tmp_path, monkeypatch):
    """STOCK and BOND cover 2020-2021; NEW only starts in 2021."""
    path = tmp_path / "test.duckdb"
    con = duckdb.connect(str(path))
    con.execute("CREATE TABLE prices (ticker VARCHAR, date DATE, adj_close DOUBLE)")
    con.execute("CREATE TABLE securities (ticker VARCHAR, first_date DATE, last_date DATE, num_rows INTEGER, last_updated TIMESTAMP)")

    dates = pd.bdate_range("2020-01-01", "2021-12-31")
    rows = []
    for i, d in enumerate(dates):
        rows.append(("STOCK", d.date(), 100 * 1.0005 ** i + (i % 7)))
        rows.append(("BOND", d.date(), 50 + (i % 10) * 0.1))
        if d.year == 2021:
            rows.append(("NEW", d.date(), 20 + (i % 5)))
    con.executemany("INSERT INTO prices VALUES (?, ?, ?)", rows)
    con.execute("""
        INSERT INTO securities
        SELECT ticker, MIN(date), MAX(date), COUNT(*), now() FROM prices GROUP BY ticker
    """)
    con.close()

    monkeypatch.setattr(db, "DB_PATH", path)
    return TestClient(app)


def portfolio(name, **weights):
    return {"name": name, "holdings": [{"ticker": t, "weight": w} for t, w in weights.items()]}


# ---------- /api/compare ----------

def test_compare_two_portfolios(client):
    r = client.post("/api/compare", json={
        "portfolios": [portfolio("Mine", STOCK=70, BOND=30), portfolio("Bonds", BOND=100)],
    })
    assert r.status_code == 200
    body = r.json()
    assert [p["name"] for p in body["portfolios"]] == ["Mine", "Bonds"]
    assert body["start_date"] == "2020-01-01"
    mine, bonds = body["portfolios"]
    assert mine["weights"] == {"STOCK": 0.7, "BOND": 0.3}
    assert len(mine["growth"]) == len(bonds["growth"])          # same dates
    assert mine["growth"][0]["date"] == bonds["growth"][0]["date"]


def test_compare_starts_when_the_youngest_fund_starts(client):
    r = client.post("/api/compare", json={
        "portfolios": [portfolio("Old", STOCK=100), portfolio("Young", NEW=100)],
    })
    body = r.json()
    assert body["start_date"] >= "2021-01-01"
    assert body["limited_by"] == "NEW"


def test_compare_rejects_duplicate_names(client):
    r = client.post("/api/compare", json={
        "portfolios": [portfolio("Same", STOCK=100), portfolio("Same", BOND=100)],
    })
    assert r.status_code == 422


def test_compare_rejects_too_many_portfolios(client):
    r = client.post("/api/compare", json={
        "portfolios": [portfolio(f"P{i}", STOCK=100) for i in range(7)],
    })
    assert r.status_code == 422


def test_unknown_ticker_message(client):
    r = client.post("/api/compare", json={"portfolios": [portfolio("A", NOPE=100)]})
    assert r.status_code == 400
    assert r.json()["detail"] == "Not in the database: NOPE"


def test_date_range_with_no_data_message(client):
    r = client.post("/api/compare", json={
        "portfolios": [portfolio("A", STOCK=100)],
        "start_date": "2030-01-01",
    })
    assert r.status_code == 400
    assert r.json()["detail"] == "No prices for STOCK in the chosen date range."


# ---------- /api/presets ----------

def test_presets_report_what_is_missing(client):
    presets = client.get("/api/presets").json()
    sp500 = next(p for p in presets if p["id"] == "sp500")
    # The test database has no SPY, so the preset is listed but unavailable.
    assert sp500["available"] is False
    assert sp500["missing"] == ["SPY"]
    assert sp500["holdings"] == [{"ticker": "SPY", "weight": 100}]


def test_every_preset_has_weights_that_add_to_100():
    from backend.presets import PRESETS
    for p in PRESETS:
        assert sum(p["holdings"].values()) == pytest.approx(100), p["name"]


def test_chart_data_is_weekly_but_keeps_the_worst_drawdown(client):
    r = client.post("/api/compare", json={"portfolios": [portfolio("A", STOCK=60, BOND=40)]})
    p = r.json()["portfolios"][0]
    # ~2 years of trading days (~520) become ~105 weekly points
    assert 100 <= len(p["growth"]) <= 110
    assert len(p["growth"]) == len(p["drawdown"])
    # The worst weekly drawdown must equal the exact daily max drawdown
    assert min(pt["value"] for pt in p["drawdown"]) == pytest.approx(p["metrics"]["max_drawdown"])