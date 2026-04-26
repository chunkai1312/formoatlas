## 1. API Contract

- [x] 1.1 Create `GetHotStocksDto` with optional `date` and `market?: 'TSE' | 'OTC'`, defaulting behavior handled by repository/service layer
- [x] 1.2 Define backend response types or interfaces for the hot stocks aggregate response and common ranking row
- [x] 1.3 Add `GET /marketdata/hot-stocks` endpoint to `MarketDataController`

## 2. Repository Queries

- [x] 2.1 Add or adapt repository method to return a hot stocks aggregate response for date + market
- [x] 2.2 Reuse existing top movers logic to populate `movers.gainers` and `movers.losers` with top 20 rows each
- [x] 2.3 Reuse existing most actives logic to populate `actives.byVolume` and `actives.byValue` with top 20 rows each
- [x] 2.4 Reuse existing institutional trades logic to populate `institutional.finiBuy`, `institutional.finiSell`, `institutional.sitcBuy`, and `institutional.sitcSell` with top 20 rows each
- [x] 2.5 Normalize ranking rows to include `symbol`, `name`, `date`, `market`, `closePrice`, `change`, `changePercent`, `tradeVolume`, `tradeValue`, `finiNet`, and `sitcNet`
- [x] 2.6 Ensure all hot stocks ranking queries return empty arrays instead of throwing when no records exist
- [x] 2.7 Ensure non-trading date queries use the latest available equity data on or before requested date
- [x] 2.8 Rely on ingestion filtering and migration for OTC warrant exclusion; hot-stocks ranking queries do not apply a separate warrant filter
- [x] 2.9 Exclude OTC warrant symbols before upserting TPEx equity quote and institutional trade updates
- [x] 2.10 Add migration script to delete existing OTC warrant ticker documents

## 3. Frontend Data Layer

- [x] 3.1 Add `HotStocksResponse` and `HotStockRankRow` frontend models
- [x] 3.2 Add `getHotStocks(date: string, market?: 'TSE' | 'OTC')` to the web `TickerService`
- [x] 3.3 Handle API errors on the page data load path by rendering empty ranking sections rather than breaking the page

## 4. Routing and Navigation

- [x] 4.1 Add `/hot-stocks` lazy-load route to `app.routes.ts`
- [x] 4.2 Add 「熱門個股」 link to the toolbar navigation with `routerLinkActive`
- [x] 4.3 Verify toolbar layout remains usable with three nav links at desktop and narrow viewport widths

## 5. Hot Stocks Page

- [x] 5.1 Create standalone HotStocks page component with vertical section layout consistent with `SectorFlowComponent`
- [x] 5.2 Add page-scoped market state with initial `TSE` and 「上市」/「上櫃」 tab UI
- [x] 5.3 Load hot stocks data from selected global date + active market, and reload when either changes
- [x] 5.4 Render 「漲跌幅排行」 section with 漲幅榜 and 跌幅榜 tables
- [x] 5.5 Render 「成交量值排行」 section with 成交量 and 成交值 tables
- [x] 5.6 Render 「外資買賣超排行」 section with 外資買超 and 外資賣超 tables
- [x] 5.7 Render 「投信買賣超排行」 section with 投信買超 and 投信賣超 tables
- [x] 5.8 Render stable empty states for individual empty ranking arrays

## 6. Ranking Table UI

- [x] 6.1 Create reusable hot stock ranking table component or lightweight section component for repeated ranking lists
- [x] 6.2 Display common row columns: stock symbol, name, close price, change, and change percent
- [x] 6.3 Display ranking-specific metric columns for trade volume, trade value, foreign net, or investment trust net
- [x] 6.4 Format trade value in 億 units and apply consistent number formatting to volume and institutional net values
- [x] 6.5 Apply existing台股 positive red and negative green semantics to price change and net buy/sell values

## 7. Verification

- [x] 7.1 Manually verify `GET /marketdata/hot-stocks?date=2026-03-13&market=TSE` returns all ranking groups
- [x] 7.2 Manually verify `GET /marketdata/hot-stocks?date=2026-03-13&market=OTC` returns all ranking groups
- [x] 7.3 Verify `/hot-stocks` loads from toolbar navigation and active nav state updates correctly
- [x] 7.4 Verify market tab switching reloads all ranking sections without changing the selected global date
- [x] 7.5 Verify a weekend or no-data date does not crash API or UI
- [x] 7.6 Verify OTC warrant symbols are excluded by TPEx ingestion filters and removable through migration
