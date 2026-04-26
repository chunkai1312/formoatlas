# FormoAtlas

以日期翻閱島嶼股海，讀懂每日留下的紅綠線索。

FormoAtlas 是一個以日期為核心的台灣股市線索圖譜。後端每日盤後收集指數、籌碼、期權、匯率、類股與個股資料，前端讓使用者選取任一日期，對齊當日的大盤溫度、資金流向、類股強弱與熱門個股。

## 功能特色

- **日期導向觀察**：透過全域日期導航切換交易日，重新載入大盤、類股與個股層級的當日資料
- **AI 晴雨分析**：結合籌碼與技術脈絡，輸出五層晴雨等級與中文摘要，結果快取於 DB
- **多層線索圖譜**：包含晴雨 Hero Card、大盤 K 線、籌碼速覽、趨勢圖表、資金流向與熱門個股排行
- **台股紅綠語意**：沿用台灣股市紅漲綠跌慣例，讓漲跌、買賣超與強弱變化更容易掃描

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
MONGODB_URI=mongodb://localhost:27017/formoatlas

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
| `GET /marketdata/sector-flow?date=&market=TSE\|OTC` | 類股資金流向 |
| `GET /marketdata/hot-stocks?date=&market=TSE\|OTC` | 熱門個股排行 |
