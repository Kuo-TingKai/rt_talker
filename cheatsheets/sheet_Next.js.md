# Next.js Cheat Sheet

## 基本命令

| 命令 | 說明 | 範例 |
|------|------|------|
| `next dev` | 啟動開發伺服器 | `next dev -p 3003` |
| `next build` | 建置生產版本 | `next build` |
| `next start` | 啟動生產伺服器 | `next start -p 3003` |
| `next lint` | 執行 ESLint | `next lint` |

## App Router 結構

| 檔案/資料夾 | 用途 | 範例 |
|------------|------|------|
| `app/layout.tsx` | 根佈局 | 定義 HTML 結構 |
| `app/page.tsx` | 頁面組件 | 主頁面 |
| `app/globals.css` | 全域樣式 | CSS 變數、重置樣式 |
| `app/loading.tsx` | 載入狀態 | 顯示載入中 |
| `app/error.tsx` | 錯誤頁面 | 錯誤處理 |

## 常用 Hooks 和 API

| API | 用途 | 範例 |
|-----|------|------|
| `'use client'` | 標記客戶端組件 | `'use client'` |
| `useRouter()` | 路由導航 | `const router = useRouter()` |
| `usePathname()` | 取得當前路徑 | `const pathname = usePathname()` |
| `useSearchParams()` | 取得查詢參數 | `const params = useSearchParams()` |
| `next/link` | 客戶端導航 | `<Link href="/about">About</Link>` |
| `next/image` | 優化圖片 | `<Image src="/logo.png" alt="Logo" />` |

## 配置選項 (next.config.js)

| 選項 | 說明 | 範例 |
|------|------|------|
| `reactStrictMode` | React 嚴格模式 | `reactStrictMode: true` |
| `env` | 環境變數 | `env: { CUSTOM_KEY: 'value' }` |
| `webpack` | Webpack 配置 | `webpack: (config) => { ... }` |

## 環境變數

| 變數名稱 | 用途 | 說明 |
|---------|------|------|
| `NEXT_PUBLIC_*` | 公開環境變數 | 可在客戶端使用 |
| 其他變數 | 伺服器端變數 | 僅在伺服器端可用 |

## 專案中的使用

| 檔案 | 用途 |
|------|------|
| `app/layout.tsx` | 定義根佈局和 metadata |
| `app/page.tsx` | 主頁面，渲染 VoiceConversation 組件 |
| `app/globals.css` | 全域 CSS 樣式 |
| `next.config.js` | Next.js 配置 |

## 常見問題解決方案

| 問題 | 解決方案 |
|------|---------|
| 模組載入錯誤 | 清除 `.next` 快取：`rm -rf .next` |
| Port 被佔用 | 使用 `-p` 參數指定其他 port |
| 環境變數未生效 | 確認變數名稱以 `NEXT_PUBLIC_` 開頭（客戶端） |
| 熱重載不工作 | 重新啟動開發伺服器 |

## 最佳實踐

| 實踐 | 說明 |
|------|------|
| 使用 App Router | Next.js 14+ 推薦使用 App Router |
| 客戶端組件標記 | 需要互動的組件使用 `'use client'` |
| 圖片優化 | 使用 `next/image` 組件 |
| 動態路由 | 使用 `[param]` 建立動態路由 |
| API Routes | 在 `app/api/` 建立 API 端點 |

