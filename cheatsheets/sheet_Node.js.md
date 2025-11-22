# Node.js Cheat Sheet

## 基本模組

| 模組 | 用途 | 導入方式 |
|------|------|---------|
| `http` | HTTP 伺服器 | `const http = require('http')` |
| `https` | HTTPS 伺服器 | `const https = require('https')` |
| `fs` | 檔案系統 | `const fs = require('fs')` |
| `path` | 路徑處理 | `const path = require('path')` |
| `url` | URL 處理 | `const url = require('url')` |
| `crypto` | 加密功能 | `const crypto = require('crypto')` |

## 環境變數

| 方法 | 用途 | 範例 |
|------|------|------|
| `process.env.VAR` | 讀取環境變數 | `const port = process.env.PORT` |
| `process.env.VAR || default` | 預設值 | `const port = process.env.PORT || 3001` |
| `dotenv.config()` | 載入 .env 檔案 | `require('dotenv').config()` |

## 專案中的使用

| 檔案 | 使用的模組 | 用途 |
|------|----------|------|
| `server/index.js` | `http`, `express` | HTTP 伺服器 |
| `server/index.js` | `dotenv` | 環境變數管理 |
| `scripts/test-openai.js` | `https`, `crypto` | API 測試 |

## 常見問題解決方案

| 問題 | 解決方案 |
|------|---------|
| 模組未找到 | 確認 `node_modules` 已安裝 |
| 環境變數未載入 | 確認 `dotenv.config()` 已調用 |
| Port 被佔用 | 更改 PORT 或終止佔用進程 |
| 權限錯誤 | 檢查檔案權限 |

## 最佳實踐

| 實踐 | 說明 |
|------|------|
| 環境變數 | 使用 `dotenv` 管理配置 |
| 錯誤處理 | 使用 try-catch 處理錯誤 |
| 非同步處理 | 使用 async/await 或 Promise |
| 模組化 | 將功能拆分為不同模組 |
| 日誌記錄 | 使用 `console.log` 或日誌庫 |

## 常用命令

| 命令 | 用途 | 範例 |
|------|------|------|
| `node script.js` | 執行腳本 | `node server/index.js` |
| `npm install` | 安裝依賴 | `npm install` |
| `npm run script` | 執行 npm 腳本 | `npm run server` |
| `npm start` | 啟動應用 | `npm start` |

## 版本管理

| 檔案 | 用途 | 範例 |
|------|------|------|
| `package.json` | 專案配置 | 定義依賴和腳本 |
| `.nvmrc` | Node 版本 | `18.0.0` |
| `engines` | 版本要求 | `"node": ">=18.0.0"` |

