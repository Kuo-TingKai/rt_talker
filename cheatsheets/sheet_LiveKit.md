# LiveKit Cheat Sheet

## 安裝和導入

| 套件 | 用途 | 導入方式 |
|------|------|---------|
| `livekit-client` | 客戶端 SDK | `import { Room, RoomEvent } from 'livekit-client'` |
| `livekit-server-sdk` | 伺服器端 SDK | `const { AccessToken } = require('livekit-server-sdk')` |

## 伺服器端 API

### AccessToken 生成

| 方法 | 用途 | 範例 |
|------|------|------|
| `new AccessToken()` | 建立 token | `const token = new AccessToken(apiKey, apiSecret)` |
| `token.identity` | 設定參與者身份 | `token.identity = participantName` |
| `token.name` | 設定參與者名稱 | `token.name = participantName` |
| `token.addGrant()` | 添加權限 | `token.addGrant({ roomJoin: true, canPublish: true })` |
| `token.toJwt()` | 轉換為 JWT | `const jwt = token.toJwt()` |

### 專案中的使用

```javascript
// server/index.js
const token = new AccessToken(apiKey, apiSecret);
token.identity = participantName;
token.name = participantName;
token.addGrant({
  roomJoin: true,
  canPublish: true,
  canSubscribe: true,
});
const jwt = token.toJwt();
```

## 客戶端 API

### Room 連接

| 方法 | 用途 | 範例 |
|------|------|------|
| `new Room()` | 建立房間實例 | `const room = new Room()` |
| `room.connect()` | 連接到房間 | `await room.connect(url, token)` |
| `room.disconnect()` | 斷開連接 | `await room.disconnect()` |
| `room.localParticipant` | 本地參與者 | `room.localParticipant` |

### 音訊處理

| 方法 | 用途 | 範例 |
|------|------|------|
| `setMicrophoneEnabled()` | 啟用/停用麥克風 | `room.localParticipant.setMicrophoneEnabled(true)` |
| `enableCameraAndMicrophone()` | 啟用相機和麥克風 | `await room.localParticipant.enableCameraAndMicrophone()` |
| `audioTrackPublications` | 音訊軌道發布 | `room.localParticipant.audioTrackPublications` |

### 事件監聽

| 事件 | 用途 | 範例 |
|------|------|------|
| `RoomEvent.Connected` | 連接成功 | `room.on(RoomEvent.Connected, () => { ... })` |
| `RoomEvent.Disconnected` | 斷開連接 | `room.on(RoomEvent.Disconnected, () => { ... })` |
| `RoomEvent.ParticipantConnected` | 參與者連接 | `room.on(RoomEvent.ParticipantConnected, (participant) => { ... })` |
| `RoomEvent.TrackPublished` | 軌道發布 | `room.on(RoomEvent.TrackPublished, (publication) => { ... })` |

## 專案中的使用

| 檔案 | 使用的 API | 用途 |
|------|----------|------|
| `server/index.js` | `AccessToken` | 生成訪問 token |
| `VoiceConversation.tsx` | `Room`, `RoomEvent` | 房間連接和事件處理 |
| `VoiceConversation.tsx` | `setMicrophoneEnabled` | 麥克風控制 |

## 環境變數

| 變數 | 用途 | 範例 |
|------|------|------|
| `LIVEKIT_URL` | LiveKit 伺服器 URL | `wss://your-server.livekit.cloud` |
| `LIVEKIT_API_KEY` | API 金鑰 | `your-api-key` |
| `LIVEKIT_API_SECRET` | API 密鑰 | `your-api-secret` |

## 常見問題解決方案

| 問題 | 解決方案 |
|------|---------|
| 連接失敗 | 檢查 URL、token 和憑證是否正確 |
| 麥克風未啟用 | 確認瀏覽器權限已授予 |
| Token 過期 | 重新生成 token |
| 無法發布軌道 | 檢查 token 權限（`canPublish`） |

## 最佳實踐

| 實踐 | 說明 |
|------|------|
| Token 安全 | 在伺服器端生成 token，不要暴露密鑰 |
| 錯誤處理 | 監聽錯誤事件並適當處理 |
| 資源清理 | 斷開連接時清理所有資源 |
| 權限管理 | 根據需求設定適當的 token 權限 |
| 連接狀態 | 監聽連接狀態變化並更新 UI |

## 權限設定

| 權限 | 說明 | 使用場景 |
|------|------|---------|
| `roomJoin` | 加入房間 | 基本需求 |
| `canPublish` | 發布音訊/視訊 | 需要發送媒體 |
| `canSubscribe` | 訂閱音訊/視訊 | 需要接收媒體 |
| `roomCreate` | 創建房間 | 需要動態創建房間 |
| `roomAdmin` | 房間管理 | 需要管理房間 |

