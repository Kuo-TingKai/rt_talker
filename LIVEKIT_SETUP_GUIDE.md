# LiveKit 憑證設定指南

本指南將詳細說明如何從 LiveKit 儀表板取得憑證並設定到專案中。

## 步驟 1: 登入 LiveKit 儀表板

1. 前往 [LiveKit Cloud](https://cloud.livekit.io/)
2. 使用您的帳號登入（如果尚未註冊，請先註冊）

## 步驟 2: 建立或選擇專案

1. 登入後，您會看到專案列表
2. 如果還沒有專案：
   - 點擊「Create Project」或「New Project」按鈕
   - 輸入專案名稱（例如：`rt_talker`）
   - 選擇區域（Region）
   - 點擊「Create」建立專案
3. 如果已有專案，直接點擊進入專案

## 步驟 3: 取得憑證資訊

### 方法 1: 從專案設定頁面取得

1. 在專案儀表板中，點擊左側選單的 **「Settings」** 或 **「Project Settings」**
2. 找到 **「Keys」** 或 **「API Keys」** 區塊
3. 您會看到以下資訊：
   - **WebSocket URL** (例如：`wss://your-project.livekit.cloud`)
   - **API Key** (例如：`APxxxxxxxxxxxxx`)
   - **API Secret** (例如：`xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

### 方法 2: 從 Overview 頁面取得

1. 在專案的 **「Overview」** 頁面
2. 尋找 **「Quick Start」** 或 **「Getting Started」** 區塊
3. 通常會顯示連接資訊，包括：
   - WebSocket URL
   - API Key
   - API Secret

### 方法 3: 建立新的 API Key（可選）

如果需要建立新的 API Key：

1. 前往 **「Settings」** → **「Keys」**
2. 點擊 **「Create Key」** 或 **「Generate New Key」**
3. 為 Key 命名（例如：`rt_talker_dev`）
4. 選擇權限範圍（通常選擇「Full Access」用於開發）
5. 點擊「Create」或「Generate」
6. **重要**：立即複製 API Key 和 API Secret，因為 Secret 只會顯示一次

## 步驟 4: 複製憑證資訊

您需要複製以下三個值：

1. **WebSocket URL** (LIVEKIT_URL)
   - 格式：`wss://your-project-name.livekit.cloud`
   - 範例：`wss://rt-talker-abc123.livekit.cloud`

2. **API Key** (LIVEKIT_API_KEY)
   - 格式：通常以 `AP` 開頭
   - 範例：`APxxxxxxxxxxxxx`

3. **API Secret** (LIVEKIT_API_SECRET)
   - 格式：長字串
   - 範例：`xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## 步驟 5: 設定到 .env 檔案

1. 在專案根目錄找到或建立 `.env` 檔案
2. 加入以下內容（替換為您的實際值）：

```env
# LiveKit Configuration
LIVEKIT_URL=wss://your-project-name.livekit.cloud
LIVEKIT_API_KEY=APxxxxxxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 完整 .env 檔案範例

```env
# LiveKit Configuration
LIVEKIT_URL=wss://rt-talker-abc123.livekit.cloud
LIVEKIT_API_KEY=APxxxxxxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# OpenAI Configuration
NEXT_PUBLIC_OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Server Configuration
PORT=3001
```

## 步驟 6: 驗證設定

1. 確認 `.env` 檔案已正確儲存
2. 重新啟動後端伺服器：
   ```bash
   # 停止現有伺服器（如果正在運行）
   # 然後重新啟動
   npm run server
   ```
3. 檢查伺服器日誌，應該會顯示：
   ```
   Server running on http://localhost:3001
   LiveKit URL: wss://your-project-name.livekit.cloud
   ```

## 步驟 7: 測試連接

1. 確保後端伺服器正在運行（port 3001）
2. 確保前端開發伺服器正在運行（port 3003）
3. 在瀏覽器中開啟 `http://localhost:3003`
4. 點擊「Start Conversation」按鈕
5. 如果設定正確，連接狀態應該會從 "Disconnected" 變為 "Connecting"，然後變為 "Connected"

## 常見問題

### Q: 找不到 API Key 和 Secret？
A: 
- 確認您已登入正確的專案
- 檢查是否在「Settings」或「Project Settings」頁面
- 某些專案可能需要先啟用 API 功能

### Q: API Secret 遺失了怎麼辦？
A: 
- API Secret 只會顯示一次
- 如果遺失，需要建立新的 API Key
- 前往 Settings → Keys → Create New Key

### Q: WebSocket URL 格式不正確？
A: 
- 確認 URL 以 `wss://` 開頭（不是 `ws://`）
- 確認 URL 包含完整的專案名稱和域名
- 範例格式：`wss://your-project.livekit.cloud`

### Q: 連接時出現 "Unauthorized" 錯誤？
A: 
- 檢查 API Key 和 Secret 是否正確複製（沒有多餘空格）
- 確認使用的是正確專案的憑證
- 重新啟動後端伺服器以載入新的環境變數

### Q: 免費方案有限制嗎？
A: 
- LiveKit 提供免費方案（Free Tier）
- 通常有使用量限制（如每月參與者分鐘數）
- 檢查您的專案儀表板查看使用量

## 安全提醒

- ⚠️ **永遠不要將 `.env` 檔案提交到 Git 倉庫**
- ⚠️ `.env` 檔案已包含在 `.gitignore` 中
- ⚠️ 不要在公開場所分享您的 API Secret
- ⚠️ 定期輪換 API Key（如果可能）
- ⚠️ 在生產環境中，使用安全的環境變數管理系統

## 相關連結

- [LiveKit Cloud](https://cloud.livekit.io/)
- [LiveKit 文件](https://docs.livekit.io/)
- [LiveKit 定價](https://livekit.io/pricing)

## 下一步

設定完成後：
1. 重新啟動後端伺服器
2. 測試應用程式連接
3. 如果仍有問題，檢查瀏覽器控制台的錯誤訊息

