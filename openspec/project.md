# TaiBaro — Project Context

## Overview

TaiBaro 是一個台股大盤籌碼分析平台。後端每日自動從台股交易所（TWSE）收集 11 項大盤籌碼指標，並透過 LLM（GPT-4o-mini）解讀指標間的交互關係，輸出每日「晴雨等級」（五層）與盤勢摘要。前端以儀表板形式呈現晴雨表結果、籌碼速覽與趨勢圖表。

## Monorepo Structure

Nx monorepo，包含兩個 apps：

| App | Path | Description |
|-----|------|-------------|
| `api` | `apps/api/` | NestJS REST API，資料收集 & AI 分析 |
| `web` | `apps/web/` | Angular SPA，儀表板 UI |

## Tech Stack

### Backend (`apps/api`)
- **Framework**: NestJS 11
- **Database**: MongoDB via Mongoose (`@nestjs/mongoose`)
- **Data Source**: `node-twstock` / `nest-twstock`（台股 TWSE 資料抓取）
- **AI**: GitHub Copilot SDK (`@github/copilot-sdk`)；API 一律透過 `COPILOT_CLI_URL` 連線至 Copilot CLI headless server；使用 JSON parse + Zod schema 驗證
- **Scheduling**: `@nestjs/schedule`（Cron jobs 每日盤後自動更新）
- **Config**: `@nestjs/config`（`.env` 環境變數）
- **Date**: Luxon
- **Validation**: class-validator + class-transformer（DTO）
- **API Docs**: `@nestjs/swagger`

### Frontend (`apps/web`)
- **Framework**: Angular 21（standalone components）
- **UI Library**: Angular Material
- **Charts**: ngx-echarts（Apache ECharts）— 支援雙 Y 軸趨勢圖
- **HTTP**: Angular `HttpClient`

### Shared / Tooling
- **Language**: TypeScript 5.9
- **Monorepo**: Nx 22
- **Linting**: ESLint 9 + typescript-eslint + angular-eslint
- **Formatting**: Prettier
- **Testing**: Vitest（unit）

## Domain Knowledge

### 大盤籌碼指標（MarketStats）

`MarketStats` collection 每日儲存下列 11 項指標：

| 欄位 | 說明 |
|------|------|
| `taiexPrice` | 集中市場加權指數收盤價 |
| `taiexChange` | 加權指數漲跌點數 |
| `taiexTradeValue` | 集中市場成交金額 |
| `finiNetBuySell` | 外資買賣超（現貨） |
| `sitcNetBuySell` | 投信買賣超（現貨） |
| `dealersNetBuySell` | 自營商買賣超（現貨） |
| `marginBalance` | 融資餘額 |
| `shortBalance` | 融券餘額 |
| `finiTxfNetOi` | 外資台指期淨未平倉口數 |
| `finiTxoNetOiValue` | 外資台指選擇權淨未平倉市值 |
| `largeTradersTxfNetOi` | 大額交易人台指期淨未平倉口數 |
| `retailMxfPosition` | 散戶小台淨多空比 |
| `retailTmfPosition` | 散戶微台淨多空比 |
| `txoPutCallRatio` | PUT/CALL Ratio |
| `usdTwdRate` | 美元兌台幣匯率 |
| `aiAnalysis` | LLM 快取結果 `{ level, weather, label, summary }` |

### 晴雨等級（BarometerLevel）

| Level | Label | Weather |
|-------|-------|---------|
| `STRONG_BULL` | 強多 | ☀️ |
| `BULL` | 偏多 | 🌤 |
| `NEUTRAL` | 中性 | ⛅ |
| `BEAR` | 偏空 | 🌧 |
| `STRONG_BEAR` | 強空 | ⛈ |

### 色彩系統（晴雨等級對應）

```css
--color-strong-bull: #F59E0B  /* amber */
--color-bull:        #22C55E  /* green */
--color-neutral:     #9CA3AF  /* gray */
--color-bear:        #3B82F6  /* blue */
--color-strong-bear: #4338CA  /* indigo */
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/marketdata/barometer?date=` | 晴雨等級 + AI 分析摘要 |
| `GET` | `/marketdata/market-stats?startDate=&endDate=` | 每日大盤籌碼數據列表 |

## Architecture Conventions

### Backend
- **Module boundary**: 每個功能獨立 NestJS module（`MarketDataModule`、`BarometerModule`）
- **Repository pattern**: DB 操作封裝於 `*.repository.ts`；業務邏輯在 `*.service.ts`
- **DTO validation**: 所有 controller input 透過 class-validator DTO 驗證
- **Cron + endpoint 共用邏輯**: Cron job 與 HTTP endpoint 呼叫同一 service 方法，快取於 DB，不重複呼叫 LLM
- **LLM structured output**: 使用 Zod schema（`BarometerOutputSchema`）驗證 Copilot SDK 回傳 JSON，格式無效時不寫入快取
- **環境變數**: 透過 `.env` 管理（`MONGODB_URI`、`COPILOT_CLI_URL`、`COPILOT_MODEL`、`MARKETDATA_INIT_ENABLED`、`MARKETDATA_INIT_DAYS`）

### Frontend
- **Standalone components**: 所有 Angular component 使用 standalone 模式
- **Feature-based structure**: `features/dashboard/`（頁面容器） + `core/`（models、services）+ `layout/`（toolbar 等），符合以下分層：
  ```
  features/dashboard/
  ├── dashboard.component.ts
  └── components/
      ├── barometer-hero/
      ├── stats-overview/
      └── trend-chart/
  core/
  ├── models/
  └── services/
  layout/
  └── toolbar/
  ```
- **HTTP strategy**: 頁面初始化發兩個請求（barometer + market-stats），`market-stats` 末筆複用為今日速覽數據
- **趨勢圖**: TAIEX 固定左 Y 軸主折線；右 Y 軸由使用者透過 `MatChipListbox` 單選籌碼指標

## Environment Variables

```
MONGODB_URI=                  # MongoDB 連線字串
COPILOT_CLI_URL=              # 必填，指向 Copilot CLI headless server
COPILOT_MODEL=                # Copilot 模型，預設 gpt-5-mini
MARKETDATA_INIT_ENABLED=      # true 時啟動時補算歷史資料
MARKETDATA_INIT_DAYS=         # 補算天數（預設 30）
```

## Dev Commands

```sh
npx nx serve api     # 啟動後端開發伺服器
npx nx serve web     # 啟動前端開發伺服器
npx nx build api     # 建置後端
npx nx build web     # 建置前端
npx nx test api      # 跑後端測試
npx nx test web      # 跑前端測試
npx nx graph         # 視覺化專案相依圖
```
