# FormoAtlas

以日期翻閱台股市場，從大盤溫度、籌碼流向、類股強弱與熱門個股，讀懂每日留下的紅綠線索。

FormoAtlas 是以日期為核心的台股盤後分析工具。後端每日盤後收集指數、籌碼、期權、匯率、類股與個股資料，前端讓使用者選取任一日期，對齊當日的大盤溫度、資金流向、類股強弱與熱門個股。

## 功能特色

- **日期導向觀察**：全域日期以 `?date=` URL 參數同步，切換交易日後各頁面自動重新載入當日資料；若無指定日期則自動抓取最近交易日
- **市場熱力圖**：首頁以 ECharts treemap 呈現全市場個股依產業分組的漲跌熱力，支援 TSE 上市 / OTC 上櫃切換
- **AI 晴雨分析**：結合籌碼與技術脈絡，輸出五層晴雨等級與中文摘要，結果快取於 DB；支援 streaming 研究問答
- **大盤總覽**：包含晴雨 Hero Card、TAIEX K 線（日 / 週）、籌碼速覽、趨勢圖表與廣度指標
- **資金流向**：類股買賣超排行與資金動能分析，支援 TSE / OTC 分頁
- **熱門個股**：三大法人排行、成交量排行，含連續買超天數徽章
- **台股紅綠語意**：沿用台灣股市紅漲綠跌慣例，讓漲跌、買賣超與強弱變化更容易掃描

### 晴雨等級

| 等級 | 標籤 | 圖示 |
|------|------|------|
| `STRONG_BULL` | 強多 | ☀️ |
| `BULL` | 偏多 | 🌤 |
| `NEUTRAL` | 中性 | ⛅ |
| `BEAR` | 偏空 | 🌧 |
| `STRONG_BEAR` | 強空 | ⛈ |

## 技術架構

Nx monorepo，包含兩個 apps：

| App | 路徑 | 技術 |
|-----|------|------|
| `api` | `apps/api/` | NestJS 11 · MongoDB · GitHub Copilot SDK |
| `web` | `apps/web/` | Angular 21 · Angular Material · ngx-echarts |

## 快速開始

### 環境需求

- Node.js 20+
- MongoDB
- Copilot CLI headless server（以具備 Copilot Requests 權限的 token 啟動）

### 安裝

```sh
npm install
```

### 環境變數

於專案根目錄建立 `.env`：

```env
MONGODB_URI=mongodb://localhost:27017/formoatlas

# API 一律連到獨立常駐的 Copilot CLI headless server
COPILOT_CLI_URL=localhost:4321
COPILOT_GITHUB_TOKEN=your_copilot_github_token

# 選填，預設 gpt-5-mini
COPILOT_MODEL=gpt-5-mini

# 選填，啟動時補算歷史資料
MARKETDATA_INIT_ENABLED=false
MARKETDATA_INIT_DAYS=30
```

請先將 Copilot CLI 以 headless mode 獨立啟動：

```sh
COPILOT_GITHUB_TOKEN=your_copilot_github_token copilot --headless --port 4321
```

### 啟動開發伺服器

```sh
# 同時啟動 API（port 3000）與 Web（port 4200）
npm run serve

# 或分別啟動
npx nx serve api
npx nx serve web
```

### 建置

```sh
# 建置所有 apps
npm run build

# 建置 Docker Image（linux/amd64）
npm run build:docker
```

### 測試

```sh
npx nx test api
npx nx test web
```

## API

### MarketData

| 方法 | 路徑 | 說明 |
|------|------|------|
| `GET` | `/marketdata/barometer?date=YYYY-MM-DD` | 晴雨等級 + AI 摘要 |
| `GET` | `/marketdata/trading-date?before=YYYY-MM-DD` | 指定日期當天或之前最近的交易日 |
| `GET` | `/marketdata/market-stats?startDate=&endDate=` | 大盤籌碼歷史數據 |
| `GET` | `/marketdata/tickers?symbol=&startDate=&endDate=` | 指定代號 OHLC 行情 |
| `GET` | `/marketdata/sector-flow?date=&market=TSE\|OTC` | 類股資金流向 |
| `GET` | `/marketdata/hot-stocks?date=&market=TSE\|OTC` | 熱門個股排行 |
| `GET` | `/marketdata/market-map?date=&market=TSE\|OTC` | 市場熱力圖（全市場個股依產業分組） |

### Agent

| 方法 | 路徑 | 說明 |
|------|------|------|
| `POST` | `/agent/market-research` | 台股盤後研究問答 |
| `POST` | `/agent/market-research/stream` | 台股盤後研究問答（SSE streaming） |

API 文件可於啟動後透過 `/api` 路徑存取 Swagger UI。
