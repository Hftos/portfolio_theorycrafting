
# ---------------------------------------------------------------------------
# The columns, and what each kind of asset does in a portfolio.
# ---------------------------------------------------------------------------
CATEGORIES = [
    {
        "id": "stocks",
        "label": "Stocks",
        "description": (
            "Ownership in companies. Historically the highest long-run growth of the major asset classes, "
            "with the deepest falls along the way: drops of 30 to 50% have happened several times."
        ),
    },
    {
        "id": "bonds",
        "label": "Bonds",
        "description": (
            "Loans to governments and companies that pay interest. Usually steadier than stocks, and "
            "high-quality government bonds have often held up or risen when stocks fell. Longer-term bonds "
            "swing more when interest rates change."
        ),
    },
    {
        "id": "real_estate",
        "label": "Real estate",
        "description": (
            "Property owned through REITs: companies that own buildings and pay out most of their rent as "
            "dividends. They trade like stocks, so they can fall with the stock market in a crisis."
        ),
    },
    {
        "id": "commodities",
        "label": "Commodities",
        "description": (
            "Raw materials such as gold, oil and crops. They produce no income, but they have sometimes done "
            "well during inflation, when stocks and bonds struggled. Many funds hold futures contracts, whose "
            "returns can differ a lot from the material's price."
        ),
    },
    {
        "id": "alternatives",
        "label": "Alternatives",
        "description": (
            "Strategies that try to behave differently from ordinary stocks and bonds: trend-following, "
            "hedging, infrastructure, private equity, crypto. Many of these funds are young, so adding one "
            "can shorten how far back a backtest can go."
        ),
    },
    {
        "id": "multi_asset",
        "label": "All-in-one",
        "description": (
            "Ready-made mixes of stocks and bonds in a single fund, rebalanced for you. Useful as a benchmark: "
            "is your own portfolio doing better than a simple off-the-shelf mix?"
        ),
    },
    {
        "id": "cash",
        "label": "Cash-like",
        "description": (
            "Very short-term US government debt: about as close to cash as an investment gets. Barely moves "
            "in price and pays roughly the current short-term interest rate."
        ),
    },
]


# ---------------------------------------------------------------------------
# The securities, by column and group.
# ---------------------------------------------------------------------------
CATALOG: dict[str, dict[str, list[tuple[str, str]]]] = {
    # -----------------------------------------------------------------------
    "stocks": {
        "US broad market": [
            ("SPY", "The S&P 500: about 500 of the largest US companies. The classic benchmark."),
            ("VOO", "Vanguard's S&P 500 fund. Same index as SPY, at a lower cost."),
            ("VTI", "The total US stock market: large, mid-size and small companies together."),
            ("QQQ", "The Nasdaq-100: the 100 largest non-financial Nasdaq companies, heavy in technology."),
            ("DIA", "The Dow Jones Industrial Average: 30 large, well-known US companies."),
            ("RSP", "The S&P 500 with every company weighted equally, instead of by size."),
            ("VFIAX", "Vanguard 500 Index (mutual fund). The S&P 500 in mutual fund form."),
            ("FXAIX", "Fidelity 500 Index (mutual fund). The S&P 500 in mutual fund form."),
            ("VTSAX", "Vanguard Total Stock Market Index (mutual fund). The whole US market."),
        ],
        "US size and style": [
            ("IJH", "Mid-size US companies (the S&P MidCap 400)."),
            ("IWM", "Small US companies (the Russell 2000)."),
            ("IWD", "Large US value stocks: companies priced cheaply relative to their earnings and assets."),
            ("IWF", "Large US growth stocks: companies expected to grow faster than average."),
            ("IJS", "Small US value stocks (S&P SmallCap 600 Value)."),
            ("AVUV", "Small US value stocks, selected for profitability as well as cheapness. Started in 2019."),
            ("MTUM", "US momentum stocks: shares that have risen most over the past year."),
            ("QUAL", "US quality stocks: companies with strong profits and low debt."),
            ("USMV", "US minimum-volatility stocks: chosen to swing less than the overall market."),
            ("SCHD", "US companies with high, consistent dividends."),
            ("VIG", "US companies with a long record of raising their dividends."),
        ],
        "International developed": [
            ("VXUS", "All stocks outside the US, developed and emerging markets together."),
            ("VTIAX", "Vanguard Total International Stock Index (mutual fund). All stocks outside the US."),
            ("VEA", "Developed markets outside the US: Europe, Japan, Canada, Australia and more."),
            ("EFA", "Developed markets in Europe, Australasia and the Far East (excludes Canada)."),
            ("VGK", "European stocks."),
            ("EWJ", "Japanese stocks."),
            ("EWU", "UK stocks."),
            ("EWG", "German stocks."),
            ("EWQ", "French stocks."),
            ("EWP", "Spanish stocks."),
            ("EWL", "Swiss stocks."),
            ("EWC", "Canadian stocks."),
            ("EWA", "Australian stocks."),
        ],
        "Emerging markets": [
            ("VWO", "Emerging markets: China, India, Taiwan, Brazil and others."),
            ("EEM", "Emerging markets (iShares). Similar to VWO, with a longer history."),
            ("MCHI", "Chinese stocks."),
            ("INDA", "Indian stocks."),
            ("EWT", "Taiwanese stocks, heavy in semiconductors."),
            ("EWZ", "Brazilian stocks."),
            ("EWW", "Mexican stocks."),
        ],
        "Global": [
            ("VT", "Every major stock market in the world in one fund, US and international."),
            ("ACWI", "Large and mid-size companies across developed and emerging markets."),
        ],
        "US sectors": [
            ("XLK", "US technology companies."),
            ("SMH", "Semiconductor (chip) companies. Concentrated and volatile."),
            ("XLF", "US banks, insurers and other financial companies."),
            ("XLV", "US health care companies."),
            ("XLE", "US oil and gas companies."),
            ("XLI", "US industrial companies: manufacturers, airlines, railroads."),
            ("XLY", "US consumer discretionary: retailers, carmakers, restaurants."),
            ("XLP", "US consumer staples: food, drinks, household goods. Tends to be steadier."),
            ("XLU", "US utilities: electricity and gas providers. Steady and dividend-heavy."),
            ("XLB", "US materials companies: chemicals, mining, packaging."),
            ("XLC", "US communication services: media, telecom and internet platforms. Started in 2018."),
        ],
        "Popular companies": [
            ("AAPL", "Apple. A single company: far riskier than a diversified fund."),
            ("MSFT", "Microsoft."),
            ("NVDA", "Nvidia."),
            ("AMZN", "Amazon."),
            ("GOOGL", "Alphabet (Google)."),
            ("META", "Meta Platforms (Facebook). Listed since 2012."),
            ("TSLA", "Tesla. Listed since 2010; extremely volatile."),
            ("JPM", "JPMorgan Chase."),
            ("V", "Visa. Listed since 2008."),
            ("JNJ", "Johnson & Johnson."),
            ("PG", "Procter & Gamble."),
            ("KO", "Coca-Cola."),
            ("XOM", "ExxonMobil."),
            ("WMT", "Walmart."),
            ("COST", "Costco."),
        ],
    },
    # -----------------------------------------------------------------------
    "bonds": {
        "US total market": [
            ("AGG", "The whole US investment-grade bond market: Treasuries, mortgages and corporate bonds."),
            ("BND", "Vanguard's total US bond market fund. Similar to AGG."),
            ("VBTLX", "Vanguard Total Bond Market Index (mutual fund). The whole US bond market."),
        ],
        "US Treasuries": [
            ("SHY", "US government bonds maturing in 1 to 3 years. Very steady."),
            ("IEI", "US government bonds maturing in 3 to 7 years."),
            ("IEF", "US government bonds maturing in 7 to 10 years."),
            ("TLT", "US government bonds maturing in 20+ years. Swings sharply when interest rates change."),
            ("VGLT", "Long-term US government bonds (Vanguard)."),
            ("EDV", "Very long-term zero-coupon US government bonds. Among the most rate-sensitive bond funds."),
            ("GOVT", "US government bonds across all maturities."),
        ],
        "Inflation-protected": [
            ("TIP", "TIPS: US government bonds whose value rises with inflation."),
            ("SCHP", "TIPS (Schwab). Similar to TIP."),
            ("VTIP", "Short-term TIPS: inflation protection with smaller price swings."),
        ],
        "US corporate": [
            ("LQD", "Investment-grade corporate bonds: loans to financially strong US companies."),
            ("VCIT", "Intermediate-term investment-grade corporate bonds."),
            ("HYG", "High-yield ('junk') corporate bonds: higher interest, higher default risk. Falls with stocks in crises."),
            ("JNK", "High-yield corporate bonds (SPDR). Similar to HYG."),
            ("BKLN", "Senior bank loans: floating-rate loans to companies, so less sensitive to rising rates."),
        ],
        "US municipal": [
            ("MUB", "Bonds from US states and cities. Interest is generally free from federal income tax."),
        ],
        "International": [
            ("BNDX", "Bonds from governments and companies outside the US, hedged back to dollars to remove currency swings."),
            ("BWX", "Government bonds of developed countries outside the US, unhedged: currency moves affect returns."),
            ("IGOV", "Government bonds of developed countries outside the US, unhedged (iShares)."),
        ],
        "Emerging markets": [
            ("EMB", "Emerging-market government bonds issued in US dollars."),
            ("EMLC", "Emerging-market government bonds in local currencies: adds currency risk and potential return."),
        ],
    },
    # -----------------------------------------------------------------------
    "real_estate": {
        "US": [
            ("VNQ", "US REITs: companies owning offices, apartments, warehouses, data centers and more."),
            ("IYR", "US real estate companies (iShares). Similar to VNQ, with a longer history."),
            ("XLRE", "Real estate companies in the S&P 500."),
            ("REM", "Mortgage REITs: they hold real estate loans, not buildings. High dividends, high risk."),
        ],
        "International": [
            ("VNQI", "Real estate companies outside the US."),
            ("RWX", "International real estate companies (SPDR)."),
        ],
    },
    # -----------------------------------------------------------------------
    "commodities": {
        "Precious metals": [
            ("GLD", "Gold, held as physical bullion in vaults."),
            ("IAU", "Gold (iShares). Same idea as GLD, at a lower cost."),
            ("SLV", "Silver, held as physical bullion. More volatile than gold."),
            ("PPLT", "Platinum, held as physical bullion."),
        ],
        "Broad baskets": [
            ("DBC", "A basket of commodity futures: energy, metals and agriculture."),
            ("PDBC", "A basket of commodity futures, similar to DBC. Started in 2014."),
            ("GSG", "The S&P GSCI commodity index, weighted heavily toward energy."),
        ],
        "Energy and agriculture": [
            ("USO", "Oil futures. Has trailed the oil price badly over long periods because of futures roll costs."),
            ("UNG", "Natural gas futures. Has lost most of its value over time; a cautionary example."),
            ("DBA", "Agricultural futures: grains, livestock, sugar, coffee and more."),
            ("CPER", "Copper futures."),
        ],
        "Producers": [
            ("GDX", "Gold mining companies. They're stocks, so they swing much more than gold itself."),
        ],
    },
    # -----------------------------------------------------------------------
    "alternatives": {
        "Trend-following": [
            ("DBMF", "Managed futures: follows market trends up or down across many assets. Started in 2019."),
            ("KMLM", "Managed futures (Mount Lucas index). Started in 2020."),
        ],
        "Hedging and market-neutral": [
            ("BTAL", "Long low-volatility stocks and short high-volatility ones; has often risen when markets fell."),
            ("TAIL", "Tail-risk hedge: Treasuries plus put options that pay off in sharp crashes. Loses slowly in calm markets."),
            ("MNA", "Merger arbitrage: profits from the gap between a takeover price and the current share price."),
            ("QAI", "Imitates the combined returns of hedge funds using ordinary ETFs."),
        ],
        "Real assets": [
            ("IGF", "Infrastructure companies worldwide: toll roads, airports, pipelines, utilities."),
            ("AMLP", "Energy pipeline partnerships (MLPs). High income, tied closely to the oil and gas industry."),
        ],
        "Private equity": [
            ("PSP", "Publicly traded private equity firms and funds: the closest listed stand-in for private equity."),
        ],
        "Crypto": [
            ("IBIT", "Bitcoin, held directly. Started in January 2024, so it limits a backtest to the last few years."),
            ("ETHA", "Ether, held directly. Started in July 2024."),
        ],
    },
    # -----------------------------------------------------------------------
    "multi_asset": {
        "Stock and bond mixes": [
            ("AOK", "Conservative: about 30% stocks, 70% bonds, global."),
            ("AOM", "Moderate: about 40% stocks, 60% bonds, global."),
            ("AOR", "Growth: about 60% stocks, 40% bonds, global."),
            ("AOA", "Aggressive: about 80% stocks, 20% bonds, global."),
            ("VBIAX", "Vanguard Balanced Index (mutual fund): 60% US stocks, 40% US bonds."),
            ("VWELX", "Vanguard Wellington (mutual fund): actively managed, about two-thirds stocks. Dates back to 1929."),
        ],
        "Target-date": [
            ("VFIFX", "Vanguard Target Retirement 2050 (mutual fund): mostly stocks now, gradually shifting to bonds."),
        ],
        "Risk parity": [
            ("RPAR", "Balances risk across stocks, Treasuries, TIPS and commodities, using some leverage. Started in 2019."),
        ],
    },
    # -----------------------------------------------------------------------
    "cash": {
        "Treasury bills": [
            ("BIL", "US Treasury bills maturing in 1 to 3 months."),
            ("SGOV", "US Treasury bills maturing in 0 to 3 months. Started in 2020."),
            ("SHV", "US Treasury debt maturing within a year."),
        ],
    },
}


# ---------------------------------------------------------------------------
# Helpers used by the pipeline and the API.
# ---------------------------------------------------------------------------
def all_tickers() -> list[str]:
    """Every ticker in the catalog, in catalog order, without duplicates."""
    seen: list[str] = []
    for groups in CATALOG.values():
        for entries in groups.values():
            for ticker, _ in entries:
                if ticker not in seen:
                    seen.append(ticker)
    return seen


def entries() -> list[dict]:
    """The catalog flattened into one row per security, with its column and group."""
    rows = []
    for category, groups in CATALOG.items():
        for group, items in groups.items():
            for ticker, description in items:
                rows.append({"ticker": ticker, "category": category, "group": group, "description": description})
    return rows