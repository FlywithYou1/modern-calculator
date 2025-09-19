/**
 * 科学计算器类型定义
 * 定义应用中使用的所有数据结构和接口
 */

// ==================== 基础类型 ====================

/**
 * 设备类型枚举
 */
export type DeviceType = 'desktop' | 'tablet' | 'mobile'

/**
 * 主题模式枚举
 */
export type ThemeMode = 'light' | 'dark' | 'auto'

/**
 * 操作类型枚举
 */
export type Operation = 'number' | 'operator' | 'function' | 'constant' | 'action' | 'bracket'

// ==================== 计算器状态类型 ====================

/**
 * 计算器主状态
 */
export interface CalculatorState {
  expression: string
  result: string
  memory: string
  lastOperation: string | null
  isCalculating: boolean
  errorMessage: string | null
  settings: CalculatorSettings
  history: HistoryItem[]
}

/**
 * 计算器设置
 */
export interface CalculatorSettings {
  theme: ThemeMode
  precision: number
  angleUnit: 'degrees' | 'radians' | 'gradians'
  enableAnimations: boolean
  enableHaptics: boolean
  compactMode: boolean
  showHistory: boolean
  showMemory: boolean
  enableKeyboardShortcuts: boolean
}

// ==================== UI 组件类型 ====================

/**
 * 按钮配置
 */
export interface ButtonConfig {
  id: string
  text: string
  label: string
  value: string
  type: Operation
  operation: {
    type: Operation
    value: string
    symbol: string
  }
  className?: string
  disabled?: boolean
  tooltip?: string
}

/**
 * 显示器配置
 */
export interface DisplayConfig {
  precision: number
  theme: Theme
  fontSize?: number
  showExpression?: boolean
  showResult?: boolean
  animationDuration?: number
}

/**
 * 键盘配置
 */
export interface KeyboardConfig {
  theme: Theme
  enableHaptic: boolean
  buttonSize?: 'small' | 'medium' | 'large'
  layout?: 'standard' | 'scientific' | 'programmer'
  onInput?: (value: string, type: Operation) => void
  config?: CalculatorConfig
}

/**
 * 历史记录配置
 */
export interface HistoryConfig {
  maxItems: number
  showTimestamp?: boolean
  showTags?: boolean
  onHistoryItemSelect?: (item: HistoryItem) => void
  onHistoryClear?: () => void
}

// ==================== 应用状态 ====================

/**
 * 应用主状态
 */
export interface AppState {
  currentExpression: string
  result: string
  previousResult: string
  isNewExpression: boolean
  hasError: boolean
  errorMessage: string
  memory: string
  history: HistoryItem[]
  showingHistory: boolean
  showingSettings: boolean
}

// ==================== 历史记录 ====================

/**
 * 历史记录项
 */
export interface HistoryItem {
  id: string
  expression: string
  result: string
  timestamp: string
  tags?: string[]
  notes?: string
}

/**
 * 历史记录统计信息
 */
export interface HistoryStats {
  totalCalculations: number
  averageExpressionLength: number
  mostUsedOperations: { [key: string]: number }
  calculationsToday: number
  calculationsThisWeek: number
  calculationsThisMonth: number
}

// ==================== 主题系统 ====================

/**
 * 颜色配置
 */
export interface ColorPalette {
  primary: string
  secondary: string
  background: string
  surface: string
  text: string
  textSecondary: string
  accent?: string
  error?: string
  warning?: string
  success?: string
}

/**
 * 主题配置
 */
export interface Theme {
  name: string
  mode: ThemeMode
  type: 'builtin' | 'custom'
  colors: ColorPalette
  cssVariables: { [key: string]: string }
}

/**
 * 主题配置接口
 */
export interface ThemeConfig extends Theme {
  author?: string
  description?: string
  preview?: string
  favorite?: boolean
}

/**
 * 操作类型枚举 (deprecated, use Operation)
 */
export type OperationType = Operation

// ==================== 设置系统 ====================

/**
 * 显示设置
 */
export interface DisplaySettings {
  decimalPlaces: number
  scientificNotation: boolean
  thousandSeparator: boolean
  angleUnit: 'degrees' | 'radians'
  fontSize: number
}

/**
 * 布局设置
 */
export interface LayoutSettings {
  buttonSize: 'small' | 'medium' | 'large'
  keyboardLayout: 'standard' | 'scientific' | 'programmer'
  compactMode: boolean
  showHistory: boolean
}

/**
 * 通用设置
 */
export interface GeneralSettings {
  enableHaptic: boolean
  maxHistoryItems: number
  autoSaveHistory: boolean
  enableKeyboardShortcuts: boolean
  enableAnimations: boolean
}

/**
 * 完整应用设置
 */
export interface AppSettings {
  theme: Theme
  display: DisplaySettings
  layout: LayoutSettings
  general: GeneralSettings
}

// ==================== 计算器配置 ====================

/**
 * 计算器配置
 */
export interface CalculatorConfig {
  precision: number
  theme: string
  enableHaptic: boolean
  maxHistoryItems: number
  angleMode: 'degrees' | 'radians' | 'gradians'
  outputFormat: 'decimal' | 'fraction' | 'scientific'
  complexMode: boolean
  memoryRegisters: number
  enableKeyboardShortcuts: boolean
  autoSaveHistory: boolean
}

// ==================== 扩展类型 ====================

/**
 * 扩展全局 ImportMeta 接口
 */
declare global {
  interface ImportMeta {
    readonly env: ImportMetaEnv
    readonly hot?: {
      readonly data: unknown
      accept(): void
      accept(cb: (mod: unknown) => void): void
      accept(dep: string, cb: (mod: unknown) => void): void
      accept(deps: string[], cb: (mod: unknown) => void): void
      dispose(cb: (data: unknown) => void): void
      decline(): void
      invalidate(): void
      on<T extends string>(event: T, cb: (payload: unknown) => void): void
    }
  }

  interface ImportMetaEnv {
    readonly DEV: boolean
    readonly PROD: boolean
    readonly MODE: string
    readonly TAURI_PLATFORM?: string
    readonly TAURI_ARCH?: string
    readonly TAURI_FAMILY?: string
    readonly TAURI_PLATFORM_VERSION?: string
    readonly TAURI_PLATFORM_TYPE?: string
  }
}

export {}
