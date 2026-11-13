"""Tests for POST /api/project, on a small throwaway database."""

import duckdb
import pandas as pd
import pytest
from fastapi.testclient import TestClient

from backend import db
from backend.main import app


# A throwaway database: STOCK and BOND from 2015 to 2021 (enough months to project from).
@pytest.fixture
def client(tmp_path, monkeypatch):
    path = tmp_path / "test.duckdb"
    con = duckdb.connect(str(path))
    con.execute("CREATE TABLE prices (ticker VARCHAR, date DATE, adj_close DOUBLE)")
    con.execute("CREATE TABLE securities (ticker VARCHAR, first_date DATE, last_date DATE, num_rows INTEGER, last_updated TIMESTAMP)")
    dates = pd.bdate_range("2015-01-01", "2021-12-31")
    rows = []
    for i, d in enumerate(dates):
        rows.append(("STOCK", d.date(), 100 * 1.0004 ** i * (1 + 0.05 * ((i % 40) / 40 - 0.5))))
        rows.append(("BOND", d.date(), 50 * 1.0001 ** i))
    con.executemany("INSERT INTO prices VALUES (?, ?, ?)", rows)
    con.execute("INSERT INTO securities SELECT ticker, MIN(date), MAX(date), COUNT(*), now() FROM prices GROUP BY ticker")
    con.close()
    monkeypatch.setattr(db, "DB_PATH", path)
    return TestClient(app)


def portfolio(name, **weights):
    return {"name": name, "holdings": [{"ticker": t, "weight": w} for t, w in weights.items()]}


def test_projection_shape(client):
    r = client.post("/api/project", json={
        "portfolios": [portfolio("Mine", STOCK=60, BOND=40), portfolio("Bonds", BOND=100)],
        "horizon_years": 10,
    })
    assert r.status_code == 200
    body = r.json()
    assert body["model"] == "bootstrap"
    assert body["paths"] == 5000
    assert body["history_start"] == "2015-01-01"
    assert [p["name"] for p in body["portfolios"]] == ["Mine", "Bonds"]
    bands = body["portfolios"][0]["bands"]
    assert len(bands) == 10 * 12 + 1                 # month 0 through month 120
    assert bands[0]["p50"] == pytest.approx(10_000)  # everyone starts at the same amount


def test_contributions_are_counted_as_invested(client):
    r = client.post("/api/project", json={
        "portfolios": [portfolio("A", BOND=100)], "horizon_years": 5, "monthly_contribution": 200,
    })
    assert r.json()["total_invested"] == pytest.approx(10_000 + 200 * 60)


def test_bad_projection_settings_are_rejected(client):
    base = {"portfolios": [portfolio("A", BOND=100)]}
    assert client.post("/api/project", json={**base, "model": "garch"}).status_code == 422
    assert client.post("/api/project", json={**base, "horizon_years": 0}).status_code == 422
    assert client.post("/api/project", json={**base, "horizon_years": 41}).status_code == 422
    assert client.post("/api/project", json={**base, "return_adjustment": -0.5}).status_code == 422


def test_too_little_history(client):
    r = client.post("/api/project", json={"portfolios": [portfolio("A", BOND=100)], "start_date": "2021-06-01"})
    assert r.status_code == 400
    assert "at least 24 months" in r.json()["detail"]