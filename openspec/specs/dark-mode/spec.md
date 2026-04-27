## Purpose
定義應用程式的淺色與深色主題切換能力，包含偏好持久化、全站視覺 token 與圖表/Material 元件的主題同步。

## Requirements

### Requirement: 主題切換
系統 SHALL 提供手動切換淺色/深色模式的能力，並將用戶偏好持久化至 `localStorage`。

#### Scenario: 初始載入讀取偏好
- **WHEN** 應用程式首次載入
- **THEN** 系統 SHALL 從 `localStorage` 讀取主題偏好，若有紀錄則套用對應主題，否則預設為淺色模式

#### Scenario: 點擊 Toolbar 切換按鈕
- **WHEN** 用戶點擊 Toolbar 中的主題切換按鈕
- **THEN** 系統 SHALL 即時切換淺色/深色模式，並將新偏好寫入 `localStorage`

#### Scenario: 深色模式 class 套用
- **WHEN** 深色模式啟用
- **THEN** 系統 SHALL 在 `<html>` 元素加入 `dark-mode` class；停用時移除該 class

---

### Requirement: 深色模式視覺主題
系統 SHALL 在深色模式下套用 TradingView 風格的深色調色盤，所有頁面元件均須支援雙主題。

#### Scenario: 頁面背景與表面色
- **WHEN** 深色模式啟用
- **THEN** 頁面背景 SHALL 為 `#131722`，卡片表面 SHALL 為 `#1E222D`，Toolbar/Footer 等提升表面 SHALL 為 `#2A2E39`

#### Scenario: 文字顏色
- **WHEN** 深色模式啟用
- **THEN** 主要文字 SHALL 為 `#D1D4DC`，次要/輔助文字 SHALL 為 `#787B86`

#### Scenario: Toolbar 深色樣式
- **WHEN** 深色模式啟用
- **THEN** Toolbar 背景 SHALL 改為 `#1E222D`（與頁面融合），並加入 `1px solid #363A45` 的底部分隔線；淺色模式下維持 `#1565C0` 深藍背景

#### Scenario: 晴雨表色彩提亮
- **WHEN** 深色模式啟用且顯示晴雨等級
- **THEN** 各等級色彩（用於 border 與 chip）SHALL 使用提亮版本：STRONG_BULL=#FBBF24 / BULL=#4ADE80 / NEUTRAL=#9CA3AF / BEAR=#60A5FA / STRONG_BEAR=#818CF8

#### Scenario: 漲跌色彩（台灣慣例）
- **WHEN** 深色模式啟用
- **THEN** 正值（漲）SHALL 顯示為 `#F87171`（提亮紅），負值（跌）SHALL 顯示為 `#4ADE80`（提亮綠）

#### Scenario: Angular Material 元件跟隨主題
- **WHEN** 深色模式啟用
- **THEN** 所有 Angular Material 元件（MatCard、MatButton、MatChip、MatDatepicker 等）SHALL 自動套用 Material 深色 theme

#### Scenario: Echarts 圖表跟隨主題
- **WHEN** 深色模式啟用
- **THEN** 所有 ngx-echarts 圖表 SHALL 切換至 echarts 內建 `dark` theme
