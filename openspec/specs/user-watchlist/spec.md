## Purpose

定義 FormoAtlas 使用者自選股清單（Watch List）的 API。後端 API 已完整實作，前端 UI 未來以獨立頁面（route）形式呈現。

## Requirements

### Requirement: Watch List 查詢
系統 SHALL 提供已登入使用者查詢自己 watch list 的 API。

#### Scenario: 取得 Watch List
- **WHEN** 已登入使用者呼叫 `GET /api/user/watchlist`
- **THEN** 系統 SHALL 回傳該使用者的 watch list `string[]`（股票代號陣列）

#### Scenario: 未登入時取得 Watch List
- **WHEN** 未登入使用者呼叫 `GET /api/user/watchlist`
- **THEN** 系統 SHALL 回傳 401

### Requirement: Watch List 新增股票
系統 SHALL 允許已登入使用者將股票代號加入 watch list。

#### Scenario: 新增有效股票代號
- **WHEN** 已登入使用者呼叫 `POST /api/user/watchlist/:symbol`，且 symbol 尚未在 watch list 中
- **THEN** 系統 SHALL 將該 symbol 加入使用者 watch list，並回傳更新後的 watch list

#### Scenario: 新增已存在的股票代號
- **WHEN** 已登入使用者呼叫 `POST /api/user/watchlist/:symbol`，且 symbol 已在 watch list 中
- **THEN** 系統 SHALL 回傳當前 watch list，不重複新增

#### Scenario: 未登入時新增
- **WHEN** 未登入使用者呼叫 `POST /api/user/watchlist/:symbol`
- **THEN** 系統 SHALL 回傳 401

### Requirement: Watch List 移除股票
系統 SHALL 允許已登入使用者從 watch list 移除股票代號。

#### Scenario: 移除存在的股票代號
- **WHEN** 已登入使用者呼叫 `DELETE /api/user/watchlist/:symbol`，且 symbol 在 watch list 中
- **THEN** 系統 SHALL 移除該 symbol，並回傳更新後的 watch list

#### Scenario: 移除不存在的股票代號
- **WHEN** 已登入使用者呼叫 `DELETE /api/user/watchlist/:symbol`，且 symbol 不在 watch list 中
- **THEN** 系統 SHALL 回傳當前 watch list，不做任何變更

#### Scenario: 未登入時移除
- **WHEN** 未登入使用者呼叫 `DELETE /api/user/watchlist/:symbol`
- **THEN** 系統 SHALL 回傳 401
