## Purpose
定義集中市場廣度資料的抓取、儲存、批次更新與定時更新行為，確保每日盤後可取得上漲、下跌、平盤、漲停與跌停家數，並能提供前端市場廣度視覺化使用。

## Requirements

### Requirement: 儲存集中市場廣度數據
系統 SHALL 於每個交易日盤後定時抓取 TWSE 集中市場的上漲、漲停、下跌、跌停、平盤家數，並儲存至 `MarketStats` 資料庫文件中。

#### Scenario: 成功更新市場廣度
- **WHEN** `updateMarketBreadth` 被呼叫且 `twstock.market.breadth` 回傳有效資料
- **THEN** 系統 SHALL 將 `advanceCount`、`limitUpCount`、`declineCount`、`limitDownCount`、`unchangedCount` 寫入對應日期的 `MarketStats` 文件

#### Scenario: 資料尚未發布或非交易日
- **WHEN** `updateMarketBreadth` 被呼叫且 `twstock.market.breadth` 回傳 `null`
- **THEN** 系統 SHALL 記錄 warn 日誌並不更新資料庫

### Requirement: 市場廣度納入批次更新
系統 SHALL 在執行 `updateMarketStats` 批次流程時，一併呼叫 `updateMarketBreadth`。

#### Scenario: 批次更新包含市場廣度
- **WHEN** `updateMarketStats` 被呼叫
- **THEN** 系統 SHALL 在批次更新序列中呼叫 `updateMarketBreadth`，且每步驟間有 5 秒延遲

### Requirement: 定時觸發市場廣度更新
系統 SHALL 在每個工作日下午 15:15 至 18:15 之間，每小時執行一次 `updateMarketBreadth`。

#### Scenario: Cron job 觸發
- **WHEN** Cron 排程 `0 15 15-18 * * *` 觸發
- **THEN** 系統 SHALL 自動呼叫 `updateMarketBreadth` 以當天日期為參數
