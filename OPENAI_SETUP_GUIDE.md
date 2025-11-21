# OpenAI API Key 與 Realtime API 設定指南

本指南將詳細說明如何取得 OpenAI API Key 以及申請 Realtime API 存取權限。

## 步驟 1: 註冊 OpenAI 帳號

1. 前往 [OpenAI 官方網站](https://openai.com/)
2. 點擊右上角的「Sign Up」進行註冊
3. 您可以使用以下方式註冊：
   - Google 帳號
   - Microsoft 帳號
   - Apple 帳號
   - 電子郵件地址

## 步驟 2: 驗證帳號

1. **驗證電子郵件**：
   - 檢查您的電子郵件信箱
   - 點擊 OpenAI 發送的驗證連結

2. **驗證電話號碼**（如需要）：
   - 登入後，系統可能會要求您驗證電話號碼
   - 輸入您的手機號碼
   - 接收並輸入驗證碼

## 步驟 3: 設定付款方式（如需要）

1. 前往 [Billing 頁面](https://platform.openai.com/account/billing)
2. 添加付款方式（信用卡）
3. **注意**：OpenAI API 按使用量收費，請查看 [定價頁面](https://openai.com/pricing) 了解詳細費用

## 步驟 4: 取得 API Key

1. 登入 [OpenAI Platform](https://platform.openai.com)
2. 點擊左側選單的「API keys」或直接前往 [API Keys 頁面](https://platform.openai.com/api-keys)
3. 點擊「Create new secret key」按鈕
4. 為 API key 命名（例如："rt_talker_project"）
5. **重要**：立即複製 API key 並妥善保存
   - ⚠️ **API key 只會顯示一次**，關閉頁面後將無法再次查看
   - 建議將 API key 保存在安全的地方（如密碼管理器）
6. 點擊「Create secret key」完成建立

## 步驟 5: 申請 Realtime API 存取權限

### 方法 1: 檢查是否已啟用

1. 前往 [OpenAI Realtime API 文件](https://platform.openai.com/docs/guides/realtime)
2. 查看文件中的「Getting Started」部分
3. 嘗試使用您的 API key 連接 Realtime API
4. 如果連接成功，表示您已有存取權限

### 方法 2: 申請 Beta 功能存取

1. 登入 [OpenAI Platform](https://platform.openai.com)
2. 查看是否有「Beta Features」或「Experimental Features」選項
3. 尋找「Realtime API」相關的申請選項
4. 填寫申請表單，說明您的使用案例

### 方法 3: 聯繫 OpenAI 支援

1. 前往 [OpenAI 支援中心](https://help.openai.com/)
2. 提交支援請求
3. 說明您需要 Realtime API 存取權限
4. 描述您的專案用途（例如：建立即時語音對話應用程式）

### 方法 4: 查看 OpenAI 官方公告

1. 關注 [OpenAI 官方部落格](https://openai.com/blog)
2. 查看是否有 Realtime API 公開測試的公告
3. 按照公告中的指示申請存取權限

## 步驟 6: 驗證 API Key 和權限

### 測試 API Key 是否有效

您可以使用以下方式測試：

1. **使用 curl 測試**（在終端機中）：
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

如果返回模型列表，表示 API key 有效。

2. **測試 Realtime API**（如果已啟用）：
   - 嘗試建立 WebSocket 連接到 Realtime API
   - 檢查連接是否成功

## 步驟 7: 設定環境變數

將取得的 API key 加入到專案的 `.env` 檔案：

```env
NEXT_PUBLIC_OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**安全提醒**：
- ⚠️ 永遠不要將 API key 提交到 Git 倉庫
- ⚠️ `.env` 檔案已包含在 `.gitignore` 中
- ⚠️ 在生產環境中，使用安全的環境變數管理系統

## 如果 Realtime API 尚未可用

如果目前無法取得 Realtime API 存取權限，您可以：

### 替代方案 1: 使用組合 API

1. **語音轉文字**：使用 [Whisper API](https://platform.openai.com/docs/guides/speech-to-text)
2. **文字對話**：使用 [Chat Completions API](https://platform.openai.com/docs/guides/text-generation)
3. **文字轉語音**：使用 [Text-to-Speech API](https://platform.openai.com/docs/guides/text-to-speech)

### 替代方案 2: 使用其他 AI 語音服務

- **Deepgram**: 提供即時語音轉文字和語音對話 API
- **ElevenLabs**: 提供高品質的語音合成
- **AssemblyAI**: 提供即時語音轉文字服務

## 常見問題

### Q: API key 遺失了怎麼辦？
A: 您需要建立一個新的 API key，舊的 key 無法恢復。建議立即撤銷舊的 key 以確保安全。

### Q: Realtime API 何時會公開？
A: 請關注 OpenAI 官方公告，目前可能處於封閉測試階段。

### Q: 使用 API 需要多少費用？
A: 請查看 [OpenAI 定價頁面](https://openai.com/pricing) 了解詳細費用。Realtime API 的定價可能與標準 API 不同。

### Q: 如何保護我的 API key？
A: 
- 永遠不要在客戶端程式碼中硬編碼 API key
- 使用環境變數管理
- 定期輪換 API key
- 監控 API 使用情況

## 相關連結

- [OpenAI Platform](https://platform.openai.com)
- [API Keys 管理](https://platform.openai.com/api-keys)
- [Realtime API 文件](https://platform.openai.com/docs/guides/realtime)
- [OpenAI 支援中心](https://help.openai.com/)
- [定價資訊](https://openai.com/pricing)

## 下一步

取得 API key 後，請：
1. 將 API key 加入到 `.env` 檔案
2. 重新啟動開發伺服器
3. 測試應用程式是否正常運作
4. 如果 Realtime API 尚未可用，考慮使用替代方案

