# AI Tool Usage Documentation

This document describes the AI tools used during the development of this project and the key prompts that helped accomplish various tasks.

## AI Tools Used

- **Claude (Sonnet 4.5)**: Primary AI assistant used for code generation, architecture decisions, and problem-solving throughout the project

## Key Prompts and Their Impact

### 1. Initial Project Setup and Structure

**Prompt:**
```
根據此take home程式面試作業的敘述建構此專案

[Full project requirements provided]
```

**What it accomplished:**
- Generated the complete project structure with Next.js, TypeScript, and Express backend
- Created all necessary configuration files (package.json, tsconfig.json, next.config.js)
- Established the foundation for both frontend and backend components
- Set up proper TypeScript configuration and ESLint rules

**Why it worked well:**
- The prompt provided comprehensive requirements, allowing the AI to understand the full scope
- Clear specification of tech stack (Next.js, React, TypeScript, LiveKit, OpenAI) enabled accurate setup

---

### 2. LiveKit Integration and Audio Processing

**Prompt:**
```
建立後端服務 (Node.js/Express) 用於生成 LiveKit tokens
整合 LiveKit 客戶端 SDK 與音訊處理
```

**What it accomplished:**
- Created Express server endpoint for generating LiveKit access tokens
- Implemented proper token generation with room permissions
- Set up LiveKit client-side integration with Room API
- Implemented microphone capture and audio streaming
- Added connection lifecycle management (connect/disconnect events)

**Why it worked well:**
- Specific technology requirements (LiveKit SDK) enabled accurate implementation
- The AI understood the token-based authentication pattern required by LiveKit

---

### 3. OpenAI Realtime API Integration

**Prompt:**
```
整合 OpenAI Realtime API 進行 AI 語音對話
```

**What it accomplished:**
- Created WebSocket connection to OpenAI Realtime API
- Implemented audio format conversion (PCM16)
- Set up message handling for transcription and AI responses
- Created custom React hook for managing AI conversation state

**Why it worked well:**
- The AI understood the WebSocket-based architecture of OpenAI Realtime API
- Properly implemented the event-driven message handling pattern

**Challenges encountered:**
- Initial implementation used a simplified placeholder approach
- Needed refinement to properly handle WebSocket connection lifecycle
- Audio format conversion required specific knowledge of PCM16 encoding

---

### 4. UI Component Development

**Prompt:**
```
建立前端 UI 組件 (按鈕、狀態指示器等)
```

**What it accomplished:**
- Created reusable React components (ConnectionStatus, ConversationControls, MicrophoneStatus)
- Implemented clean, modern UI with CSS-in-JS styling
- Added visual feedback for connection states and microphone status
- Created responsive design with proper animations

**Why it worked well:**
- Clear component requirements enabled focused implementation
- The AI generated well-structured, reusable components

---

### 5. Error Handling and Edge Cases

**Prompt:**
```
處理基本錯誤情況
```

**What it accomplished:**
- Added comprehensive error handling in backend token generation
- Implemented environment variable validation
- Added user-friendly error messages in the frontend
- Created proper cleanup functions for WebSocket and LiveKit connections

**Why it worked well:**
- The AI understood the importance of graceful error handling
- Generated defensive code that checks for missing configuration

---

## Prompts That Didn't Work Well

### Attempted: Direct OpenAI Realtime API WebSocket Implementation

**Initial Prompt:**
```
How to integrate OpenAI Realtime API with WebSocket for voice conversation
```

**Why it didn't work initially:**
- The semantic search didn't find existing implementations in the codebase (as expected for a new project)
- The AI initially provided a simplified placeholder approach rather than a full WebSocket implementation
- Required multiple iterations to refine the implementation

**Solution:**
- Manually refined the implementation based on OpenAI Realtime API documentation patterns
- Created a more complete WebSocket connection handler with proper message parsing

---

## Development Workflow

1. **Initial Setup**: Used AI to generate project structure and configuration files
2. **Backend Development**: Generated Express server with LiveKit token endpoint
3. **Frontend Components**: Created React components with TypeScript
4. **Integration**: Connected LiveKit and OpenAI APIs
5. **Refinement**: Manually adjusted AI-generated code for production readiness

## Key Learnings

- **Specific Prompts Work Better**: Providing detailed requirements and tech stack information yields better results
- **Iterative Refinement**: Initial AI output often needs refinement for production use
- **Documentation Matters**: Clear documentation helps AI understand context better
- **Error Handling**: Always ask AI to include error handling and edge cases

---

### 6. Port 配置和伺服器管理

**Prompt:**
```
現在port 3000被其他服務佔用請使用別的port
```

**What it accomplished:**
- 將前端 port 從 3000 改為 3003
- 更新所有相關文件中的 port 說明
- 修正後端伺服器的 port 配置問題

**Why it worked well:**
- 明確的問題描述讓 AI 能快速定位並修正

---

### 7. LiveKit 憑證設定

**Prompt:**
```
GUI顯示disconnected 後端可能需要livekit憑證 請告訴我怎麼取得livekit憑證
```

**What it accomplished:**
- 建立詳細的 LiveKit 憑證取得指南 (`LIVEKIT_SETUP_GUIDE.md`)
- 提供逐步操作說明
- 包含常見問題解答

**Why it worked well:**
- 用戶提供了具體的問題描述，AI 能針對性地提供解決方案

---

### 8. OpenAI API 驗證和測試

**Prompt:**
```
已經更新.env檔案 幫我確認是否可以使用realtime API了 請幫我執行:
- 重新啟動開發伺服器
- 測試應用程式
```

**What it accomplished:**
- 建立 OpenAI API 測試腳本 (`scripts/test-openai.js`)
- 驗證 API key 有效性
- 測試 Realtime API 連接
- 自動化伺服器啟動流程

**Why it worked well:**
- 明確的任務列表讓 AI 能系統性地完成所有步驟

---

### 9. 麥克風啟用錯誤修正

**Prompt:**
```
遭遇以下錯誤
[TypeError: Cannot read properties of undefined (reading 'values')]
```

**What it accomplished:**
- 修正 LiveKit audioTracks API 使用方式
- 改用正確的 `audioTrackPublications` API
- 添加 fallback 機制（使用 getUserMedia）
- 改進錯誤處理

**Why it worked well:**
- 具體的錯誤訊息讓 AI 能快速定位問題
- 提供了完整的錯誤上下文

---

### 10. WebSocket 代理和 Blob 處理

**Prompt:**
```
看起來還是報錯
[SyntaxError: Unexpected token 'o', "[object Blob]" is not valid JSON]
```

**What it accomplished:**
- 建立後端 WebSocket 代理伺服器
- 處理瀏覽器無法設置 Authorization header 的問題
- 修正 Blob/ArrayBuffer 到字串的轉換
- 改進訊息解析邏輯

**Why it worked well:**
- 錯誤訊息明確指出了問題類型（Blob vs JSON）
- AI 能理解 WebSocket 在瀏覽器中的限制

---

### 11. 音訊處理和結果顯示優化

**Prompt:**
```
還是沒有我講話的結果
還是因為我講完錄音之後 在分析結果出來之前 太早關掉對話了 導致結果顯示不出來?
```

**What it accomplished:**
- 改進音訊處理時機（批量處理，每 1-2 秒）
- 分離音訊發送和回應觸發邏輯
- 改進斷開連接時的結果保存邏輯
- 添加 UI 更新回調機制
- 改進錯誤日誌顯示

**Why it worked well:**
- 用戶提供了很好的觀察（太早關閉可能導致結果丟失）
- AI 能理解問題並提供多方面的改進

---

## 當前狀態和待解決問題

### 主要問題：OpenAI Realtime API server_error

**問題描述：**
- 連接 OpenAI Realtime API 後立即收到 `server_error`
- 錯誤訊息：`The server had an error while processing your request`
- WebSocket 連接立即關閉（code 1000）

**已嘗試的解決方案：**
1. ✅ 建立後端 WebSocket 代理（解決認證問題）
2. ✅ 修正 Blob 處理問題
3. ✅ 改進音訊格式轉換
4. ✅ 優化訊息處理邏輯

**可能的原因：**
- OpenAI Realtime API 的使用方式不正確
- 音訊格式或參數設定有誤
- API 版本或模型名稱不正確
- 需要特定的初始化流程

**下一步：**
- 查閱 OpenAI Realtime API 官方文件
- 檢查 API 使用範例
- 驗證音訊格式和參數
- 可能需要聯繫 OpenAI 支援

---

## Development Workflow

1. **Initial Setup**: Used AI to generate project structure and configuration files
2. **Backend Development**: Generated Express server with LiveKit token endpoint
3. **Frontend Components**: Created React components with TypeScript
4. **Integration**: Connected LiveKit and OpenAI APIs
5. **Troubleshooting**: Iteratively fixed connection and audio processing issues
6. **Current**: Working on OpenAI Realtime API connection stability

## Key Learnings

- **Specific Prompts Work Better**: Providing detailed requirements and tech stack information yields better results
- **Iterative Refinement**: Initial AI output often needs refinement for production use
- **Documentation Matters**: Clear documentation helps AI understand context better
- **Error Handling**: Always ask AI to include error handling and edge cases
- **User Feedback is Valuable**: User observations (like "too early disconnect") help identify real issues
- **Browser Limitations**: WebSocket in browsers has limitations (no custom headers), requiring backend proxies

## Conclusion

AI tools significantly accelerated the development process, especially for:
- Project structure setup
- API integration patterns
- Component architecture
- Configuration file generation
- Troubleshooting and debugging
- Documentation creation

However, manual refinement was necessary for:
- Complex WebSocket implementations
- Audio format conversions
- Production-ready error handling
- Security considerations
- Browser-specific limitations
- API-specific requirements

The combination of AI assistance and manual refinement resulted in a mostly functional application. The core infrastructure is complete, but there's an ongoing issue with OpenAI Realtime API connection that requires further investigation.

**Current Completion Status**: ~70%
- ✅ Core infrastructure: 100%
- ✅ LiveKit integration: 100%
- ✅ UI components: 100%
- ✅ OpenAI integration: 60% (connection works but has server_error)
- ✅ Audio processing: 80% (works but results not displaying)
- ✅ Documentation: 100%

