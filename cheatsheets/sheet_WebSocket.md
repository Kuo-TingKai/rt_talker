# WebSocket Cheat Sheet

## 基本 API

| API | 用途 | 範例 |
|-----|------|------|
| `new WebSocket(url)` | 建立連接 | `const ws = new WebSocket('ws://localhost:3001')` |
| `ws.send(data)` | 發送訊息 | `ws.send(JSON.stringify({ type: 'message' }))` |
| `ws.close()` | 關閉連接 | `ws.close(code, reason)` |
| `ws.readyState` | 連接狀態 | `ws.readyState === WebSocket.OPEN` |

## 連接狀態

| 狀態 | 值 | 說明 |
|------|-----|------|
| `CONNECTING` | `0` | 連接中 |
| `OPEN` | `1` | 已連接 |
| `CLOSING` | `2` | 關閉中 |
| `CLOSED` | `3` | 已關閉 |

## 事件處理

| 事件 | 用途 | 範例 |
|------|------|------|
| `onopen` | 連接打開 | `ws.onopen = () => { ... }` |
| `onmessage` | 接收訊息 | `ws.onmessage = (event) => { ... }` |
| `onerror` | 錯誤處理 | `ws.onerror = (error) => { ... }` |
| `onclose` | 連接關閉 | `ws.onclose = (event) => { ... }` |

## 伺服器端 (Node.js - ws)

| API | 用途 | 範例 |
|-----|------|------|
| `new WebSocketServer({ server, path })` | 建立伺服器 | `const wss = new WebSocketServer({ server, path: '/ws' })` |
| `wss.on('connection', handler)` | 處理連接 | `wss.on('connection', (ws) => { ... })` |
| `ws.send(data)` | 發送訊息 | `ws.send(JSON.stringify({ ... }))` |
| `ws.on('message', handler)` | 接收訊息 | `ws.on('message', (data) => { ... })` |

## 訊息格式

| 類型 | 處理方式 | 範例 |
|------|---------|------|
| String | 直接使用 | `event.data` |
| Blob | 轉換為文字 | `await event.data.text()` |
| ArrayBuffer | 解碼 | `new TextDecoder().decode(event.data)` |

## 專案中的使用

| 檔案 | 使用的 API | 用途 |
|------|----------|------|
| `server/index.js` | `WebSocketServer` | OpenAI Realtime API 代理 |
| `useOpenAIRealtime.ts` | `WebSocket` (客戶端) | 連接 OpenAI API |

## 常見問題解決方案

| 問題 | 解決方案 |
|------|---------|
| 連接失敗 | 檢查 URL 和認證 |
| 訊息格式錯誤 | 處理 Blob/ArrayBuffer 轉換 |
| 連接關閉 | 檢查錯誤訊息和狀態碼 |
| 認證問題 | 使用後端代理設置 header |
| 重連機制 | 實現自動重連邏輯 |

## 最佳實踐

| 實踐 | 說明 |
|------|------|
| 錯誤處理 | 監聽所有事件並適當處理 |
| 連接狀態 | 檢查 `readyState` 再發送 |
| 訊息解析 | 處理不同數據類型 |
| 資源清理 | 關閉連接時清理資源 |
| 重連機制 | 實現指數退避重連 |

## 關閉代碼

| 代碼 | 說明 |
|------|------|
| `1000` | 正常關閉 |
| `1001` | 端點離開 |
| `1006` | 異常關閉 |
| `1011` | 伺服器錯誤 |

## 瀏覽器限制

| 限制 | 解決方案 |
|------|---------|
| 無法設置自訂 Header | 使用後端代理 |
| CORS 限制 | 配置伺服器 CORS |
| 連接數限制 | 管理連接生命週期 |

## 專案中的實作模式

| 模式 | 說明 | 範例 |
|------|------|------|
| 代理模式 | 後端代理處理認證 | `server/index.js` |
| 狀態管理 | 使用 ref 追蹤連接 | `wsRef.current` |
| 訊息隊列 | 在未準備好時隊列訊息 | `pendingAudioRef` |
| 自動重連 | 錯誤後自動重新連接 | `initWebSocket()` |

