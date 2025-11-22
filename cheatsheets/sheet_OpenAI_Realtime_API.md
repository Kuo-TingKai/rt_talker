# OpenAI Realtime API Cheat Sheet

## 連接設定

| 項目 | 值 | 說明 |
|------|-----|------|
| WebSocket URL | `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01` | 連接端點 |
| 認證方式 | `Authorization: Bearer {API_KEY}` | Header 認證 |
| Beta Header | `OpenAI-Beta: realtime=v1` | 必需 header |

## 訊息類型

### Session 管理

| 訊息類型 | 方向 | 用途 | 範例 |
|---------|------|------|------|
| `session.update` | Client → Server | 更新 session 配置 | `{ type: 'session.update', session: { modalities: ['text', 'audio'] } }` |
| `session.created` | Server → Client | Session 創建成功 | 包含 session 資訊 |
| `session.updated` | Server → Client | Session 更新成功 | 包含更新後的配置 |

### 音訊處理

| 訊息類型 | 方向 | 用途 | 範例 |
|---------|------|------|------|
| `input_audio_buffer.append` | Client → Server | 發送音訊數據 | `{ type: 'input_audio_buffer.append', audio: base64Audio }` |
| `input_audio_buffer.commit` | Client → Server | 提交音訊緩衝區 | `{ type: 'input_audio_buffer.commit' }` |
| `input_audio_buffer.speech_started` | Server → Client | 檢測到語音開始 | - |
| `input_audio_buffer.speech_stopped` | Server → Client | 檢測到語音結束 | - |

### 回應處理

| 訊息類型 | 方向 | 用途 | 範例 |
|---------|------|------|------|
| `response.create` | Client → Server | 創建回應 | `{ type: 'response.create', response: { modalities: ['text', 'audio'] } }` |
| `response.audio_transcript.delta` | Server → Client | 轉錄增量更新 | `{ type: 'response.audio_transcript.delta', delta: { transcript: '...' } }` |
| `response.content.delta` | Server → Client | 內容增量更新 | `{ type: 'response.content.delta', delta: { content: '...' } }` |
| `response.audio.delta` | Server → Client | 音訊增量更新 | `{ type: 'response.audio.delta', delta: { audio: '...' } }` |

### 錯誤處理

| 訊息類型 | 方向 | 用途 | 範例 |
|---------|------|------|------|
| `error` | Server → Client | 錯誤訊息 | `{ type: 'error', error: { type: 'server_error', message: '...' } }` |

## Session 配置選項

| 選項 | 類型 | 說明 | 範例 |
|------|------|------|------|
| `modalities` | `string[]` | 支援的模式 | `['text', 'audio']` |
| `voice` | `string` | 語音模型 | `'alloy'`, `'echo'`, `'shimmer'` |
| `input_audio_format` | `string` | 輸入音訊格式 | `'pcm16'` |
| `output_audio_format` | `string` | 輸出音訊格式 | `'pcm16'` |
| `instructions` | `string` | 系統指令 | `'You are a helpful assistant.'` |
| `temperature` | `number` | 溫度參數 | `0.8` |
| `turn_detection` | `object` | 語音檢測設定 | `{ type: 'server_vad', threshold: 0.5 }` |

## 音訊格式

| 格式 | 說明 | 要求 |
|------|------|------|
| PCM16 | 16-bit PCM | 採樣率 24kHz，單聲道 |
| Base64 | 編碼方式 | 音訊數據需轉換為 base64 |

## 專案中的使用

| 檔案 | 使用的 API | 用途 |
|------|----------|------|
| `server/index.js` | WebSocket 代理 | 處理認證和轉發訊息 |
| `useOpenAIRealtime.ts` | 所有訊息類型 | 完整的 API 整合 |

## 常見問題解決方案

| 問題 | 解決方案 |
|------|---------|
| `server_error` | 檢查 session 配置、音訊格式、發送時機 |
| 連接失敗 | 確認 API key 和 header 設定正確 |
| 音訊格式錯誤 | 確認 PCM16 格式和採樣率正確 |
| Session 未準備好 | 等待 `session.created` 後再發送音訊 |
| 訊息解析錯誤 | 處理 Blob/ArrayBuffer 轉換 |

## 最佳實踐

| 實踐 | 說明 |
|------|------|
| 等待 Session Ready | 在 `session.created` 後等待再發送音訊 |
| 音訊隊列 | 在 session 未準備好時將音訊加入隊列 |
| 錯誤處理 | 監聽 `error` 訊息並適當處理 |
| 資源清理 | 關閉連接時清理所有資源 |
| 訊息解析 | 處理不同數據類型（Blob、ArrayBuffer、string） |

## 初始化流程

| 步驟 | 動作 | 時機 |
|------|------|------|
| 1 | 建立 WebSocket 連接 | 開始時 |
| 2 | 發送 `session.update` | 連接後 |
| 3 | 等待 `session.created` | 收到回應 |
| 4 | 檢查 modalities | 確認包含 `audio` |
| 5 | 等待初始化完成 | 2-3 秒 |
| 6 | 開始發送音訊 | Session ready 後 |

## 音訊發送策略

| 策略 | 說明 | 值 |
|------|------|-----|
| 發送頻率 | 每 500ms 發送一次 | `PROCESS_INTERVAL = 500` |
| 回應觸發 | 每 3 秒觸發一次 | `RESPONSE_INTERVAL = 3000` |
| 最小音訊 | 至少 2 秒音訊 | `MIN_AUDIO_DURATION = 2000` |
| Chunk 延遲 | chunks 之間延遲 | `200ms` |

