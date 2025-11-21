# 故障排除指南

## OpenAI Realtime API server_error 問題

### 問題描述
連接 OpenAI Realtime API 後，立即收到 `server_error`，錯誤訊息：
```
The server had an error while processing your request. 
Sorry about that! Please contact us through our help center...
```

### 已嘗試的解決方案

#### 1. 簡化會話配置
- ✅ 移除了 `input_audio_transcription` 參數
- ✅ 移除了 `temperature` 和 `max_response_output_tokens` 參數
- ✅ 保留最基本的配置：`modalities`, `instructions`, `voice`, `input_audio_format`, `output_audio_format`

#### 2. 調整時機
- ✅ 增加 `session.update` 發送前的等待時間（200ms）
- ✅ 增加音訊處理前的等待時間（1000ms）
- ✅ 減少音訊發送頻率（每 2 秒）
- ✅ 減少回應觸發頻率（每 3 秒）

#### 3. 改進錯誤處理
- ✅ 添加詳細的錯誤日誌
- ✅ 記錄完整的錯誤物件
- ✅ 添加連接狀態檢查

### 可能的原因

1. **API 使用方式不正確**
   - OpenAI Realtime API 可能有特定的使用要求
   - 可能需要特定的初始化順序
   - 參數組合可能不正確

2. **音訊格式問題**
   - PCM16 格式可能不正確
   - 採樣率可能不匹配
   - 音訊數據大小可能不正確

3. **API 限制**
   - 可能需要特定的 API 權限
   - 可能有使用量限制
   - 可能處於 Beta 階段，有已知問題

4. **伺服器端問題**
   - OpenAI 伺服器可能暫時有問題
   - 特定區域可能不支援
   - 需要等待或重試

### 下一步建議

#### 選項 1: 檢查 OpenAI 官方文件
1. 查閱最新的 [OpenAI Realtime API 文件](https://platform.openai.com/docs/guides/realtime)
2. 查看官方範例代碼
3. 確認 API 使用方式是否正確

#### 選項 2: 嘗試最小化配置
進一步簡化配置，只使用最基本的參數：
```javascript
{
  type: 'session.update',
  session: {
    modalities: ['text'],  // 先只用文字，不用音訊
  }
}
```

#### 選項 3: 檢查 API 狀態
1. 查看 OpenAI 狀態頁面
2. 確認 Realtime API 是否正常運行
3. 檢查是否有已知問題

#### 選項 4: 聯繫 OpenAI 支援
如果問題持續，可以：
1. 使用錯誤訊息中的 session ID
2. 聯繫 OpenAI 支援
3. 提供詳細的錯誤日誌

### 替代方案

如果 OpenAI Realtime API 持續有問題，可以考慮：

1. **使用組合 API**：
   - Whisper API（語音轉文字）
   - Chat Completions API（文字對話）
   - TTS API（文字轉語音）

2. **使用其他服務**：
   - Deepgram（即時語音轉文字）
   - ElevenLabs（語音合成）
   - AssemblyAI（語音處理）

### 當前配置

```javascript
{
  type: 'session.update',
  session: {
    modalities: ['text', 'audio'],
    instructions: 'You are a helpful AI assistant. Respond naturally in conversation.',
    voice: 'alloy',
    input_audio_format: 'pcm16',
    output_audio_format: 'pcm16',
  }
}
```

### 調試檢查清單

- [ ] 確認 API key 有效且有 Realtime API 權限
- [ ] 檢查後端日誌中的連接狀態
- [ ] 查看是否收到 `session.created` 訊息
- [ ] 檢查錯誤訊息的完整內容
- [ ] 驗證音訊格式是否正確
- [ ] 確認沒有發送過大的音訊數據
- [ ] 檢查網路連接是否穩定

### 相關文件

- [DEBUGGING_GUIDE.md](./DEBUGGING_GUIDE.md) - 詳細的調試指南
- [PROGRESS.md](./PROGRESS.md) - 專案進度報告
- [AI_PROMPTS.md](./AI_PROMPTS.md) - AI 工具使用記錄

