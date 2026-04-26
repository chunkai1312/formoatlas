## MODIFIED Requirements

### Requirement: Footer
系統 SHALL 在頁面底部顯示固定 Footer，包含資料來源說明、FormoAtlas 著作權及投資警語。

#### Scenario: Footer 內容
- **WHEN** 用戶瀏覽任意頁面
- **THEN** Footer SHALL 顯示資料來源（臺灣證券交易所・期貨交易所）、`FormoAtlas` 著作權文字及投資警語（「本網站資訊僅供參考，不構成任何投資建議或買賣依據」）

#### Scenario: 行動版佈局
- **WHEN** 螢幕寬度小於 768px
- **THEN** Footer SHALL 改為垂直堆疊佈局，警語獨立顯示於最下方
