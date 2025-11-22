# TypeScript Cheat Sheet

## 基本類型

| 類型 | 語法 | 範例 |
|------|------|------|
| 字串 | `string` | `const name: string = "John"` |
| 數字 | `number` | `const age: number = 30` |
| 布林 | `boolean` | `const isActive: boolean = true` |
| 陣列 | `type[]` 或 `Array<type>` | `const items: string[] = []` |
| 物件 | `{ key: type }` | `const obj: { name: string } = { name: "John" }` |
| 函數 | `(param: type) => returnType` | `const fn: (x: number) => string` |
| 聯合 | `type1 \| type2` | `const value: string \| number` |
| 可選 | `type?` | `const name?: string` |
| 只讀 | `readonly type` | `readonly items: string[]` |

## 介面 (Interface)

| 語法 | 用途 | 範例 |
|------|------|------|
| `interface Name { ... }` | 定義物件形狀 | `interface User { name: string }` |
| 繼承 | `interface B extends A` | 擴展介面 |
| 可選屬性 | `property?: type` | 可選的屬性 |
| 只讀屬性 | `readonly property: type` | 只讀屬性 |

## 類型別名 (Type Alias)

| 語法 | 用途 | 範例 |
|------|------|------|
| `type Name = ...` | 定義類型別名 | `type ID = string \| number` |
| 聯合類型 | `type A = B \| C` | 多個類型的聯合 |
| 交叉類型 | `type A = B & C` | 多個類型的交集 |

## 泛型 (Generics)

| 語法 | 用途 | 範例 |
|------|------|------|
| `<T>` | 類型參數 | `function fn<T>(x: T): T` |
| 約束 | `<T extends Type>` | 限制泛型類型 |
| 預設值 | `<T = string>` | 預設類型參數 |

## React + TypeScript

| 模式 | 語法 | 範例 |
|------|------|------|
| 組件 Props | `interface Props { ... }` | `function Component({ prop }: Props)` |
| 事件處理 | `React.MouseEvent` | `(e: React.MouseEvent) => void` |
| Ref | `useRef<Type>(null)` | `const ref = useRef<HTMLDivElement>(null)` |
| 狀態 | `useState<Type>(initial)` | `const [state, setState] = useState<string>('')` |

## 專案中的使用

| 檔案 | 類型定義 | 用途 |
|------|---------|------|
| `useOpenAIRealtime.ts` | `RealtimeMessage`, `AIResult` | OpenAI API 訊息類型 |
| `VoiceConversation.tsx` | `ConnectionState` | 連接狀態類型 |
| `tsconfig.json` | 編譯配置 | TypeScript 編譯選項 |

## 常見問題解決方案

| 問題 | 解決方案 |
|------|---------|
| 類型錯誤 | 檢查類型定義是否正確 |
| `any` 類型 | 盡量避免，使用具體類型 |
| 未定義屬性 | 使用可選屬性 `?` 或聯合類型 |
| 類型斷言 | 使用 `as` 或 `<>` 語法 |

## 最佳實踐

| 實踐 | 說明 |
|------|------|
| 明確類型 | 避免使用 `any` |
| 介面優先 | 使用 `interface` 定義物件形狀 |
| 類型推斷 | 讓 TypeScript 自動推斷類型 |
| 嚴格模式 | 啟用嚴格類型檢查 |
| 類型註解 | 為函數參數和返回值添加類型 |

## tsconfig.json 重要選項

| 選項 | 說明 | 值 |
|------|------|-----|
| `strict` | 啟用嚴格模式 | `true` |
| `target` | 編譯目標 | `"ES2020"` |
| `module` | 模組系統 | `"ESNext"` |
| `jsx` | JSX 處理 | `"preserve"` |
| `esModuleInterop` | ES 模組互操作 | `true` |

