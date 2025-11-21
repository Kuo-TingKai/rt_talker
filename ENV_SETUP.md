# Environment Variables Setup

This file explains how to set up the required environment variables for this project.

## Required Environment Variables

Create a `.env` file in the root directory with the following variables:

### LiveKit Configuration

```env
LIVEKIT_URL=wss://your-livekit-server.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
```

**How to get LiveKit credentials:**
1. Go to [livekit.io](https://livekit.io) and sign up for a free account
2. Create a new project
3. Navigate to your project settings
4. Copy the WebSocket URL, API Key, and API Secret

### OpenAI Configuration

```env
NEXT_PUBLIC_OPENAI_API_KEY=your-openai-api-key
```

**How to get OpenAI API key:**
1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or log in (可以使用 Google、Microsoft、Apple 帳號或電子郵件註冊)
3. 完成電子郵件和電話號碼驗證（如需要）
4. Navigate to [API Keys 頁面](https://platform.openai.com/api-keys)
5. Click "Create new secret key" 按鈕
6. **重要**: 複製並妥善保存 API key，因為關閉頁面後將無法再次查看
7. 建議為此專案建立一個新的 API key，並給予描述性名稱（如 "rt_talker_project"）

**How to get OpenAI Realtime API access:**
1. **檢查 Realtime API 可用性**:
   - 前往 [OpenAI Realtime API 文件](https://platform.openai.com/docs/guides/realtime)
   - 查看當前是否需要申請或已在您的帳號中啟用

2. **申請 Realtime API 存取權限**（如需要）:
   - 目前 Realtime API 可能處於封閉測試階段
   - 前往 [OpenAI Platform](https://platform.openai.com) 並登入
   - 查看是否有 "Realtime API" 或 "Beta Features" 的申請選項
   - 或聯繫 OpenAI 支援團隊說明您的使用案例

3. **驗證存取權限**:
   - 在 API Keys 頁面確認您的帳號狀態
   - 檢查是否有 Realtime API 相關的設定選項
   - 嘗試使用 API key 連接 Realtime API（如果已啟用）

4. **替代方案**（如果 Realtime API 尚未可用）:
   - 可以使用 OpenAI 的 Whisper API 進行語音轉文字
   - 使用 GPT-4 進行文字對話
   - 使用 Text-to-Speech API 生成語音回應
   - 這些功能可以組合使用來實現類似的體驗

### Server Configuration

```env
PORT=3001
```

This is optional - defaults to 3001 if not set.

## Example .env File

```env
# LiveKit Configuration
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=APxxxxxxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# OpenAI Configuration
NEXT_PUBLIC_OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Server Configuration (optional)
PORT=3001
```

## Security Notes

- **Never commit your `.env` file to version control**
- The `.env` file is already included in `.gitignore`
- For production, use secure environment variable management (e.g., Vercel, AWS Secrets Manager)
- The `NEXT_PUBLIC_` prefix is required for Next.js to expose the variable to the browser
- Consider using a backend proxy for OpenAI API key in production instead of exposing it to the client

