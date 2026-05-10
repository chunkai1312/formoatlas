## ADDED Requirements

### Requirement: 目標導向策略模擬模型
系統 SHALL 定義從使用者財務目標與風險限制出發的目標導向策略模擬模型。

此模型 SHALL 支援目標金額或目標年化報酬、投資期限、初始資金、定期投入、最大可接受回撤、投資範圍與候選策略。

此 capability SHALL 比較候選策略或資產配置模型，且 SHALL NOT 呈現保證達成的推薦結論。

#### Scenario: 定義目標金額模擬
- **WHEN** simulation request 包含 `targetAmount`、`horizonYears`、`initialCapital` 與 `monthlyContribution`
- **THEN** 系統 SHALL 依目標路徑評估候選策略
- **AND** 回報每個候選策略在歷史上接近目標的程度

#### Scenario: 定義目標報酬模擬
- **WHEN** simulation request 包含 `targetAnnualReturnPct` 而非 `targetAmount`
- **THEN** 系統 SHALL 依目標報酬評估候選策略
- **AND** 在報酬指標旁同時回報風險指標

#### Scenario: 風險承受度限制候選評估
- **WHEN** request 包含 `maxDrawdownTolerancePct`
- **THEN** 系統 SHALL 標示歷史最大回撤超過容忍值的候選策略
- **AND** SHALL NOT 將這些候選策略列為低風險匹配

### Requirement: 候選策略比較
系統 SHALL 為目標導向模擬比較多個候選策略或資產配置模型。

候選結果 SHALL 包含報酬、波動或穩定性訊號、回撤、目標匹配分數與可解釋 warnings。

#### Scenario: 比較已選候選策略
- **WHEN** request 包含多個候選策略
- **THEN** 系統 SHALL 回傳排序或分組後的比較結果
- **AND** 包含可解釋每個候選策略接近或偏離目標原因的指標

#### Scenario: 候選策略無法評估
- **WHEN** 某個候選策略缺乏足夠歷史資料
- **THEN** 系統 SHALL 以 unavailable status 包含該候選策略，或以明確 warning 說明排除原因

### Requirement: 非投資建議的模擬輸出
系統 SHALL 將目標導向模擬輸出定位為歷史情境分析。

輸出 SHALL 避免直接買賣指令、保證達成宣稱或單一路徑投資建議。

#### Scenario: 回傳模擬輸出
- **WHEN** goal-based simulation 結果被顯示或由 API 回傳
- **THEN** 輸出 SHALL 說明結果為歷史模擬且不構成投資建議
- **AND** 當目標不切實際時，SHALL 呈現提高投入、延長期限、降低目標或接受更高回撤等取捨
