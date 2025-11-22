# Express Cheat Sheet

## 基本設定

| 項目 | 語法 | 範例 |
|------|------|------|
| 建立應用 | `const app = express()` | `const app = express()` |
| 監聽端口 | `app.listen(port)` | `app.listen(3001)` |
| 中間件 | `app.use(middleware)` | `app.use(cors())` |

## 路由方法

| 方法 | 用途 | 範例 |
|------|------|------|
| `app.get()` | GET 請求 | `app.get('/api/users', handler)` |
| `app.post()` | POST 請求 | `app.post('/api/token', handler)` |
| `app.put()` | PUT 請求 | `app.put('/api/users/:id', handler)` |
| `app.delete()` | DELETE 請求 | `app.delete('/api/users/:id', handler)` |
| `app.use()` | 使用中間件 | `app.use('/api', router)` |

## 請求處理

| 屬性 | 用途 | 範例 |
|------|------|------|
| `req.body` | 請求體 | `const { name } = req.body` |
| `req.params` | 路徑參數 | `const { id } = req.params` |
| `req.query` | 查詢參數 | `const { page } = req.query` |
| `req.headers` | 請求標頭 | `const auth = req.headers.authorization` |

## 回應方法

| 方法 | 用途 | 範例 |
|------|------|------|
| `res.json()` | JSON 回應 | `res.json({ message: 'OK' })` |
| `res.send()` | 發送回應 | `res.send('Hello')` |
| `res.status()` | 設定狀態碼 | `res.status(404).json({ error: 'Not found' })` |
| `res.redirect()` | 重定向 | `res.redirect('/login')` |

## 中間件

| 中間件 | 用途 | 安裝 | 使用 |
|--------|------|------|------|
| `cors` | CORS 支援 | `npm install cors` | `app.use(cors())` |
| `express.json()` | JSON 解析 | 內建 | `app.use(express.json())` |
| `express.urlencoded()` | URL 編碼解析 | 內建 | `app.use(express.urlencoded())` |
| `dotenv` | 環境變數 | `npm install dotenv` | `require('dotenv').config()` |

## 錯誤處理

| 模式 | 語法 | 範例 |
|------|------|------|
| Try-Catch | `try { ... } catch (err) { ... }` | 同步錯誤處理 |
| 錯誤中間件 | `app.use((err, req, res, next) => { ... })` | 全局錯誤處理 |
| 非同步錯誤 | `async (req, res, next) => { try { ... } catch (err) { next(err) } }` | 非同步錯誤處理 |

## 專案中的使用

| 檔案 | 使用的功能 | 用途 |
|------|----------|------|
| `server/index.js` | `express()`, `cors()`, `express.json()` | 基本設定 |
| `server/index.js` | `app.post('/api/token')` | Token 生成端點 |
| `server/index.js` | `app.get('/health')` | 健康檢查端點 |
| `server/index.js` | `WebSocketServer` | WebSocket 代理 |

## 環境變數

| 變數 | 用途 | 範例 |
|------|------|------|
| `PORT` | 伺服器端口 | `3001` |
| `LIVEKIT_URL` | LiveKit URL | `wss://...` |
| `LIVEKIT_API_KEY` | LiveKit API Key | `...` |
| `LIVEKIT_API_SECRET` | LiveKit API Secret | `...` |
| `NEXT_PUBLIC_OPENAI_API_KEY` | OpenAI API Key | `...` |

## 常見問題解決方案

| 問題 | 解決方案 |
|------|---------|
| CORS 錯誤 | 使用 `cors()` 中間件 |
| 請求體未解析 | 使用 `express.json()` 中間件 |
| 環境變數未載入 | 確認 `dotenv.config()` 已調用 |
| Port 被佔用 | 更改 `PORT` 環境變數 |

## 最佳實踐

| 實踐 | 說明 |
|------|------|
| 錯誤處理 | 使用 try-catch 和錯誤中間件 |
| 環境變數 | 使用 `dotenv` 管理配置 |
| 中間件順序 | 注意中間件的執行順序 |
| 路由組織 | 使用 Router 組織路由 |
| 安全性 | 驗證輸入、使用 HTTPS |

## HTTP 狀態碼

| 狀態碼 | 用途 | 範例 |
|--------|------|------|
| 200 | 成功 | `res.status(200).json({ ... })` |
| 201 | 創建成功 | `res.status(201).json({ ... })` |
| 400 | 錯誤請求 | `res.status(400).json({ error: '...' })` |
| 404 | 未找到 | `res.status(404).json({ error: 'Not found' })` |
| 500 | 伺服器錯誤 | `res.status(500).json({ error: '...' })` |

