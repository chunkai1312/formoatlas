# TaiBaro

台股大盤籌碼分析平台。後端每日自動從台灣證券交易所（TWSE）收集 15 項大盤籌碼指標，並透過 AI 解讀指標間的交互關係，輸出每日「晴雨等級」與盤勢摘要。前端以儀表板形式呈現晴雨表、籌碼速覽與趨勢圖表。

## 功能特色

- **每日自動收集**：盤後 Cron 自動抓取加權指數、三大法人買賣超、融資融券、台指期未平倉、PUT/CALL Ratio、匯率等 15 項指標
- **AI 晴雨分析**：結合技術指標（5MA / 20MA / 均量），輸出五層晴雨等級與 150–200 字中文盤勢摘要，結果快取於 DB
- **儀表板 UI**：晴雨 Hero Card（天氣圖示 + AI 摘要 + 廣度比例條）、6 張籌碼速覽 Stat Cards、ECharts 趨勢圖表，支援日期導航與深/淺色主題切換

### 晴雨等級

| 等級 | 標籤 | 圖示 |
|------|------|------|
| `STRONG_BULL` | 強多 | ☀️ |
| `BULL` | 偏多 | 🌤 |
| `NEUTRAL` | 中性 | ⛅ |
| `BEAR` | 偏空 | 🌧 |
| `STRONG_BEAR` | 強空 | ⛈ |

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
MONGODB_URI=mongodb://localhost:27017/taibaro

# API 一律連到獨立常駐的 Copilot CLI headless server
COPILOT_CLI_URL=localhost:4321

# 選填，預設 gpt-5-mini
COPILOT_MODEL=gpt-5-mini
```

請先將 Copilot CLI 以 headless mode 獨立啟動，並把 token 放在 CLI process：

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

## API

| 路徑 | 說明 |
|------|------|
| `GET /marketdata/barometer?date=YYYY-MM-DD` | 晴雨等級 + AI 摘要 |
| `GET /marketdata/market-stats?startDate=&endDate=` | 大盤籌碼歷史數據 |
