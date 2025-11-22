# React Cheat Sheet

## 基本 Hooks

| Hook | 用途 | 範例 |
|------|------|------|
| `useState` | 狀態管理 | `const [state, setState] = useState(initial)` |
| `useEffect` | 副作用處理 | `useEffect(() => { ... }, [deps])` |
| `useRef` | 引用 DOM 或值 | `const ref = useRef(initialValue)` |
| `useCallback` | 記憶化函數 | `const fn = useCallback(() => { ... }, [deps])` |
| `useMemo` | 記憶化值 | `const value = useMemo(() => compute(), [deps])` |
| `useContext` | 上下文存取 | `const value = useContext(MyContext)` |

## 組件生命週期

| 階段 | Hook | 用途 |
|------|------|------|
| 掛載 | `useEffect(() => { ... }, [])` | 組件掛載時執行 |
| 更新 | `useEffect(() => { ... }, [deps])` | 依賴變化時執行 |
| 卸載 | `useEffect(() => () => { ... }, [])` | 組件卸載時清理 |

## 狀態管理模式

| 模式 | 使用場景 | 範例 |
|------|---------|------|
| Local State | 組件內部狀態 | `useState` |
| Lifted State | 多組件共享 | 提升到父組件 |
| Context API | 全局狀態 | `createContext` + `useContext` |
| Refs | 不需要觸發重渲染的值 | `useRef` |

## 事件處理

| 事件 | 處理方式 | 範例 |
|------|---------|------|
| onClick | `onClick={handler}` | 按鈕點擊 |
| onChange | `onChange={(e) => setValue(e.target.value)}` | 輸入變化 |
| onSubmit | `onSubmit={handleSubmit}` | 表單提交 |

## 條件渲染

| 模式 | 語法 | 範例 |
|------|------|------|
| 三元運算 | `condition ? <A /> : <B />` | 簡單條件 |
| 邏輯 AND | `condition && <Component />` | 單一條件 |
| 早期返回 | `if (!condition) return null` | 複雜條件 |

## 列表渲染

| 模式 | 語法 | 範例 |
|------|------|------|
| map | `items.map(item => <Item key={id} />)` | 基本列表 |
| 過濾 | `items.filter(...).map(...)` | 過濾後渲染 |

## 專案中的使用

| 檔案 | 使用的 Hooks | 用途 |
|------|------------|------|
| `VoiceConversation.tsx` | `useState`, `useEffect`, `useRef` | 主對話組件 |
| `useOpenAIRealtime.ts` | `useState`, `useRef`, `useCallback` | 自訂 Hook |
| `ConnectionStatus.tsx` | `useState` | 連接狀態顯示 |
| `ConversationControls.tsx` | - | 控制按鈕組件 |

## 常見問題解決方案

| 問題 | 解決方案 |
|------|---------|
| 無限重渲染 | 檢查 `useEffect` 依賴陣列 |
| 狀態未更新 | 確認使用 `setState` 而非直接修改 |
| 記憶體洩漏 | 在 `useEffect` 清理函數中取消訂閱 |
| 過度重渲染 | 使用 `useMemo` 或 `useCallback` |

## 最佳實踐

| 實踐 | 說明 |
|------|------|
| 組件拆分 | 保持組件小而專注 |
| 自訂 Hooks | 提取可重用邏輯 |
| 鍵值屬性 | 列表渲染時提供唯一 `key` |
| 條件渲染 | 使用早期返回簡化邏輯 |
| 狀態提升 | 共享狀態提升到共同父組件 |

