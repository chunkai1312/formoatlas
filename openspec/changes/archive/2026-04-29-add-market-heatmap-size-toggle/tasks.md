## 1. Backend Contract

- [x] 1.1 Update API market-map types to include stock `tradeValue` and sector `totalTradeValue`.
- [x] 1.2 Update `TickerRepository.getMarketMap()` aggregation to project stock `tradeValue` and group sector `totalTradeValue`.
- [x] 1.3 Keep existing market cap calculation behavior while making `tradeValue` available as a separate field.
- [x] 1.4 Add or update backend tests for market-map response shape and `totalTradeValue` aggregation.

## 2. Frontend Models

- [x] 2.1 Update web `MarketMapItem` model with `tradeValue`.
- [x] 2.2 Update web `MarketMapSector` model with `totalTradeValue`.
- [x] 2.3 Confirm `TickerService.getMarketMap()` still preserves selected-date empty-state behavior with the expanded response.

## 3. Heatmap Size Mode UI

- [x] 3.1 Add a local size mode state for the homepage market map with values `marketCap` and `tradeValue`.
- [x] 3.2 Add a separate size mode control near the market tabs, with default `市值`.
- [x] 3.3 Update section copy so it reflects the currently selected size mode and fixed color dimension.
- [x] 3.4 Ensure market tabs and size mode controls remain usable on narrow viewports.

## 4. Chart Mapping

- [x] 4.1 Update `MarketMapComponent` inputs or local state so chart option generation can read the selected size mode.
- [x] 4.2 Select stock and sector treemap size values from `marketCap` or `tradeValue` based on size mode.
- [x] 4.3 Compute sector weighted change using the same weight dimension as the selected size mode.
- [x] 4.4 Preserve red-gain/green-loss visual map behavior and existing loading/empty/error states.
- [x] 4.5 Handle missing or zero size values without rendering blank or invalid treemap data.

## 5. Tooltip

- [x] 5.1 Keep stock tooltip focused on name, symbol, OHLC, change, percent change, and volume.
- [x] 5.2 Ensure stock tooltip does not display size metric, market cap, or trade value rows.
- [x] 5.3 Add or update tooltip tests for the final compact tooltip behavior.

## 6. Verification

- [x] 6.1 Add or update frontend tests for default size mode, mode switching, and label copy.
- [x] 6.2 Add or update chart mapping tests to verify `marketCap` and `tradeValue` size values.
- [x] 6.3 Run relevant API tests.
- [x] 6.4 Run relevant web tests.
- [x] 6.5 Run `openspec validate add-market-heatmap-size-toggle --strict`.
